package handlers

import (
	"bytes"
	"errors"
	"io"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	"github.com/PJMatch/server/internal/dto"
	"github.com/PJMatch/server/internal/middleware"
	"github.com/PJMatch/server/internal/services"
)

type SkeletonHandler struct {
	service services.SkeletonService
}

func NewSkeletonHandler(service services.SkeletonService) *SkeletonHandler {
	return &SkeletonHandler{service: service}
}

func (h *SkeletonHandler) RegisterRoutes(rg *gin.RouterGroup, requireAuth gin.HandlerFunc) {
	skeletons := rg.Group("/skeletons", requireAuth)
	skeletons.POST("", h.Upload)
	skeletons.GET("/my", h.My)
	skeletons.DELETE("/:id", h.Delete)
}

func (h *SkeletonHandler) Upload(c *gin.Context) {
	userID, ok := middleware.GetUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	raw, err := io.ReadAll(c.Request.Body)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request"})
		return
	}
	c.Request.Body = io.NopCloser(bytes.NewReader(raw))

	var req dto.UploadSkeletonRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request"})
		return
	}
	if err := req.Validate(); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	skeleton, err := h.service.Upload(c.Request.Context(), userID, req, raw)
	if errors.Is(err, services.ErrSignNotFound) {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}
	if err != nil {
		internalError(c, err)
		return
	}
	c.JSON(http.StatusCreated, dto.ToSkeletonResponse(*skeleton))
}

func (h *SkeletonHandler) My(c *gin.Context) {
	userID, ok := middleware.GetUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	skeletons, err := h.service.ListMine(c.Request.Context(), userID)
	if err != nil {
		internalError(c, err)
		return
	}
	c.JSON(http.StatusOK, dto.ToSkeletonResponseList(skeletons))
}

func (h *SkeletonHandler) Delete(c *gin.Context) {
	userID, ok := middleware.GetUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	err = h.service.Delete(c.Request.Context(), userID, id)
	if errors.Is(err, services.ErrSkeletonNotFound) {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}
	if errors.Is(err, services.ErrForbidden) {
		c.JSON(http.StatusForbidden, gin.H{"error": err.Error()})
		return
	}
	if err != nil {
		internalError(c, err)
		return
	}
	c.Status(http.StatusNoContent)
}
