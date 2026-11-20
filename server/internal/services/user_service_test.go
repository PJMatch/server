package services

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/google/uuid"

	"github.com/PJMatch/server/internal/dto"
	"github.com/PJMatch/server/internal/models"
	"github.com/PJMatch/server/internal/repositories"
	"github.com/PJMatch/server/internal/utils"
)

type memoryKey struct {
	hash string
	used bool
}

type memoryUserRepo struct {
	users map[uuid.UUID]models.User
	keys  map[uuid.UUID][]memoryKey
	now   func() time.Time
}

func newMemoryUserRepo() *memoryUserRepo {
	return &memoryUserRepo{
		users: map[uuid.UUID]models.User{},
		keys:  map[uuid.UUID][]memoryKey{},
		now:   time.Now,
	}
}

func (r *memoryUserRepo) Create(_ context.Context, user *models.User, hashes []string) error {
	if _, err := r.findByUsername(user.Username); err == nil {
		return repositories.ErrUsernameTaken
	}
	user.ID = uuid.New()
	r.users[user.ID] = *user
	r.setKeys(user.ID, hashes)
	return nil
}

func (r *memoryUserRepo) FindByUsername(_ context.Context, username string) (*models.User, error) {
	return r.findByUsername(username)
}

func (r *memoryUserRepo) FindByID(_ context.Context, id uuid.UUID) (*models.User, error) {
	user, ok := r.users[id]
	if !ok {
		return nil, repositories.ErrUserNotFound
	}
	return &user, nil
}

func (r *memoryUserRepo) RecoverCredentials(_ context.Context, userID uuid.UUID, hash string, update repositories.CredentialsUpdate) (*models.User, error) {
	keys := r.keys[userID]
	idx := -1
	for i, k := range keys {
		if k.hash == hash && !k.used {
			idx = i
			break
		}
	}
	if idx < 0 {
		return nil, repositories.ErrRecoveryKeyInvalid
	}
	if update.Username != "" {
		if other, err := r.findByUsername(update.Username); err == nil && other.ID != userID {
			return nil, repositories.ErrUsernameTaken
		}
	}

	keys[idx].used = true
	user := r.users[userID]
	if update.Username != "" {
		user.Username = update.Username
	}
	if update.PasswordHash != "" {
		user.PasswordHash = update.PasswordHash
	}
	changedAt := r.now()
	user.CredentialsChangedAt = &changedAt
	r.users[userID] = user
	return &user, nil
}

func (r *memoryUserRepo) ReplaceRecoveryKeys(_ context.Context, userID uuid.UUID, hashes []string) error {
	r.setKeys(userID, hashes)
	return nil
}

func (r *memoryUserRepo) CountUnusedRecoveryKeys(_ context.Context, userID uuid.UUID) (int, error) {
	count := 0
	for _, k := range r.keys[userID] {
		if !k.used {
			count++
		}
	}
	return count, nil
}

func (r *memoryUserRepo) findByUsername(username string) (*models.User, error) {
	for _, user := range r.users {
		if user.Username == username {
			return &user, nil
		}
	}
	return nil, repositories.ErrUserNotFound
}

func (r *memoryUserRepo) setKeys(userID uuid.UUID, hashes []string) {
	keys := make([]memoryKey, len(hashes))
	for i, h := range hashes {
		keys[i] = memoryKey{hash: h}
	}
	r.keys[userID] = keys
}

func newTestService() (UserService, *utils.JWTManager) {
	svc, jm, _ := newTestServiceWithRepo()
	return svc, jm
}

func newTestServiceWithRepo() (UserService, *utils.JWTManager, *memoryUserRepo) {
	jm := utils.NewJWTManager("access-secret", "refresh-secret")
	repo := newMemoryUserRepo()
	return NewUserService(repo, jm), jm, repo
}

func register(t *testing.T, svc UserService, username, password string) (*models.User, []string) {
	t.Helper()
	user, keys, err := svc.Register(context.Background(), dto.RegisterRequest{Username: username, Password: password})
	if err != nil {
		t.Fatalf("register %s: %v", username, err)
	}
	return user, keys
}

func TestRegisterHashesPassword(t *testing.T) {
	svc, _ := newTestService()

	user, _ := register(t, svc, "  jan  ", "secret123")
	if user.Username != "jan" {
		t.Errorf("expected trimmed username, got %q", user.Username)
	}
	if user.PasswordHash == "secret123" || !utils.CheckPasswordHash("secret123", user.PasswordHash) {
		t.Error("password must be stored as bcrypt hash")
	}
	if user.Role != models.RoleUser {
		t.Errorf("expected role %q, got %q", models.RoleUser, user.Role)
	}
}

func TestRegisterReturnsRecoveryKeys(t *testing.T) {
	svc, _, repo := newTestServiceWithRepo()

	user, keys := register(t, svc, "jan", "secret123")
	if len(keys) != utils.RecoveryKeyCount {
		t.Fatalf("expected %d keys, got %d", utils.RecoveryKeyCount, len(keys))
	}

	stored := repo.keys[user.ID]
	if len(stored) != len(keys) {
		t.Fatalf("expected %d stored keys, got %d", len(keys), len(stored))
	}
	for i, key := range keys {
		if stored[i].hash == key {
			t.Error("recovery keys must not be stored in plain text")
		}
		if stored[i].hash != utils.HashRecoveryKey(key) {
			t.Error("stored hash does not match generated key")
		}
	}
}

func TestRegisterDuplicateUsername(t *testing.T) {
	svc, _ := newTestService()
	register(t, svc, "jan", "secret123")

	if _, _, err := svc.Register(context.Background(), dto.RegisterRequest{Username: "jan", Password: "other1234"}); !errors.Is(err, ErrUsernameTaken) {
		t.Errorf("expected ErrUsernameTaken, got %v", err)
	}
}

func TestLoginReturnsTokens(t *testing.T) {
	svc, jm := newTestService()
	ctx := context.Background()
	user, _ := register(t, svc, "jan", "secret123")

	resp, err := svc.Login(ctx, dto.LoginRequest{Username: "jan", Password: "secret123"}, utils.ClientApp)
	if err != nil {
		t.Fatalf("login: %v", err)
	}
	if resp.TokenType != "Bearer" || resp.User.ID != user.ID || resp.ExpiresIn != int(utils.AccessTokenTTL.Seconds()) {
		t.Errorf("unexpected response: %+v", resp)
	}

	claims, err := jm.ParseAccessToken(resp.AccessToken)
	if err != nil {
		t.Fatalf("parse access token: %v", err)
	}
	if claims.UserID != user.ID || claims.ClientType != utils.ClientApp {
		t.Errorf("unexpected access claims: %+v", claims)
	}
	if _, err := jm.ParseRefreshToken(resp.RefreshToken); err != nil {
		t.Errorf("parse refresh token: %v", err)
	}
}

func TestRefreshIssuesNewTokens(t *testing.T) {
	svc, jm := newTestService()
	ctx := context.Background()
	user, _ := register(t, svc, "jan", "secret123")
	login, _ := svc.Login(ctx, dto.LoginRequest{Username: "jan", Password: "secret123"}, utils.ClientApp)

	resp, err := svc.Refresh(ctx, login.RefreshToken)
	if err != nil {
		t.Fatalf("refresh: %v", err)
	}

	claims, err := jm.ParseAccessToken(resp.AccessToken)
	if err != nil {
		t.Fatalf("parse access token: %v", err)
	}
	if claims.UserID != user.ID || claims.ClientType != utils.ClientApp {
		t.Errorf("unexpected claims: %+v", claims)
	}
}

func TestRefreshRejectsInvalidTokens(t *testing.T) {
	svc, jm := newTestService()
	ctx := context.Background()
	register(t, svc, "jan", "secret123")
	login, _ := svc.Login(ctx, dto.LoginRequest{Username: "jan", Password: "secret123"}, utils.ClientWeb)
	ghost, _ := jm.GenerateRefreshToken(uuid.New(), "ghost", utils.ClientWeb)

	cases := map[string]string{
		"access token": login.AccessToken,
		"garbage":      "not.a.token",
		"deleted user": ghost,
	}
	for name, token := range cases {
		t.Run(name, func(t *testing.T) {
			if _, err := svc.Refresh(ctx, token); !errors.Is(err, ErrInvalidRefreshToken) {
				t.Errorf("expected ErrInvalidRefreshToken, got %v", err)
			}
		})
	}
}

func TestGetByID(t *testing.T) {
	svc, _ := newTestService()
	ctx := context.Background()
	user, _ := register(t, svc, "jan", "secret123")

	found, err := svc.GetByID(ctx, user.ID)
	if err != nil || found.Username != "jan" {
		t.Errorf("expected jan, got %+v, err %v", found, err)
	}
	if _, err := svc.GetByID(ctx, uuid.New()); !errors.Is(err, ErrUserNotFound) {
		t.Errorf("expected ErrUserNotFound, got %v", err)
	}
}

func TestLoginInvalidCredentials(t *testing.T) {
	svc, _ := newTestService()
	ctx := context.Background()
	register(t, svc, "jan", "secret123")

	cases := map[string]dto.LoginRequest{
		"wrong password": {Username: "jan", Password: "wrongpass"},
		"unknown user":   {Username: "anna", Password: "secret123"},
	}
	for name, req := range cases {
		t.Run(name, func(t *testing.T) {
			if _, err := svc.Login(ctx, req, utils.ClientWeb); !errors.Is(err, ErrInvalidCredentials) {
				t.Errorf("expected ErrInvalidCredentials, got %v", err)
			}
		})
	}
}

func TestRecoverChangesPassword(t *testing.T) {
	svc, _ := newTestService()
	ctx := context.Background()
	_, keys := register(t, svc, "jan", "secret123")

	user, remaining, err := svc.Recover(ctx, dto.RecoverRequest{
		Username:    "jan",
		RecoveryKey: keys[0],
		NewPassword: "newsecret1",
	})
	if err != nil {
		t.Fatalf("recover: %v", err)
	}
	if user.Username != "jan" || remaining != utils.RecoveryKeyCount-1 {
		t.Errorf("unexpected result: user=%q remaining=%d", user.Username, remaining)
	}

	if _, err := svc.Login(ctx, dto.LoginRequest{Username: "jan", Password: "secret123"}, utils.ClientWeb); !errors.Is(err, ErrInvalidCredentials) {
		t.Error("old password must stop working")
	}
	if _, err := svc.Login(ctx, dto.LoginRequest{Username: "jan", Password: "newsecret1"}, utils.ClientWeb); err != nil {
		t.Errorf("new password should work: %v", err)
	}
}

func TestRecoverChangesUsername(t *testing.T) {
	svc, _ := newTestService()
	ctx := context.Background()
	_, keys := register(t, svc, "jan", "secret123")

	user, _, err := svc.Recover(ctx, dto.RecoverRequest{
		Username:    "jan",
		RecoveryKey: keys[1],
		NewUsername: "janek",
	})
	if err != nil {
		t.Fatalf("recover: %v", err)
	}
	if user.Username != "janek" {
		t.Errorf("expected janek, got %q", user.Username)
	}
	if _, err := svc.Login(ctx, dto.LoginRequest{Username: "janek", Password: "secret123"}, utils.ClientWeb); err != nil {
		t.Errorf("login with new username should work: %v", err)
	}
}

func TestRecoverAcceptsKeyWithoutFormatting(t *testing.T) {
	svc, _ := newTestService()
	_, keys := register(t, svc, "jan", "secret123")

	_, _, err := svc.Recover(context.Background(), dto.RecoverRequest{
		Username:    "jan",
		RecoveryKey: " " + toLowerNoDashes(keys[2]) + " ",
		NewPassword: "newsecret1",
	})
	if err != nil {
		t.Errorf("recover with lowercase key without dashes should work: %v", err)
	}
}

func TestRecoverKeyIsSingleUse(t *testing.T) {
	svc, _ := newTestService()
	ctx := context.Background()
	_, keys := register(t, svc, "jan", "secret123")
	req := dto.RecoverRequest{Username: "jan", RecoveryKey: keys[0], NewPassword: "newsecret1"}

	if _, _, err := svc.Recover(ctx, req); err != nil {
		t.Fatalf("first recover: %v", err)
	}
	req.NewPassword = "newsecret2"
	if _, _, err := svc.Recover(ctx, req); !errors.Is(err, ErrInvalidRecoveryKey) {
		t.Errorf("expected ErrInvalidRecoveryKey on reuse, got %v", err)
	}
}

func TestRecoverRejects(t *testing.T) {
	svc, _ := newTestService()
	ctx := context.Background()
	_, janKeys := register(t, svc, "jan", "secret123")
	_, annaKeys := register(t, svc, "anna", "secret123")

	cases := map[string]struct {
		req  dto.RecoverRequest
		want error
	}{
		"wrong key":          {dto.RecoverRequest{Username: "jan", RecoveryKey: "AAAA-BBBB-CCCC", NewPassword: "newsecret1"}, ErrInvalidRecoveryKey},
		"other user's key":   {dto.RecoverRequest{Username: "jan", RecoveryKey: annaKeys[0], NewPassword: "newsecret1"}, ErrInvalidRecoveryKey},
		"unknown user":       {dto.RecoverRequest{Username: "ghost", RecoveryKey: janKeys[0], NewPassword: "newsecret1"}, ErrInvalidRecoveryKey},
		"nothing to change":  {dto.RecoverRequest{Username: "jan", RecoveryKey: janKeys[0]}, ErrNothingToChange},
		"same username only": {dto.RecoverRequest{Username: "jan", RecoveryKey: janKeys[0], NewUsername: "jan"}, ErrNothingToChange},
		"username taken":     {dto.RecoverRequest{Username: "jan", RecoveryKey: janKeys[0], NewUsername: "anna"}, ErrUsernameTaken},
	}
	for name, tc := range cases {
		t.Run(name, func(t *testing.T) {
			if _, _, err := svc.Recover(ctx, tc.req); !errors.Is(err, tc.want) {
				t.Errorf("expected %v, got %v", tc.want, err)
			}
		})
	}

	if _, remaining, err := svc.Recover(ctx, dto.RecoverRequest{Username: "jan", RecoveryKey: janKeys[0], NewPassword: "newsecret1"}); err != nil || remaining != utils.RecoveryKeyCount-1 {
		t.Errorf("rejected attempts must not consume the key: remaining=%d err=%v", remaining, err)
	}
}

func TestRecoverInvalidatesOldRefreshTokens(t *testing.T) {
	svc, _ := newTestService()
	ctx := context.Background()
	_, keys := register(t, svc, "jan", "secret123")
	login, _ := svc.Login(ctx, dto.LoginRequest{Username: "jan", Password: "secret123"}, utils.ClientWeb)

	if _, _, err := svc.Recover(ctx, dto.RecoverRequest{Username: "jan", RecoveryKey: keys[0], NewPassword: "newsecret1"}); err != nil {
		t.Fatalf("recover: %v", err)
	}

	if _, err := svc.Refresh(ctx, login.RefreshToken); !errors.Is(err, ErrInvalidRefreshToken) {
		t.Errorf("refresh token issued before recovery must be rejected, got %v", err)
	}
}

func TestRefreshAfterRecoveryWorksForNewTokens(t *testing.T) {
	svc, _, repo := newTestServiceWithRepo()
	ctx := context.Background()
	_, keys := register(t, svc, "jan", "secret123")

	repo.now = func() time.Time { return time.Now().Add(-time.Minute) }
	if _, _, err := svc.Recover(ctx, dto.RecoverRequest{Username: "jan", RecoveryKey: keys[0], NewPassword: "newsecret1"}); err != nil {
		t.Fatalf("recover: %v", err)
	}

	login, err := svc.Login(ctx, dto.LoginRequest{Username: "jan", Password: "newsecret1"}, utils.ClientWeb)
	if err != nil {
		t.Fatalf("login: %v", err)
	}
	if _, err := svc.Refresh(ctx, login.RefreshToken); err != nil {
		t.Errorf("refresh token issued after recovery should work, got %v", err)
	}
}

func TestRegenerateRecoveryKeys(t *testing.T) {
	svc, _ := newTestService()
	ctx := context.Background()
	user, oldKeys := register(t, svc, "jan", "secret123")

	if _, err := svc.RegenerateRecoveryKeys(ctx, user.ID, "wrongpass"); !errors.Is(err, ErrInvalidPassword) {
		t.Errorf("expected ErrInvalidPassword, got %v", err)
	}

	newKeys, err := svc.RegenerateRecoveryKeys(ctx, user.ID, "secret123")
	if err != nil {
		t.Fatalf("regenerate: %v", err)
	}
	if len(newKeys) != utils.RecoveryKeyCount {
		t.Fatalf("expected %d keys, got %d", utils.RecoveryKeyCount, len(newKeys))
	}

	if _, _, err := svc.Recover(ctx, dto.RecoverRequest{Username: "jan", RecoveryKey: oldKeys[0], NewPassword: "newsecret1"}); !errors.Is(err, ErrInvalidRecoveryKey) {
		t.Error("old keys must stop working after regeneration")
	}
	if _, _, err := svc.Recover(ctx, dto.RecoverRequest{Username: "jan", RecoveryKey: newKeys[0], NewPassword: "newsecret1"}); err != nil {
		t.Errorf("new key should work: %v", err)
	}
}

func toLowerNoDashes(key string) string {
	out := make([]byte, 0, len(key))
	for i := 0; i < len(key); i++ {
		c := key[i]
		if c == '-' {
			continue
		}
		if c >= 'A' && c <= 'Z' {
			c += 'a' - 'A'
		}
		out = append(out, c)
	}
	return string(out)
}
