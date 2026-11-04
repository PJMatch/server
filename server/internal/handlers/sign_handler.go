package handlers

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"

	"github.com/PJMatch/server/internal/dto"
	"github.com/PJMatch/server/internal/services"
)

type SignHandler struct {
	service services.SignService
}

func NewSignHandler(service services.SignService) *SignHandler {
	return &SignHandler{service: service}
}

func (h *SignHandler) RegisterRoutes(rg *gin.RouterGroup) {
	rg.GET("/signs", h.List)
}

func (h *SignHandler) List(c *gin.Context) {
	signs, err := h.service.List(c.Request.Context(), strings.TrimSpace(c.Query("category")), strings.TrimSpace(c.Query("search")))
	if err != nil {
		internalError(c, err)
		return
	}
	c.JSON(http.StatusOK, dto.ToSignResponseList(signs))
}
