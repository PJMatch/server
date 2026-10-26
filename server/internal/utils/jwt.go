package utils

import (
	"errors"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

const (
	AccessTokenTTL  = 15 * time.Minute
	RefreshTokenTTL = 7 * 24 * time.Hour
)

type ClientType string

const (
	ClientWeb ClientType = "web"
	ClientApp ClientType = "app"
)

type TokenType string

const (
	TokenAccess  TokenType = "access"
	TokenRefresh TokenType = "refresh"
)

var ErrInvalidToken = errors.New("invalid token")

type Claims struct {
	UserID     uint       `json:"user_id"`
	Username   string     `json:"username"`
	ClientType ClientType `json:"client_type"`
	TokenType  TokenType  `json:"token_type"`
	jwt.RegisteredClaims
}

type JWTManager struct {
	accessSecret  []byte
	refreshSecret []byte
	accessTTL     time.Duration
	refreshTTL    time.Duration
}

func NewJWTManager(accessSecret, refreshSecret string) *JWTManager {
	return &JWTManager{
		accessSecret:  []byte(accessSecret),
		refreshSecret: []byte(refreshSecret),
		accessTTL:     AccessTokenTTL,
		refreshTTL:    RefreshTokenTTL,
	}
}

func (m *JWTManager) GenerateAccessToken(userID uint, username string, client ClientType) (string, error) {
	return m.generate(userID, username, client, TokenAccess, m.accessSecret, m.accessTTL)
}

func (m *JWTManager) GenerateRefreshToken(userID uint, username string, client ClientType) (string, error) {
	return m.generate(userID, username, client, TokenRefresh, m.refreshSecret, m.refreshTTL)
}

func (m *JWTManager) ParseAccessToken(tokenStr string) (*Claims, error) {
	return m.parse(tokenStr, TokenAccess, m.accessSecret)
}

func (m *JWTManager) ParseRefreshToken(tokenStr string) (*Claims, error) {
	return m.parse(tokenStr, TokenRefresh, m.refreshSecret)
}

func (m *JWTManager) generate(userID uint, username string, client ClientType, tokenType TokenType, secret []byte, ttl time.Duration) (string, error) {
	now := time.Now()
	claims := Claims{
		UserID:     userID,
		Username:   username,
		ClientType: client,
		TokenType:  tokenType,
		RegisteredClaims: jwt.RegisteredClaims{
			IssuedAt:  jwt.NewNumericDate(now),
			ExpiresAt: jwt.NewNumericDate(now.Add(ttl)),
		},
	}

	return jwt.NewWithClaims(jwt.SigningMethodHS256, claims).SignedString(secret)
}

func (m *JWTManager) parse(tokenStr string, expected TokenType, secret []byte) (*Claims, error) {
	claims := &Claims{}
	token, err := jwt.ParseWithClaims(tokenStr, claims, func(t *jwt.Token) (any, error) {
		return secret, nil
	},
		jwt.WithValidMethods([]string{jwt.SigningMethodHS256.Alg()}),
		jwt.WithExpirationRequired(),
	)
	if err != nil {
		return nil, err
	}
	if !token.Valid || claims.TokenType != expected {
		return nil, ErrInvalidToken
	}
	return claims, nil
}
