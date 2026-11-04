package database

import (
	"encoding/json"
	"fmt"
	"log"
	"os"

	"github.com/PJMatch/server/internal/models"

	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

func SeedSigns(db *gorm.DB, filePath string) error {
	data, err := os.ReadFile(filePath)
	if err != nil {
		return fmt.Errorf("failed to read seed file %s: %w", filePath, err)
	}

	var signs []models.Sign
	if err := json.Unmarshal(data, &signs); err != nil {
		return fmt.Errorf("failed to unmarshal seed data: %w", err)
	}

	if len(signs) == 0 {
		return nil
	}
	result := db.Clauses(clause.OnConflict{
		Columns:   []clause.Column{{Name: "slug"}},
		DoNothing: true,
	}).Create(&signs)

	if result.Error != nil {
		return fmt.Errorf("failed to seed signs into database: %w", result.Error)
	}

	log.Printf("[Seeder] Signs dictionary processed: %d defined, %d inserted", len(signs), result.RowsAffected)
	return nil
}
