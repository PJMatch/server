package repositories

import (
	"context"
	"errors"

	"github.com/google/uuid"
	"gorm.io/gorm"

	"github.com/PJMatch/server/internal/models"
)

var ErrSkeletonNotFound = errors.New("skeleton not found")

type SkeletonRepository interface {
	Create(ctx context.Context, skeleton *models.Skeleton) error
	ListByUser(ctx context.Context, userID uuid.UUID) ([]models.Skeleton, error)
	FindByID(ctx context.Context, id uuid.UUID) (*models.Skeleton, error)
	Delete(ctx context.Context, id uuid.UUID) error
}

type skeletonRepository struct {
	db *gorm.DB
}

func NewSkeletonRepository(db *gorm.DB) SkeletonRepository {
	return &skeletonRepository{db: db}
}

func (r *skeletonRepository) Create(ctx context.Context, skeleton *models.Skeleton) error {
	return r.db.WithContext(ctx).Create(skeleton).Error
}

func (r *skeletonRepository) ListByUser(ctx context.Context, userID uuid.UUID) ([]models.Skeleton, error) {
	var skeletons []models.Skeleton
	err := r.db.WithContext(ctx).Where("user_id = ?", userID).Order("created_at desc").Find(&skeletons).Error
	return skeletons, err
}

func (r *skeletonRepository) FindByID(ctx context.Context, id uuid.UUID) (*models.Skeleton, error) {
	var skeleton models.Skeleton
	err := r.db.WithContext(ctx).Where("id = ?", id).First(&skeleton).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, ErrSkeletonNotFound
	}
	if err != nil {
		return nil, err
	}
	return &skeleton, nil
}

func (r *skeletonRepository) Delete(ctx context.Context, id uuid.UUID) error {
	res := r.db.WithContext(ctx).Delete(&models.Skeleton{}, "id = ?", id)
	if res.Error != nil {
		return res.Error
	}
	if res.RowsAffected == 0 {
		return ErrSkeletonNotFound
	}
	return nil
}
