package dto

import (
	"math"
	"time"

	"github.com/google/uuid"

	"github.com/PJMatch/server/internal/models"
)

type UpdateProgressRequest struct {
	SignID   uuid.UUID `json:"sign_id" binding:"required"`
	Accuracy float64   `json:"accuracy" binding:"gte=0,lte=100"`
}

type UserProgressDTO struct {
	ID              uuid.UUID `json:"id"`
	UserID          uuid.UUID `json:"user_id"`
	SignID          uuid.UUID `json:"sign_id"`
	BestAccuracy    float64   `json:"best_accuracy"`
	AttemptsCount   int       `json:"attempts_count"`
	IsMastered      bool      `json:"is_mastered"`
	LastPracticedAt time.Time `json:"last_practiced_at"`
}

type UserStatsResponseDTO struct {
	UploadedSkeletons int        `json:"uploaded_skeletons"`
	LearnedSigns      int        `json:"learned_signs"`
	AverageAccuracy   float64    `json:"average_accuracy"`
	LastActivity      *time.Time `json:"last_activity"`
}

func ToUserProgressDTO(p models.UserProgress) UserProgressDTO {
	return UserProgressDTO{
		ID:              p.ID,
		UserID:          p.UserID,
		SignID:          p.SignID,
		BestAccuracy:    p.BestAccuracy,
		AttemptsCount:   p.AttemptsCount,
		IsMastered:      p.IsMastered,
		LastPracticedAt: p.LastPracticedAt,
	}
}

func ToUserStatsResponse(uploaded, learned int, avg float64, last *time.Time) UserStatsResponseDTO {
	return UserStatsResponseDTO{
		UploadedSkeletons: uploaded,
		LearnedSigns:      learned,
		AverageAccuracy:   math.Round(avg*100) / 100,
		LastActivity:      last,
	}
}
