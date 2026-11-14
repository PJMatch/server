package handlers

import (
	"context"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	"github.com/PJMatch/server/internal/models"
	"github.com/PJMatch/server/internal/services"
)

type mockRefService struct {
	refs     []models.ReferenceVideo
	fullPath string
}

func (m *mockRefService) List(_ context.Context) ([]models.ReferenceVideo, error) {
	return m.refs, nil
}

func (m *mockRefService) GetBySlug(_ context.Context, slug string) (*models.ReferenceVideo, error) {
	for _, r := range m.refs {
		if r.SignSlug == slug {
			return &r, nil
		}
	}
	return nil, services.ErrReferenceNotFound
}

func (m *mockRefService) GetVideoFilePath(_ context.Context, slug string) (string, *models.ReferenceVideo, error) {
	ref, err := m.GetBySlug(context.Background(), slug)
	if err != nil {
		return "", nil, err
	}
	if m.fullPath == "" {
		return "", ref, services.ErrVideoFileNotFound
	}
	return m.fullPath, ref, nil
}

func TestReferenceHandler(t *testing.T) {
	gin.SetMode(gin.TestMode)

	tmp := t.TempDir()
	sampleVideo := filepath.Join(tmp, "sample.mp4")
	_ = os.WriteFile(sampleVideo, []byte("fake video content"), 0644)

	mockSvc := &mockRefService{
		refs: []models.ReferenceVideo{
			{
				ID:       uuid.New(),
				SignSlug: "sentence_1",
				Title:    "Zdanie 1",
				FilePath: "videos/sample.mp4",
				MimeType: "video/mp4",
			},
		},
		fullPath: sampleVideo,
	}

	h := NewReferenceHandler(mockSvc)
	r := gin.New()
	api := r.Group("/api/v1")
	h.RegisterRoutes(api)

	// Test 1: GET /api/v1/references
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/api/v1/references", nil)
	r.ServeHTTP(w, req)
	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", w.Code)
	}

	// Test 2: GET /api/v1/references/sentence_1
	w = httptest.NewRecorder()
	req, _ = http.NewRequest("GET", "/api/v1/references/sentence_1", nil)
	r.ServeHTTP(w, req)
	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", w.Code)
	}

	// Test 3: GET /api/v1/references/sentence_1/video
	w = httptest.NewRecorder()
	req, _ = http.NewRequest("GET", "/api/v1/references/sentence_1/video", nil)
	r.ServeHTTP(w, req)
	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", w.Code)
	}
	if w.Header().Get("Content-Type") != "video/mp4" {
		t.Fatalf("expected video/mp4 Content-Type, got %s", w.Header().Get("Content-Type"))
	}

	// Test 4: GET /api/v1/references/unknown -> 404
	w = httptest.NewRecorder()
	req, _ = http.NewRequest("GET", "/api/v1/references/unknown", nil)
	r.ServeHTTP(w, req)
	if w.Code != http.StatusNotFound {
		t.Fatalf("expected 404, got %d", w.Code)
	}
}
