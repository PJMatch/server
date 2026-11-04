package services

import (
	"context"
	"errors"
	"strings"

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
)

type UserService interface {
	Register(ctx context.Context, req dto.RegisterRequest) (*models.User, error)
	Login(ctx context.Context, req dto.LoginRequest, client utils.ClientType) (*dto.AuthResponse, error)
	Refresh(ctx context.Context, refreshToken string) (*dto.AuthResponse, error)
	GetByID(ctx context.Context, id uuid.UUID) (*models.User, error)
}

type userService struct {
	repo repositories.UserRepository
	jwt  *utils.JWTManager
}

func NewUserService(repo repositories.UserRepository, jwt *utils.JWTManager) UserService {
	return &userService{repo: repo, jwt: jwt}
}

func (s *userService) Register(ctx context.Context, req dto.RegisterRequest) (*models.User, error) {
	username := strings.TrimSpace(req.Username)

	_, err := s.repo.FindByUsername(ctx, username)
	if err == nil {
		return nil, ErrUsernameTaken
	}
	if !errors.Is(err, repositories.ErrUserNotFound) {
		return nil, err
	}

	hash, err := utils.HashPassword(req.Password)
	if err != nil {
		return nil, err
	}

	user := &models.User{
		Username:     username,
		PasswordHash: hash,
		Role:         models.RoleUser,
	}
	if err := s.repo.Create(ctx, user); err != nil {
		if errors.Is(err, repositories.ErrUsernameTaken) {
			return nil, ErrUsernameTaken
		}
		return nil, err
	}
	return user, nil
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

	return s.issueTokens(*user, claims.ClientType)
}

func (s *userService) GetByID(ctx context.Context, id uuid.UUID) (*models.User, error) {
	user, err := s.repo.FindByID(ctx, id)
	if errors.Is(err, repositories.ErrUserNotFound) {
		return nil, ErrUserNotFound
	}
	return user, err
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
