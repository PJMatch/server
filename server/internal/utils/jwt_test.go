package utils

import (
	"errors"
	"testing"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

func newTestManager() *JWTManager {
	return NewJWTManager("access-secret", "refresh-secret")
}

func TestAccessTokenRoundTrip(t *testing.T) {
	m := newTestManager()
	userID := uuid.New()

	token, err := m.GenerateAccessToken(userID, "jan", ClientWeb)
	if err != nil {
		t.Fatalf("generate: %v", err)
	}

	claims, err := m.ParseAccessToken(token)
	if err != nil {
		t.Fatalf("parse: %v", err)
	}
	if claims.UserID != userID || claims.Username != "jan" || claims.ClientType != ClientWeb {
		t.Errorf("unexpected claims: %+v", claims)
	}
	if ttl := time.Until(claims.ExpiresAt.Time); ttl > AccessTokenTTL || ttl < AccessTokenTTL-time.Minute {
		t.Errorf("unexpected access token ttl: %v", ttl)
	}
}

func TestRefreshTokenRoundTrip(t *testing.T) {
	m := newTestManager()
	userID := uuid.New()

	token, err := m.GenerateRefreshToken(userID, "anna", ClientApp)
	if err != nil {
		t.Fatalf("generate: %v", err)
	}

	claims, err := m.ParseRefreshToken(token)
	if err != nil {
		t.Fatalf("parse: %v", err)
	}
	if claims.UserID != userID || claims.ClientType != ClientApp || claims.TokenType != TokenRefresh {
		t.Errorf("unexpected claims: %+v", claims)
	}
	if ttl := time.Until(claims.ExpiresAt.Time); ttl > RefreshTokenTTL || ttl < RefreshTokenTTL-time.Minute {
		t.Errorf("unexpected refresh token ttl: %v", ttl)
	}
}

func TestTokenTypesAreNotInterchangeable(t *testing.T) {
	m := newTestManager()
	userID := uuid.New()

	refresh, _ := m.GenerateRefreshToken(userID, "jan", ClientWeb)
	if _, err := m.ParseAccessToken(refresh); err == nil {
		t.Error("refresh token must not be accepted as access token")
	}

	access, _ := m.GenerateAccessToken(userID, "jan", ClientWeb)
	if _, err := m.ParseRefreshToken(access); err == nil {
		t.Error("access token must not be accepted as refresh token")
	}
}

func TestExpiredToken(t *testing.T) {
	m := newTestManager()
	m.accessTTL = -time.Minute

	token, _ := m.GenerateAccessToken(uuid.New(), "jan", ClientWeb)
	if _, err := m.ParseAccessToken(token); !errors.Is(err, jwt.ErrTokenExpired) {
		t.Errorf("expected ErrTokenExpired, got %v", err)
	}
}

func TestWrongSignature(t *testing.T) {
	token, _ := newTestManager().GenerateAccessToken(uuid.New(), "jan", ClientWeb)

	other := NewJWTManager("different-secret", "refresh-secret")
	if _, err := other.ParseAccessToken(token); !errors.Is(err, jwt.ErrTokenSignatureInvalid) {
		t.Errorf("expected ErrTokenSignatureInvalid, got %v", err)
	}
}

func TestRejectsNoneAlgorithm(t *testing.T) {
	claims := Claims{
		UserID:    uuid.New(),
		TokenType: TokenAccess,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(time.Hour)),
		},
	}
	token, err := jwt.NewWithClaims(jwt.SigningMethodNone, claims).SignedString(jwt.UnsafeAllowNoneSignatureType)
	if err != nil {
		t.Fatalf("sign: %v", err)
	}

	if _, err := newTestManager().ParseAccessToken(token); err == nil {
		t.Error("token with alg=none must be rejected")
	}
}

func TestMalformedToken(t *testing.T) {
	if _, err := newTestManager().ParseAccessToken("not.a.token"); err == nil {
		t.Error("malformed token must be rejected")
	}
}
