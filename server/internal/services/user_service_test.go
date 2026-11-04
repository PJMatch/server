package services

import (
	"context"
	"errors"
	"testing"

	"github.com/google/uuid"

	"github.com/PJMatch/server/internal/dto"
	"github.com/PJMatch/server/internal/models"
	"github.com/PJMatch/server/internal/repositories"
	"github.com/PJMatch/server/internal/utils"
)

type memoryUserRepo struct {
	users map[string]models.User
}

func newMemoryUserRepo() *memoryUserRepo {
	return &memoryUserRepo{users: map[string]models.User{}}
}

func (r *memoryUserRepo) Create(_ context.Context, user *models.User) error {
	if _, exists := r.users[user.Username]; exists {
		return repositories.ErrUsernameTaken
	}
	user.ID = uuid.New()
	r.users[user.Username] = *user
	return nil
}

func (r *memoryUserRepo) FindByUsername(_ context.Context, username string) (*models.User, error) {
	user, ok := r.users[username]
	if !ok {
		return nil, repositories.ErrUserNotFound
	}
	return &user, nil
}

func (r *memoryUserRepo) FindByID(_ context.Context, id uuid.UUID) (*models.User, error) {
	for _, user := range r.users {
		if user.ID == id {
			return &user, nil
		}
	}
	return nil, repositories.ErrUserNotFound
}

func newTestService() (UserService, *utils.JWTManager) {
	jm := utils.NewJWTManager("access-secret", "refresh-secret")
	return NewUserService(newMemoryUserRepo(), jm), jm
}

func TestRegisterHashesPassword(t *testing.T) {
	svc, _ := newTestService()

	user, err := svc.Register(context.Background(), dto.RegisterRequest{Username: "  jan  ", Password: "secret123"})
	if err != nil {
		t.Fatalf("register: %v", err)
	}
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

func TestRegisterDuplicateUsername(t *testing.T) {
	svc, _ := newTestService()
	ctx := context.Background()

	if _, err := svc.Register(ctx, dto.RegisterRequest{Username: "jan", Password: "secret123"}); err != nil {
		t.Fatalf("first register: %v", err)
	}
	if _, err := svc.Register(ctx, dto.RegisterRequest{Username: "jan", Password: "other1234"}); !errors.Is(err, ErrUsernameTaken) {
		t.Errorf("expected ErrUsernameTaken, got %v", err)
	}
}

func TestLoginReturnsTokens(t *testing.T) {
	svc, jm := newTestService()
	ctx := context.Background()
	user, _ := svc.Register(ctx, dto.RegisterRequest{Username: "jan", Password: "secret123"})

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
	user, _ := svc.Register(ctx, dto.RegisterRequest{Username: "jan", Password: "secret123"})
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
	_, _ = svc.Register(ctx, dto.RegisterRequest{Username: "jan", Password: "secret123"})
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
	user, _ := svc.Register(ctx, dto.RegisterRequest{Username: "jan", Password: "secret123"})

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
	_, _ = svc.Register(ctx, dto.RegisterRequest{Username: "jan", Password: "secret123"})

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
