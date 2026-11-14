package repositories

import (
	"context"
	"errors"

	"github.com/google/uuid"
	"gorm.io/gorm"

	"github.com/PJMatch/server/internal/models"
)

var ErrReferenceNotFound = errors.New("reference video not found")

type ReferenceRepository interface {
	List(ctx context.Context) ([]models.ReferenceVideo, error)
	FindBySlug(ctx context.Context, slug string) (*models.ReferenceVideo, error)
	FindByID(ctx context.Context, id uuid.UUID) (*models.ReferenceVideo, error)
}

type referenceRepository struct {
	db *gorm.DB
}

func NewReferenceRepository(db *gorm.DB) ReferenceRepository {
	return &referenceRepository{db: db}
}

func (r *referenceRepository) List(ctx context.Context) ([]models.ReferenceVideo, error) {
	var list []models.ReferenceVideo
	if err := r.db.WithContext(ctx).Order("sign_slug").Find(&list).Error; err != nil {
		return nil, err
	}
	return list, nil
}

func (r *referenceRepository) FindBySlug(ctx context.Context, slug string) (*models.ReferenceVideo, error) {
	var ref models.ReferenceVideo
	err := r.db.WithContext(ctx).Where("sign_slug = ?", slug).First(&ref).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, ErrReferenceNotFound
	}
	if err != nil {
		return nil, err
	}
	return &ref, nil
}

func (r *referenceRepository) FindByID(ctx context.Context, id uuid.UUID) (*models.ReferenceVideo, error) {
	var ref models.ReferenceVideo
	err := r.db.WithContext(ctx).Where("id = ?", id).First(&ref).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, ErrReferenceNotFound
	}
	if err != nil {
		return nil, err
	}
	return &ref, nil
}
