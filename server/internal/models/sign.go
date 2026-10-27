package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Sign struct {
	ID         uuid.UUID `gorm:"type:uuid;primaryKey"`
	Name       string    `gorm:"size:100;not null"`
	Slug       string    `gorm:"size:100;uniqueIndex;not null"`
	Category   string    `gorm:"size:50;not null"`
	Difficulty string    `gorm:"size:20;not null"`
	VideoURL   string    `gorm:"size:255"`
	CreatedAt  time.Time
	UpdatedAt  time.Time
}

func (s *Sign) BeforeCreate(tx *gorm.DB) error {
	if s.ID == uuid.Nil {
		s.ID = uuid.New()
	}
	return nil
}
