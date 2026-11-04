package services

import (
	"context"
	"errors"
	"time"

	"github.com/google/uuid"

	"github.com/PJMatch/server/internal/dto"
	"github.com/PJMatch/server/internal/models"
	"github.com/PJMatch/server/internal/repositories"
)

const masteredAccuracy = 80

type ProgressService interface {
	Update(ctx context.Context, userID uuid.UUID, req dto.UpdateProgressRequest) (*models.UserProgress, error)
	Stats(ctx context.Context, userID uuid.UUID) (dto.UserStatsResponseDTO, error)
}

type progressService struct {
	repo  repositories.ProgressRepository
	signs repositories.SignRepository
}

func NewProgressService(repo repositories.ProgressRepository, signs repositories.SignRepository) ProgressService {
	return &progressService{repo: repo, signs: signs}
}

func (s *progressService) Update(ctx context.Context, userID uuid.UUID, req dto.UpdateProgressRequest) (*models.UserProgress, error) {
	if _, err := s.signs.FindByID(ctx, req.SignID); errors.Is(err, repositories.ErrSignNotFound) {
		return nil, ErrSignNotFound
	} else if err != nil {
		return nil, err
	}

	now := time.Now().UTC()
	mastered := req.Accuracy >= masteredAccuracy
	progress, err := s.repo.FindByUserAndSign(ctx, userID, req.SignID)
	if errors.Is(err, repositories.ErrProgressNotFound) {
		progress = &models.UserProgress{
			UserID:          userID,
			SignID:          req.SignID,
			BestAccuracy:    req.Accuracy,
			AttemptsCount:   1,
			IsMastered:      mastered,
			LastPracticedAt: now,
		}
		if err := s.repo.Create(ctx, progress); err != nil {
			return nil, err
		}
		return progress, nil
	}
	if err != nil {
		return nil, err
	}

	progress.AttemptsCount++
	if req.Accuracy > progress.BestAccuracy {
		progress.BestAccuracy = req.Accuracy
	}
	if mastered {
		progress.IsMastered = true
	}
	progress.LastPracticedAt = now
	if err := s.repo.Save(ctx, progress); err != nil {
		return nil, err
	}
	return progress, nil
}

func (s *progressService) Stats(ctx context.Context, userID uuid.UUID) (dto.UserStatsResponseDTO, error) {
	stats, err := s.repo.Stats(ctx, userID)
	if err != nil {
		return dto.UserStatsResponseDTO{}, err
	}
	return dto.ToUserStatsResponse(int(stats.UploadedSkeletons), int(stats.LearnedSigns), stats.AverageAccuracy, stats.LastActivity), nil
}
