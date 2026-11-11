package database

import (
	_ "embed"
	"encoding/json"
	"fmt"
	"log"

	"github.com/PJMatch/server/internal/models"

	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

// sentencesJSON is generated from the PJMatch/Dataset repository by
// Sentences/export_sentences.py
// Do not edit it by hand: change the xlsx in the
// Dataset repository and re-export instead
//
//go:embed sentences.json
var sentencesJSON []byte

// syncs the sentences table with the embedded dataset export
func SeedSentences(db *gorm.DB) error {
	sentences, err := parseSentences(sentencesJSON)
	if err != nil {
		return err
	}
	return syncSentences(db, sentences)
}

// decodes and validates the dataset export
func parseSentences(data []byte) ([]models.Sentence, error) {
	var sentences []models.Sentence
	if err := json.Unmarshal(data, &sentences); err != nil {
		return nil, fmt.Errorf("failed to unmarshal sentences: %w", err)
	}
	if len(sentences) == 0 {
		return nil, fmt.Errorf("sentences dataset is empty")
	}

	seen := make(map[uint]bool, len(sentences))
	for i := range sentences {
		s := &sentences[i]
		switch {
		case s.ID == 0:
			return nil, fmt.Errorf("sentence at position %d has no id", i)
		case seen[s.ID]:
			return nil, fmt.Errorf("duplicate sentence id %d", s.ID)
		case s.Text == "":
			return nil, fmt.Errorf("sentence %d has empty text", s.ID)
		case len(s.Glosses) == 0 || len(s.GlossesLemma) == 0:
			return nil, fmt.Errorf("sentence %d has no glosses", s.ID)
		}
		seen[s.ID] = true
		s.Active = true
	}
	return sentences, nil
}

// upserts every sentence by id and deactivates sentences missing from the
// dataset, so the table always mirrors the export
func syncSentences(db *gorm.DB, sentences []models.Sentence) error {
	ids := make([]uint, len(sentences))
	for i, s := range sentences {
		ids[i] = s.ID
	}

	var deactivated int64
	err := db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Clauses(clause.OnConflict{
			Columns:   []clause.Column{{Name: "id"}},
			DoUpdates: clause.AssignmentColumns([]string{"text", "glosses", "glosses_lemma", "active", "updated_at"}),
		}).CreateInBatches(&sentences, 200).Error; err != nil {
			return fmt.Errorf("failed to upsert sentences: %w", err)
		}

		res := tx.Model(&models.Sentence{}).
			Where("active = ? AND id NOT IN ?", true, ids).
			Update("active", false)
		if res.Error != nil {
			return fmt.Errorf("failed to deactivate removed sentences: %w", res.Error)
		}
		deactivated = res.RowsAffected
		return nil
	})
	if err != nil {
		return err
	}

	log.Printf("[Seeder] Sentences synced: %d active, %d deactivated", len(sentences), deactivated)
	return nil
}
