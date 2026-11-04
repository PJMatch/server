package repositories

import (
	"context"
	"database/sql"
	"errors"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"

	"github.com/PJMatch/server/internal/models"
)

var ErrProgressNotFound = errors.New("progress not found")

type UserStats struct {
	UploadedSkeletons int64
	LearnedSigns      int64
	AverageAccuracy   float64
	LastActivity      *time.Time
}

type ProgressRepository interface {
	FindByUserAndSign(ctx context.Context, userID, signID uuid.UUID) (*models.UserProgress, error)
	Create(ctx context.Context, progress *models.UserProgress) error
	Save(ctx context.Context, progress *models.UserProgress) error
	Stats(ctx context.Context, userID uuid.UUID) (UserStats, error)
}

type progressRepository struct {
	db *gorm.DB
}

func NewProgressRepository(db *gorm.DB) ProgressRepository {
	return &progressRepository{db: db}
}

func (r *progressRepository) FindByUserAndSign(ctx context.Context, userID, signID uuid.UUID) (*models.UserProgress, error) {
	var progress models.UserProgress
	err := r.db.WithContext(ctx).Where("user_id = ? AND sign_id = ?", userID, signID).First(&progress).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, ErrProgressNotFound
	}
	if err != nil {
		return nil, err
	}
	return &progress, nil
}

func (r *progressRepository) Create(ctx context.Context, progress *models.UserProgress) error {
	return r.db.WithContext(ctx).Create(progress).Error
}

func (r *progressRepository) Save(ctx context.Context, progress *models.UserProgress) error {
	return r.db.WithContext(ctx).Save(progress).Error
}

func (r *progressRepository) Stats(ctx context.Context, userID uuid.UUID) (UserStats, error) {
	var stats UserStats
	db := r.db.WithContext(ctx)

	if err := db.Model(&models.Skeleton{}).Where("user_id = ?", userID).Count(&stats.UploadedSkeletons).Error; err != nil {
		return stats, err
	}
	if err := db.Model(&models.UserProgress{}).Where("user_id = ? AND is_mastered = ?", userID, true).Count(&stats.LearnedSigns).Error; err != nil {
		return stats, err
	}

	var avg sql.NullFloat64
	if err := db.Model(&models.UserProgress{}).Where("user_id = ?", userID).Select("AVG(best_accuracy)").Row().Scan(&avg); err != nil {
		return stats, err
	}
	if avg.Valid {
		stats.AverageAccuracy = avg.Float64
	}

	skeletonAt, err := maxTime(db, &models.Skeleton{}, "created_at", userID)
	if err != nil {
		return stats, err
	}
	practicedAt, err := maxTime(db, &models.UserProgress{}, "last_practiced_at", userID)
	if err != nil {
		return stats, err
	}
	stats.LastActivity = later(skeletonAt, practicedAt)
	return stats, nil
}

func maxTime(db *gorm.DB, model any, column string, userID uuid.UUID) (*time.Time, error) {
	var value sql.NullTime
	err := db.Model(model).Where("user_id = ?", userID).Select("MAX(" + column + ")").Row().Scan(&value)
	if err != nil || !value.Valid {
		return nil, err
	}
	t := value.Time
	return &t, nil
}

func later(a, b *time.Time) *time.Time {
	if a == nil {
		return b
	}
	if b == nil || !b.After(*a) {
		return a
	}
	return b
}
