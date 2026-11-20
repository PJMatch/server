package services

import (
	"context"
	"errors"
	"strings"
	"time"

	"github.com/google/uuid"

	"github.com/PJMatch/server/internal/dto"
	"github.com/PJMatch/server/internal/models"
	"github.com/PJMatch/server/internal/repositories"
	"github.com/PJMatch/server/internal/utils"
)

var (
	ErrUsernameTaken       = errors.New("username already taken")
	ErrInvalidCredentials  = errors.New("invalid username or password")
	ErrInvalidRefreshToken = errors.New("invalid or expired refresh token")
	ErrUserNotFound        = errors.New("user not found")
	ErrInvalidRecoveryKey  = errors.New("invalid username or recovery key")
	ErrNothingToChange     = errors.New("new_username or new_password is required")
	ErrInvalidPassword     = errors.New("invalid password")
)

type UserService interface {
	Register(ctx context.Context, req dto.RegisterRequest) (*models.User, []string, error)
	Login(ctx context.Context, req dto.LoginRequest, client utils.ClientType) (*dto.AuthResponse, error)
	Refresh(ctx context.Context, refreshToken string) (*dto.AuthResponse, error)
	GetByID(ctx context.Context, id uuid.UUID) (*models.User, error)
	Recover(ctx context.Context, req dto.RecoverRequest) (*models.User, int, error)
	RegenerateRecoveryKeys(ctx context.Context, userID uuid.UUID, password string) ([]string, error)
}

type userService struct {
	repo repositories.UserRepository
	jwt  *utils.JWTManager
}

func NewUserService(repo repositories.UserRepository, jwt *utils.JWTManager) UserService {
	return &userService{repo: repo, jwt: jwt}
}

func (s *userService) Register(ctx context.Context, req dto.RegisterRequest) (*models.User, []string, error) {
	username := strings.TrimSpace(req.Username)

	if err := s.ensureUsernameFree(ctx, username); err != nil {
		return nil, nil, err
	}

	hash, err := utils.HashPassword(req.Password)
	if err != nil {
		return nil, nil, err
	}

	keys, hashes, err := newRecoveryKeys()
	if err != nil {
		return nil, nil, err
	}

	user := &models.User{
		Username:     username,
		PasswordHash: hash,
		Role:         models.RoleUser,
	}
	if err := s.repo.Create(ctx, user, hashes); err != nil {
		if errors.Is(err, repositories.ErrUsernameTaken) {
			return nil, nil, ErrUsernameTaken
		}
		return nil, nil, err
	}
	return user, keys, nil
}

func (s *userService) Login(ctx context.Context, req dto.LoginRequest, client utils.ClientType) (*dto.AuthResponse, error) {
	user, err := s.repo.FindByUsername(ctx, strings.TrimSpace(req.Username))
	if errors.Is(err, repositories.ErrUserNotFound) {
		return nil, ErrInvalidCredentials
	}
	if err != nil {
		return nil, err
	}

	if !utils.CheckPasswordHash(req.Password, user.PasswordHash) {
		return nil, ErrInvalidCredentials
	}

	return s.issueTokens(*user, client)
}

func (s *userService) Refresh(ctx context.Context, refreshToken string) (*dto.AuthResponse, error) {
	claims, err := s.jwt.ParseRefreshToken(refreshToken)
	if err != nil {
		return nil, ErrInvalidRefreshToken
	}

	user, err := s.repo.FindByID(ctx, claims.UserID)
	if errors.Is(err, repositories.ErrUserNotFound) {
		return nil, ErrInvalidRefreshToken
	}
	if err != nil {
		return nil, err
	}

	if user.CredentialsChangedAt != nil && claims.IssuedAt != nil &&
		!claims.IssuedAt.Time.After(user.CredentialsChangedAt.Truncate(time.Second)) {
		return nil, ErrInvalidRefreshToken
	}

	return s.issueTokens(*user, claims.ClientType)
}

func (s *userService) GetByID(ctx context.Context, id uuid.UUID) (*models.User, error) {
	user, err := s.repo.FindByID(ctx, id)
	if errors.Is(err, repositories.ErrUserNotFound) {
		return nil, ErrUserNotFound
	}
	return user, err
}

func (s *userService) Recover(ctx context.Context, req dto.RecoverRequest) (*models.User, int, error) {
	newUsername := strings.TrimSpace(req.NewUsername)
	if newUsername == "" && req.NewPassword == "" {
		return nil, 0, ErrNothingToChange
	}

	user, err := s.repo.FindByUsername(ctx, strings.TrimSpace(req.Username))
	if errors.Is(err, repositories.ErrUserNotFound) {
		return nil, 0, ErrInvalidRecoveryKey
	}
	if err != nil {
		return nil, 0, err
	}

	var update repositories.CredentialsUpdate
	if newUsername != "" && newUsername != user.Username {
		if err := s.ensureUsernameFree(ctx, newUsername); err != nil {
			return nil, 0, err
		}
		update.Username = newUsername
	}
	if req.NewPassword != "" {
		hash, err := utils.HashPassword(req.NewPassword)
		if err != nil {
			return nil, 0, err
		}
		update.PasswordHash = hash
	}
	if update == (repositories.CredentialsUpdate{}) {
		return nil, 0, ErrNothingToChange
	}

	updated, err := s.repo.RecoverCredentials(ctx, user.ID, utils.HashRecoveryKey(req.RecoveryKey), update)
	switch {
	case errors.Is(err, repositories.ErrRecoveryKeyInvalid):
		return nil, 0, ErrInvalidRecoveryKey
	case errors.Is(err, repositories.ErrUsernameTaken):
		return nil, 0, ErrUsernameTaken
	case err != nil:
		return nil, 0, err
	}

	remaining, err := s.repo.CountUnusedRecoveryKeys(ctx, user.ID)
	if err != nil {
		return nil, 0, err
	}
	return updated, remaining, nil
}

func (s *userService) RegenerateRecoveryKeys(ctx context.Context, userID uuid.UUID, password string) ([]string, error) {
	user, err := s.repo.FindByID(ctx, userID)
	if errors.Is(err, repositories.ErrUserNotFound) {
		return nil, ErrUserNotFound
	}
	if err != nil {
		return nil, err
	}

	if !utils.CheckPasswordHash(password, user.PasswordHash) {
		return nil, ErrInvalidPassword
	}

	keys, hashes, err := newRecoveryKeys()
	if err != nil {
		return nil, err
	}
	if err := s.repo.ReplaceRecoveryKeys(ctx, user.ID, hashes); err != nil {
		return nil, err
	}
	return keys, nil
}

func (s *userService) ensureUsernameFree(ctx context.Context, username string) error {
	_, err := s.repo.FindByUsername(ctx, username)
	if err == nil {
		return ErrUsernameTaken
	}
	if !errors.Is(err, repositories.ErrUserNotFound) {
		return err
	}
	return nil
}

func (s *userService) issueTokens(user models.User, client utils.ClientType) (*dto.AuthResponse, error) {
	accessToken, err := s.jwt.GenerateAccessToken(user.ID, user.Username, client)
	if err != nil {
		return nil, err
	}
	refreshToken, err := s.jwt.GenerateRefreshToken(user.ID, user.Username, client)
	if err != nil {
		return nil, err
	}

	resp := dto.ToAuthResponse(user, accessToken, refreshToken, s.jwt.AccessTTL())
	return &resp, nil
}

func newRecoveryKeys() ([]string, []string, error) {
	keys, err := utils.GenerateRecoveryKeys(utils.RecoveryKeyCount)
	if err != nil {
		return nil, nil, err
	}
	hashes := make([]string, len(keys))
	for i, key := range keys {
		hashes[i] = utils.HashRecoveryKey(key)
	}
	return keys, hashes, nil
}
