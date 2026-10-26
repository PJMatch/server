package dto

import "github.com/PJMatch/server/internal/models"

type SignResponse struct {
	ID         uint   `json:"id"`
	Name       string `json:"name"`
	Slug       string `json:"slug"`
	Category   string `json:"category"`
	Difficulty string `json:"difficulty"`
	VideoURL   string `json:"video_url"`
}

func ToSignResponse(sign models.Sign) SignResponse {
	return SignResponse{
		ID:         sign.ID,
		Name:       sign.Name,
		Slug:       sign.Slug,
		Category:   sign.Category,
		Difficulty: sign.Difficulty,
		VideoURL:   sign.VideoURL,
	}
}
func ToSignResponseList(signs []models.Sign) []SignResponse {
	dtos := make([]SignResponse, len(signs))
	for i, s := range signs {
		dtos[i] = ToSignResponse(s)
	}
	return dtos
}
