package services

import (
	"context"
	"os"
	"path/filepath"
	"testing"

	"github.com/google/uuid"

	"github.com/PJMatch/server/internal/models"
	"github.com/PJMatch/server/internal/repositories"
)

type memoryReferenceRepo struct {
	items []models.ReferenceVideo
}

func (m *memoryReferenceRepo) List(_ context.Context) ([]models.ReferenceVideo, error) {
	return m.items, nil
}

func (m *memoryReferenceRepo) FindBySlug(_ context.Context, slug string) (*models.ReferenceVideo, error) {
	for _, item := range m.items {
		if item.SignSlug == slug {
			return &item, nil
		}
	}
	return nil, repositories.ErrReferenceNotFound
}

func (m *memoryReferenceRepo) FindByID(_ context.Context, id uuid.UUID) (*models.ReferenceVideo, error) {
	for _, item := range m.items {
		if item.ID == id {
			return &item, nil
		}
	}
	return nil, repositories.ErrReferenceNotFound
}

func TestReferenceService_ListAndGet(t *testing.T) {
	tempDir := t.TempDir()
	storage := NewStorageService(tempDir)
	repo := &memoryReferenceRepo{
		items: []models.ReferenceVideo{
			{
				ID:       uuid.New(),
				SignSlug: "sentence_1",
				Title:    "Zdanie 1",
				FilePath: "videos/s1.mp4",
				MimeType: "video/mp4",
			},
		},
	}

	svc := NewReferenceService(repo, storage)

	list, err := svc.List(context.Background())
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(list) != 1 || list[0].SignSlug != "sentence_1" {
		t.Fatalf("expected 1 item with sentence_1, got %v", list)
	}

	item, err := svc.GetBySlug(context.Background(), "sentence_1")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if item.Title != "Zdanie 1" {
		t.Fatalf("expected title 'Zdanie 1', got %s", item.Title)
	}

	_, err = svc.GetBySlug(context.Background(), "non_existent")
	if err != ErrReferenceNotFound {
		t.Fatalf("expected ErrReferenceNotFound, got %v", err)
	}
}

func TestReferenceService_GetVideoFilePath(t *testing.T) {
	tempDir := t.TempDir()
	storage := NewStorageService(tempDir)

	// Create real file in tempDir
	videoDir := filepath.Join(tempDir, "videos")
	if err := os.MkdirAll(videoDir, 0755); err != nil {
		t.Fatalf("mkdir failed: %v", err)
	}
	testVideoPath := filepath.Join(videoDir, "test.mp4")
	if err := os.WriteFile(testVideoPath, []byte("fake mp4 content"), 0644); err != nil {
		t.Fatalf("write file failed: %v", err)
	}

	repo := &memoryReferenceRepo{
		items: []models.ReferenceVideo{
			{
				ID:       uuid.New(),
				SignSlug: "with_video",
				FilePath: "videos/test.mp4",
			},
			{
				ID:       uuid.New(),
				SignSlug: "without_video",
				FilePath: "videos/missing.mp4",
			},
		},
	}

	svc := NewReferenceService(repo, storage)

	// File exists
	fullPath, ref, err := svc.GetVideoFilePath(context.Background(), "with_video")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if fullPath == "" || ref.SignSlug != "with_video" {
		t.Fatalf("expected full path, got %s", fullPath)
	}

	//File missing
	_, _, err = svc.GetVideoFilePath(context.Background(), "without_video")
	if err != ErrVideoFileNotFound {
		t.Fatalf("expected ErrVideoFileNotFound, got %v", err)
	}

	//Reference missing
	_, _, err = svc.GetVideoFilePath(context.Background(), "unknown")
	if err != ErrReferenceNotFound {
		t.Fatalf("expected ErrReferenceNotFound, got %v", err)
	}
}
