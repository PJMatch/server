package utils

import (
	"regexp"
	"testing"
)

func TestGenerateRecoveryKeysFormat(t *testing.T) {
	keys, err := GenerateRecoveryKeys(RecoveryKeyCount)
	if err != nil {
		t.Fatalf("generate: %v", err)
	}
	if len(keys) != RecoveryKeyCount {
		t.Fatalf("expected %d keys, got %d", RecoveryKeyCount, len(keys))
	}

	format := regexp.MustCompile(`^[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}$`)
	seen := map[string]bool{}
	for _, key := range keys {
		if !format.MatchString(key) {
			t.Errorf("unexpected key format: %q", key)
		}
		if seen[key] {
			t.Errorf("duplicate key: %q", key)
		}
		seen[key] = true
	}
}

func TestHashRecoveryKeyIgnoresFormatting(t *testing.T) {
	want := HashRecoveryKey("ABCD-EFGH-JKLM")
	for _, variant := range []string{"abcd-efgh-jklm", "ABCDEFGHJKLM", " abcd efgh jklm "} {
		if got := HashRecoveryKey(variant); got != want {
			t.Errorf("hash of %q differs from canonical key", variant)
		}
	}
	if HashRecoveryKey("ABCD-EFGH-JKLN") == want {
		t.Error("different keys must have different hashes")
	}
	if len(want) != 64 {
		t.Errorf("expected 64-char sha256 hex, got %d", len(want))
	}
}
