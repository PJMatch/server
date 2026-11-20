package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type RecoveryKey struct {
	ID        uuid.UUID  `gorm:"type:uuid;primaryKey"`
	UserID    uuid.UUID  `gorm:"type:uuid;not null;index"`
	User      User       `gorm:"constraint:OnUpdate:CASCADE,OnDelete:CASCADE;"`
	KeyHash   string     `gorm:"size:64;not null;index"`
	UsedAt    *time.Time `gorm:"index"`
	CreatedAt time.Time
}

func (k *RecoveryKey) BeforeCreate(tx *gorm.DB) error {
	if k.ID == uuid.Nil {
		k.ID = uuid.New()
	}
	return nil
}
