package dto

import (
	"time"

	"github.com/google/uuid"

	"github.com/PJMatch/server/internal/models"
)

type ReferenceResponse struct {
	ID          uuid.UUID `json:"id"`
	SignSlug    string    `json:"sign_slug"`
	Title       string    `json:"title"`
	FilePath    string    `json:"file_path"`
	VideoURL    string    `json:"video_url"`
	MimeType    string    `json:"mime_type"`
	DurationSec float64   `json:"duration_sec,omitempty"`
	CreatedAt   time.Time `json:"created_at"`
}

func ToReferenceResponse(ref models.ReferenceVideo) ReferenceResponse {
	return ReferenceResponse{
		ID:          ref.ID,
		SignSlug:    ref.SignSlug,
		Title:       ref.Title,
		FilePath:    ref.FilePath,
		VideoURL:    "/api/v1/references/" + ref.SignSlug + "/video",
		MimeType:    ref.MimeType,
		DurationSec: ref.DurationSec,
		CreatedAt:   ref.CreatedAt,
	}
}

func ToReferenceResponseList(refs []models.ReferenceVideo) []ReferenceResponse {
	out := make([]ReferenceResponse, len(refs))
	for i, r := range refs {
		out[i] = ToReferenceResponse(r)
	}
	return out
}
