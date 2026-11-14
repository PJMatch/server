package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type ReferenceVideo struct {
	ID          uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`
	SignSlug    string    `gorm:"size:100;uniqueIndex;not null" json:"sign_slug"`
	Title       string    `gorm:"size:255;not null" json:"title"`
	FilePath    string    `gorm:"size:255;not null" json:"file_path"`
	MimeType    string    `gorm:"size:50;not null;default:'video/mp4'" json:"mime_type"`
	DurationSec float64   `gorm:"default:0" json:"duration_sec,omitempty"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

func (r *ReferenceVideo) BeforeCreate(tx *gorm.DB) error {
	if r.ID == uuid.Nil {
		r.ID = uuid.New()
	}
	if r.MimeType == "" {
		r.MimeType = "video/mp4"
	}
	return nil
}
