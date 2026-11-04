package repositories

import (
	"context"
	"errors"

	"github.com/google/uuid"
	"gorm.io/gorm"

	"github.com/PJMatch/server/internal/models"
)

var ErrSignNotFound = errors.New("sign not found")

type SignRepository interface {
	List(ctx context.Context, category, search string) ([]models.Sign, error)
	FindBySlug(ctx context.Context, slug string) (*models.Sign, error)
	FindByID(ctx context.Context, id uuid.UUID) (*models.Sign, error)
}

type signRepository struct {
	db *gorm.DB
}

func NewSignRepository(db *gorm.DB) SignRepository {
	return &signRepository{db: db}
}

func (r *signRepository) List(ctx context.Context, category, search string) ([]models.Sign, error) {
	q := r.db.WithContext(ctx).Model(&models.Sign{})
	if category != "" {
		q = q.Where("category = ?", category)
	}
	if search != "" {
		like := "%" + search + "%"
		q = q.Where("name ILIKE ? OR slug ILIKE ?", like, like)
	}

	var signs []models.Sign
	if err := q.Order("name").Find(&signs).Error; err != nil {
		return nil, err
	}
	return signs, nil
}

func (r *signRepository) FindBySlug(ctx context.Context, slug string) (*models.Sign, error) {
	var sign models.Sign
	err := r.db.WithContext(ctx).Where("slug = ?", slug).First(&sign).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, ErrSignNotFound
	}
	if err != nil {
		return nil, err
	}
	return &sign, nil
}

func (r *signRepository) FindByID(ctx context.Context, id uuid.UUID) (*models.Sign, error) {
	var sign models.Sign
	err := r.db.WithContext(ctx).Where("id = ?", id).First(&sign).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, ErrSignNotFound
	}
	if err != nil {
		return nil, err
	}
	return &sign, nil
}
