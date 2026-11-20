package handlers

import (
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"

	"github.com/PJMatch/server/internal/dto"
	"github.com/PJMatch/server/internal/middleware"
	"github.com/PJMatch/server/internal/services"
	"github.com/PJMatch/server/internal/utils"
)

type UserHandler struct {
	service services.UserService
}

func NewUserHandler(service services.UserService) *UserHandler {
	return &UserHandler{service: service}
}

func (h *UserHandler) RegisterRoutes(rg *gin.RouterGroup, requireAuth, rateLimit gin.HandlerFunc) {
	auth := rg.Group("/auth")
	auth.POST("/register", rateLimit, h.Register)
	auth.POST("/login/web", rateLimit, h.LoginWeb)
	auth.POST("/login/app", rateLimit, h.LoginApp)
	auth.POST("/refresh-token", h.RefreshToken)
	auth.GET("/me", requireAuth, h.Me)
	auth.POST("/recover", rateLimit, h.Recover)
	auth.POST("/recovery-keys", requireAuth, rateLimit, h.RegenerateRecoveryKeys)
}

func (h *UserHandler) Register(c *gin.Context) {
	var req dto.RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "username must be 3-50 characters and password 8-72 characters"})
		return
	}

	user, keys, err := h.service.Register(c.Request.Context(), req)
	if errors.Is(err, services.ErrUsernameTaken) {
		c.JSON(http.StatusConflict, gin.H{"error": err.Error()})
		return
	}
	if err != nil {
		internalError(c, err)
		return
	}

	c.JSON(http.StatusCreated, dto.RegisterResponse{User: dto.ToUserDTO(*user), RecoveryKeys: keys})
}

func (h *UserHandler) LoginWeb(c *gin.Context) {
	h.login(c, utils.ClientWeb)
}

func (h *UserHandler) LoginApp(c *gin.Context) {
	h.login(c, utils.ClientApp)
}

func (h *UserHandler) login(c *gin.Context, client utils.ClientType) {
	var req dto.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "username and password are required"})
		return
	}

	resp, err := h.service.Login(c.Request.Context(), req, client)
	if errors.Is(err, services.ErrInvalidCredentials) {
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}
	if err != nil {
		internalError(c, err)
		return
	}

	c.JSON(http.StatusOK, resp)
}

func (h *UserHandler) RefreshToken(c *gin.Context) {
	var req dto.RefreshTokenRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "refresh_token is required"})
		return
	}

	resp, err := h.service.Refresh(c.Request.Context(), req.RefreshToken)
	if errors.Is(err, services.ErrInvalidRefreshToken) {
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}
	if err != nil {
		internalError(c, err)
		return
	}

	c.JSON(http.StatusOK, resp)
}

func (h *UserHandler) Me(c *gin.Context) {
	userID, ok := middleware.GetUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	user, err := h.service.GetByID(c.Request.Context(), userID)
	if errors.Is(err, services.ErrUserNotFound) {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}
	if err != nil {
		internalError(c, err)
		return
	}

	c.JSON(http.StatusOK, dto.ToUserDTO(*user))
}

func (h *UserHandler) Recover(c *gin.Context) {
	var req dto.RecoverRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "username and recovery_key are required"})
		return
	}

	user, remaining, err := h.service.Recover(c.Request.Context(), req)
	switch {
	case errors.Is(err, services.ErrNothingToChange):
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	case errors.Is(err, services.ErrInvalidRecoveryKey):
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	case errors.Is(err, services.ErrUsernameTaken):
		c.JSON(http.StatusConflict, gin.H{"error": err.Error()})
		return
	case err != nil:
		internalError(c, err)
		return
	}

	c.JSON(http.StatusOK, dto.RecoverResponse{User: dto.ToUserDTO(*user), RecoveryKeysRemaining: remaining})
}

func (h *UserHandler) RegenerateRecoveryKeys(c *gin.Context) {
	userID, ok := middleware.GetUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	var req dto.RegenerateRecoveryKeysRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "password is required"})
		return
	}

	keys, err := h.service.RegenerateRecoveryKeys(c.Request.Context(), userID, req.Password)
	switch {
	case errors.Is(err, services.ErrInvalidPassword):
		c.JSON(http.StatusForbidden, gin.H{"error": err.Error()})
		return
	case errors.Is(err, services.ErrUserNotFound):
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	case err != nil:
		internalError(c, err)
		return
	}

	c.JSON(http.StatusOK, dto.RecoveryKeysResponse{RecoveryKeys: keys})
}

func internalError(c *gin.Context, err error) {
	_ = c.Error(err)
	c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
}
