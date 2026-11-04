package services

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"

	"github.com/google/uuid"
)

type StorageService interface {
	SaveSkeleton(signSlug string, userID, id uuid.UUID, data []byte) (string, error)
	Delete(relPath string) error
}

type storageService struct {
	root string
}

func NewStorageService(root string) StorageService {
	return &storageService{root: root}
}

func (s *storageService) SaveSkeleton(signSlug string, userID, id uuid.UUID, data []byte) (string, error) {
	slug := strings.TrimSpace(signSlug)
	if slug == "" || strings.Contains(slug, "..") || strings.ContainsAny(slug, `/\`) {
		return "", fmt.Errorf("invalid sign slug")
	}

	rel := filepath.Join("skeletons", slug, userID.String()+"_"+id.String()+".json")
	full := filepath.Join(s.root, rel)
	if err := os.MkdirAll(filepath.Dir(full), 0o755); err != nil {
		return "", err
	}
	if err := os.WriteFile(full, data, 0o644); err != nil {
		return "", err
	}
	return rel, nil
}

func (s *storageService) Delete(relPath string) error {
	rel := filepath.Clean(relPath)
	if rel == "." || rel == "" || strings.HasPrefix(rel, "..") || filepath.IsAbs(rel) {
		return fmt.Errorf("invalid path")
	}
	err := os.Remove(filepath.Join(s.root, rel))
	if os.IsNotExist(err) {
		return nil
	}
	return err
}
