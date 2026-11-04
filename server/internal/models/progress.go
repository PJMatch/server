package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type UserProgress struct {
	ID              uuid.UUID `gorm:"type:uuid;primaryKey"`
	UserID          uuid.UUID `gorm:"type:uuid;not null;uniqueIndex:idx_user_sign"`
	User            User      `gorm:"constraint:OnUpdate:CASCADE,OnDelete:CASCADE;"`
	SignID          uuid.UUID `gorm:"type:uuid;not null;uniqueIndex:idx_user_sign"`
	Sign            Sign      `gorm:"constraint:OnUpdate:CASCADE,OnDelete:CASCADE;"`
	BestAccuracy    float64   `gorm:"type:decimal(5,2);not null;default:0"`
	AttemptsCount   int       `gorm:"not null;default:0"`
	IsMastered      bool      `gorm:"not null;default:false"`
	LastPracticedAt time.Time `gorm:"not null"`
}

func (p *UserProgress) BeforeCreate(tx *gorm.DB) error {
	if p.ID == uuid.Nil {
		p.ID = uuid.New()
	}
	return nil
}
