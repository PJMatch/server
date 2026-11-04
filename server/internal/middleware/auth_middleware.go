package middleware

import (
	"errors"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"

	"github.com/PJMatch/server/internal/utils"
)

const (
	ContextUserID     = "userID"
	ContextUsername   = "username"
	ContextClientType = "clientType"
)

func AuthMiddleware(jm *utils.JWTManager) gin.HandlerFunc {
	return func(c *gin.Context) {
		scheme, token, ok := strings.Cut(c.GetHeader("Authorization"), " ")
		token = strings.TrimSpace(token)
		if !ok || !strings.EqualFold(scheme, "Bearer") || token == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "missing or invalid authorization header"})
			return
		}

		claims, err := jm.ParseAccessToken(token)
		if err != nil {
			msg := "invalid token"
			if errors.Is(err, jwt.ErrTokenExpired) {
				msg = "token expired"
			}
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": msg})
			return
		}

		c.Set(ContextUserID, claims.UserID)
		c.Set(ContextUsername, claims.Username)
		c.Set(ContextClientType, claims.ClientType)
		c.Next()
	}
}

func GetUserID(c *gin.Context) (uuid.UUID, bool) {
	v, ok := c.Get(ContextUserID)
	if !ok {
		return uuid.Nil, false
	}
	id, ok := v.(uuid.UUID)
	return id, ok
}

func GetUsername(c *gin.Context) (string, bool) {
	username := c.GetString(ContextUsername)
	return username, username != ""
}
