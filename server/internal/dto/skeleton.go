package dto

import (
	"encoding/json"
	"fmt"
	"time"

	"github.com/google/uuid"

	"github.com/PJMatch/server/internal/models"
)

type RecordingDateTime struct {
	time.Time
}

func (d *RecordingDateTime) UnmarshalJSON(data []byte) error {
	var raw string
	if err := json.Unmarshal(data, &raw); err != nil {
		return err
	}
	layouts := []string{
		time.RFC3339Nano,
		"2006-01-02T15:04:05.999999999",
		"2006-01-02T15:04:05",
	}
	for _, layout := range layouts {
		if parsed, err := time.Parse(layout, raw); err == nil {
			d.Time = parsed
			return nil
		}
	}
	return fmt.Errorf("invalid recording_date format: %q", raw)
}

func (d RecordingDateTime) MarshalJSON() ([]byte, error) {
	return json.Marshal(d.Time.Format("2006-01-02T15:04:05.999999999"))
}

type GlossSegment struct {
	Gloss    string
	EndFrame int
}

func (g *GlossSegment) UnmarshalJSON(data []byte) error {
	var raw []json.RawMessage
	if err := json.Unmarshal(data, &raw); err != nil {
		return err
	}
	if len(raw) != 2 {
		return fmt.Errorf("gloss segment must have exactly 2 elements: [gloss, end_frame]")
	}
	if err := json.Unmarshal(raw[0], &g.Gloss); err != nil {
		return fmt.Errorf("gloss segment gloss must be a string: %w", err)
	}
	if err := json.Unmarshal(raw[1], &g.EndFrame); err != nil {
		return fmt.Errorf("gloss segment end_frame must be an integer: %w", err)
	}
	return nil
}

func (g GlossSegment) MarshalJSON() ([]byte, error) {
	return json.Marshal([]any{g.Gloss, g.EndFrame})
}

type Resolution struct {
	Width  int `json:"width" binding:"required,gt=0"`
	Height int `json:"height" binding:"required,gt=0"`
}

type SkeletonMetadata struct {
	FPS            float64    `json:"fps" binding:"required,gt=0"`
	FrameCount     int        `json:"frame_count" binding:"required,gt=0"`
	KeypointsCount int        `json:"keypoints_count" binding:"gte=0"`
	Source         string     `json:"source" binding:"required"`
	Resolution     Resolution `json:"resolution" binding:"required"`
}

type Keypoint []float64

type SkeletonFrame struct {
	FrameIdx int        `json:"frame_idx" binding:"gte=0"`
	Body     []Keypoint `json:"body"`
	Face     []Keypoint `json:"face"`
	Mouth    []Keypoint `json:"mouth"`
	LH       []Keypoint `json:"lh"`
	RH       []Keypoint `json:"rh"`
}

type UploadSkeletonRequest struct {
	RecordedCorrectly bool              `json:"recorded_correctly"`
	PersonID          string            `json:"person_id" binding:"required"`
	SentenceID        string            `json:"sentence_id" binding:"required"`
	RecordingDate     RecordingDateTime `json:"recording_date" binding:"required"`
	Sentence          string            `json:"sentence" binding:"required"`
	Glosses           []GlossSegment    `json:"glosses" binding:"required,min=1"`
	Metadata          SkeletonMetadata  `json:"metadata" binding:"required"`
	Frames            []SkeletonFrame   `json:"frames" binding:"required,min=1"`
}

func (r *UploadSkeletonRequest) Validate() error {
	if len(r.Frames) == 0 {
		return fmt.Errorf("frames must not be empty")
	}
	if r.Metadata.FrameCount != len(r.Frames) {
		return fmt.Errorf("metadata.frame_count (%d) does not match number of frames (%d)", r.Metadata.FrameCount, len(r.Frames))
	}
	if r.Metadata.FPS <= 0 {
		return fmt.Errorf("metadata.fps must be greater than 0")
	}
	if r.Metadata.Source == "" {
		return fmt.Errorf("metadata.source must not be empty")
	}
	if r.Metadata.Resolution.Width <= 0 || r.Metadata.Resolution.Height <= 0 {
		return fmt.Errorf("metadata.resolution width and height must be greater than 0")
	}
	for i, gloss := range r.Glosses {
		if gloss.Gloss == "" {
			return fmt.Errorf("glosses[%d] gloss must not be empty", i)
		}
		if gloss.EndFrame < 0 || gloss.EndFrame >= r.Metadata.FrameCount {
			return fmt.Errorf("glosses[%d] end_frame %d out of range [0, %d)", i, gloss.EndFrame, r.Metadata.FrameCount)
		}
	}
	for i, frame := range r.Frames {
		if frame.FrameIdx != i {
			return fmt.Errorf("frames[%d] frame_idx %d out of order, expected %d", i, frame.FrameIdx, i)
		}
		groups := map[string][]Keypoint{
			"body":  frame.Body,
			"face":  frame.Face,
			"mouth": frame.Mouth,
			"lh":    frame.LH,
			"rh":    frame.RH,
		}
		for name, keypoints := range groups {
			for j, keypoint := range keypoints {
				if len(keypoint) != 4 {
					return fmt.Errorf("frames[%d].%s[%d] must have exactly 4 values [x, y, z, visibility], got %d", i, name, j, len(keypoint))
				}
			}
		}
		if r.Metadata.KeypointsCount > 0 {
			total := len(frame.Body) + len(frame.Face) + len(frame.Mouth) + len(frame.LH) + len(frame.RH)
			if total > r.Metadata.KeypointsCount {
				return fmt.Errorf("frames[%d] has %d keypoints, more than metadata.keypoints_count %d", i, total, r.Metadata.KeypointsCount)
			}
		}
	}
	return nil
}

func (r *UploadSkeletonRequest) ToSkeleton(userID uuid.UUID, signID uuid.UUID, filePath string) models.Skeleton {
	return models.Skeleton{
		UserID:     userID,
		SignID:     signID,
		FilePath:   filePath,
		FrameCount: len(r.Frames),
		Fps:        r.Metadata.FPS,
		Source:     r.Metadata.Source,
		CreatedAt:  r.RecordingDate.Time,
	}
}

type SkeletonResponseDTO struct {
	ID         uuid.UUID `json:"id"`
	UserID     uuid.UUID `json:"user_id"`
	SignID     uuid.UUID `json:"sign_id"`
	FilePath   string    `json:"file_path"`
	FrameCount int       `json:"frame_count"`
	Fps        float64   `json:"fps"`
	Source     string    `json:"source"`
	CreatedAt  time.Time `json:"created_at"`
}

func ToSkeletonResponse(skeleton models.Skeleton) SkeletonResponseDTO {
	return SkeletonResponseDTO{
		ID:         skeleton.ID,
		UserID:     skeleton.UserID,
		SignID:     skeleton.SignID,
		FilePath:   skeleton.FilePath,
		FrameCount: skeleton.FrameCount,
		Fps:        skeleton.Fps,
		Source:     skeleton.Source,
		CreatedAt:  skeleton.CreatedAt,
	}
}

func ToSkeletonResponseList(skeletons []models.Skeleton) []SkeletonResponseDTO {
	dtos := make([]SkeletonResponseDTO, len(skeletons))
	for i, s := range skeletons {
		dtos[i] = ToSkeletonResponse(s)
	}
	return dtos
}

func (d SkeletonResponseDTO) ToSkeleton() models.Skeleton {
	return models.Skeleton{
		ID:         d.ID,
		UserID:     d.UserID,
		SignID:     d.SignID,
		FilePath:   d.FilePath,
		FrameCount: d.FrameCount,
		Fps:        d.Fps,
		Source:     d.Source,
		CreatedAt:  d.CreatedAt,
	}
}
