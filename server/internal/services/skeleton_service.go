package services

import (
	"context"
	"errors"

	"github.com/google/uuid"

	"github.com/PJMatch/server/internal/dto"
	"github.com/PJMatch/server/internal/models"
	"github.com/PJMatch/server/internal/repositories"
)

var (
	ErrSkeletonNotFound = errors.New("skeleton not found")
	ErrForbidden        = errors.New("forbidden")
)

type SkeletonService interface {
	Upload(ctx context.Context, userID uuid.UUID, req dto.UploadSkeletonRequest, raw []byte) (*models.Skeleton, error)
	ListMine(ctx context.Context, userID uuid.UUID) ([]models.Skeleton, error)
	Delete(ctx context.Context, userID, id uuid.UUID) error
}

type skeletonService struct {
	repo    repositories.SkeletonRepository
	signs   repositories.SignRepository
	storage StorageService
}

func NewSkeletonService(repo repositories.SkeletonRepository, signs repositories.SignRepository, storage StorageService) SkeletonService {
	return &skeletonService{repo: repo, signs: signs, storage: storage}
}

func (s *skeletonService) Upload(ctx context.Context, userID uuid.UUID, req dto.UploadSkeletonRequest, raw []byte) (*models.Skeleton, error) {
	sign, err := s.signs.FindBySlug(ctx, req.SignSlug)
	if errors.Is(err, repositories.ErrSignNotFound) {
		return nil, ErrSignNotFound
	}
	if err != nil {
		return nil, err
	}

	id := uuid.New()
	filePath, err := s.storage.SaveSkeleton(sign.Slug, userID, id, raw)
	if err != nil {
		return nil, err
	}

	skeleton := req.ToSkeleton(userID, sign.ID, filePath)
	skeleton.ID = id
	if err := s.repo.Create(ctx, &skeleton); err != nil {
		_ = s.storage.Delete(filePath)
		return nil, err
	}
	return &skeleton, nil
}

func (s *skeletonService) ListMine(ctx context.Context, userID uuid.UUID) ([]models.Skeleton, error) {
	return s.repo.ListByUser(ctx, userID)
}

func (s *skeletonService) Delete(ctx context.Context, userID, id uuid.UUID) error {
	skeleton, err := s.repo.FindByID(ctx, id)
	if errors.Is(err, repositories.ErrSkeletonNotFound) {
		return ErrSkeletonNotFound
	}
	if err != nil {
		return err
	}
	if skeleton.UserID != userID {
		return ErrForbidden
	}
	if err := s.storage.Delete(skeleton.FilePath); err != nil {
		return err
	}
	return s.repo.Delete(ctx, id)
}
