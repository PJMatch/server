package models

import "time"

type Sign struct {
	ID         uint   `gorm:"primaryKey"`
	Name       string `gorm:"size:100;not null"`
	Slug       string `gorm:"size:100;uniqueIndex;not null"`
	Category   string `gorm:"size:50;not null"`
	Difficulty string `gorm:"size:20;not null"`
	VideoURL   string `gorm:"size:255" json:"video_url"`
	CreatedAt  time.Time
	UpdatedAt  time.Time
}
