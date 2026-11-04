package handlers

import (
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"

	"github.com/PJMatch/server/internal/dto"
	"github.com/PJMatch/server/internal/middleware"
	"github.com/PJMatch/server/internal/services"
)

type ProgressHandler struct {
	service services.ProgressService
}

func NewProgressHandler(service services.ProgressService) *ProgressHandler {
	return &ProgressHandler{service: service}
}

func (h *ProgressHandler) RegisterRoutes(rg *gin.RouterGroup, requireAuth gin.HandlerFunc) {
	rg.GET("/stats/me", requireAuth, h.Stats)
	rg.POST("/progress", requireAuth, h.Update)
}

func (h *ProgressHandler) Stats(c *gin.Context) {
	userID, ok := middleware.GetUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	stats, err := h.service.Stats(c.Request.Context(), userID)
	if err != nil {
		internalError(c, err)
		return
	}
	c.JSON(http.StatusOK, stats)
}

func (h *ProgressHandler) Update(c *gin.Context) {
	userID, ok := middleware.GetUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	var req dto.UpdateProgressRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "sign_id and accuracy (0-100) are required"})
		return
	}

	progress, err := h.service.Update(c.Request.Context(), userID, req)
	if errors.Is(err, services.ErrSignNotFound) {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}
	if err != nil {
		internalError(c, err)
		return
	}
	c.JSON(http.StatusOK, dto.ToUserProgressDTO(*progress))
}
