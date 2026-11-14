package handlers

import (
	"errors"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"

	"github.com/PJMatch/server/internal/dto"
	"github.com/PJMatch/server/internal/services"
)

type ReferenceHandler struct {
	service services.ReferenceService
}

func NewReferenceHandler(service services.ReferenceService) *ReferenceHandler {
	return &ReferenceHandler{service: service}
}

func (h *ReferenceHandler) RegisterRoutes(rg *gin.RouterGroup) {
	group := rg.Group("/references")
	group.GET("", h.List)
	group.GET("/:slug", h.Get)
	group.GET("/:slug/video", h.StreamVideo)
}

func (h *ReferenceHandler) List(c *gin.Context) {
	refs, err := h.service.List(c.Request.Context())
	if err != nil {
		internalError(c, err)
		return
	}
	c.JSON(http.StatusOK, dto.ToReferenceResponseList(refs))
}

func (h *ReferenceHandler) Get(c *gin.Context) {
	slug := strings.TrimSpace(c.Param("slug"))
	ref, err := h.service.GetBySlug(c.Request.Context(), slug)
	if errors.Is(err, services.ErrReferenceNotFound) {
		c.JSON(http.StatusNotFound, gin.H{"error": "reference not found"})
		return
	}
	if err != nil {
		internalError(c, err)
		return
	}
	c.JSON(http.StatusOK, dto.ToReferenceResponse(*ref))
}

func (h *ReferenceHandler) StreamVideo(c *gin.Context) {
	slug := strings.TrimSpace(c.Param("slug"))
	fullPath, ref, err := h.service.GetVideoFilePath(c.Request.Context(), slug)
	if errors.Is(err, services.ErrReferenceNotFound) {
		c.JSON(http.StatusNotFound, gin.H{"error": "reference not found"})
		return
	}
	if errors.Is(err, services.ErrVideoFileNotFound) {
		c.JSON(http.StatusNotFound, gin.H{"error": "video file not found on server"})
		return
	}
	if err != nil {
		internalError(c, err)
		return
	}

	if ref != nil && ref.MimeType != "" {
		c.Header("Content-Type", ref.MimeType)
	} else {
		c.Header("Content-Type", "video/mp4")
	}

	c.File(fullPath)
}
