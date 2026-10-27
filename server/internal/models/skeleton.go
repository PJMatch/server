package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Skeleton struct {
	ID         uuid.UUID `gorm:"type:uuid;primaryKey"`
	UserID     uuid.UUID `gorm:"type:uuid;not null;index"`
	User       User      `gorm:"constraint:OnUpdate:CASCADE,OnDelete:CASCADE;"`
	SignID     uuid.UUID `gorm:"type:uuid;not null;index"`
	Sign       Sign      `gorm:"constraint:OnUpdate:CASCADE,OnDelete:RESTRICT;"`
	FilePath   string    `gorm:"type:varchar(255);not null"`
	FrameCount int       `gorm:"not null"`
	Fps        float64   `gorm:"type:decimal(5,2);not null"`
	Source     string    `gorm:"type:varchar(50);not null;default:'webcam'"`
	CreatedAt  time.Time `gorm:"autoCreateTime"`
}

func (s *Skeleton) BeforeCreate(tx *gorm.DB) error {
	if s.ID == uuid.Nil {
		s.ID = uuid.New()
	}
	return nil
}
