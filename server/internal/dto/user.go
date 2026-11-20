package dto

import (
	"time"

	"github.com/google/uuid"

	"github.com/PJMatch/server/internal/models"
)

type RegisterRequest struct {
	Username string `json:"username" binding:"required,min=3,max=50"`
	Password string `json:"password" binding:"required,min=8,max=72"`
}

type LoginRequest struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
}

type RefreshTokenRequest struct {
	RefreshToken string `json:"refresh_token" binding:"required"`
}

type RecoverRequest struct {
	Username    string `json:"username" binding:"required"`
	RecoveryKey string `json:"recovery_key" binding:"required"`
	NewUsername string `json:"new_username" binding:"omitempty,min=3,max=50"`
	NewPassword string `json:"new_password" binding:"omitempty,min=8,max=72"`
}

type RegenerateRecoveryKeysRequest struct {
	Password string `json:"password" binding:"required"`
}

type RegisterResponse struct {
	User         UserDTO  `json:"user"`
	RecoveryKeys []string `json:"recovery_keys"`
}

type RecoveryKeysResponse struct {
	RecoveryKeys []string `json:"recovery_keys"`
}

type RecoverResponse struct {
	User                  UserDTO `json:"user"`
	RecoveryKeysRemaining int     `json:"recovery_keys_remaining"`
}

type UserDTO struct {
	ID        uuid.UUID `json:"id"`
	Username  string    `json:"username"`
	Role      string    `json:"role"`
	CreatedAt time.Time `json:"created_at"`
}

type AuthResponse struct {
	AccessToken  string  `json:"access_token"`
	RefreshToken string  `json:"refresh_token"`
	TokenType    string  `json:"token_type"`
	ExpiresIn    int     `json:"expires_in"`
	User         UserDTO `json:"user"`
}

func ToUserDTO(user models.User) UserDTO {
	return UserDTO{
		ID:        user.ID,
		Username:  user.Username,
		Role:      user.Role,
		CreatedAt: user.CreatedAt,
	}
}

func ToAuthResponse(user models.User, accessToken, refreshToken string, expiresIn time.Duration) AuthResponse {
	return AuthResponse{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		TokenType:    "Bearer",
		ExpiresIn:    int(expiresIn.Seconds()),
		User:         ToUserDTO(user),
	}
}
