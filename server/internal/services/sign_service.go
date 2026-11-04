package services

import (
	"context"
	"errors"

	"github.com/PJMatch/server/internal/models"
	"github.com/PJMatch/server/internal/repositories"
)

var ErrSignNotFound = errors.New("sign not found")

type SignService interface {
	List(ctx context.Context, category, search string) ([]models.Sign, error)
}

type signService struct {
	repo repositories.SignRepository
}

func NewSignService(repo repositories.SignRepository) SignService {
	return &signService{repo: repo}
}

func (s *signService) List(ctx context.Context, category, search string) ([]models.Sign, error) {
	return s.repo.List(ctx, category, search)
}
