package services

import (
	"context"
	"errors"
	"os"

	"github.com/PJMatch/server/internal/models"
	"github.com/PJMatch/server/internal/repositories"
)

var (
	ErrReferenceNotFound = repositories.ErrReferenceNotFound
	ErrVideoFileNotFound = errors.New("video file not found on disk")
)

type ReferenceService interface {
	List(ctx context.Context) ([]models.ReferenceVideo, error)
	GetBySlug(ctx context.Context, slug string) (*models.ReferenceVideo, error)
	GetVideoFilePath(ctx context.Context, slug string) (string, *models.ReferenceVideo, error)
}

type referenceService struct {
	repo    repositories.ReferenceRepository
	storage StorageService
}

func NewReferenceService(repo repositories.ReferenceRepository, storage StorageService) ReferenceService {
	return &referenceService{repo: repo, storage: storage}
}

func (s *referenceService) List(ctx context.Context) ([]models.ReferenceVideo, error) {
	return s.repo.List(ctx)
}

func (s *referenceService) GetBySlug(ctx context.Context, slug string) (*models.ReferenceVideo, error) {
	return s.repo.FindBySlug(ctx, slug)
}

func (s *referenceService) GetVideoFilePath(ctx context.Context, slug string) (string, *models.ReferenceVideo, error) {
	ref, err := s.repo.FindBySlug(ctx, slug)
	if err != nil {
		return "", nil, err
	}

	fullPath, err := s.storage.GetFilePath(ref.FilePath)
	if errors.Is(err, os.ErrNotExist) {
		return "", ref, ErrVideoFileNotFound
	}
	if err != nil {
		return "", ref, err
	}

	return fullPath, ref, nil
}
