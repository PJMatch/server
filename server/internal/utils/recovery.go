package utils

import (
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"strings"
)

const (
	RecoveryKeyCount = 8

	recoveryAlphabet   = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
	recoveryKeyLength  = 12
	recoveryGroupWidth = 4
)

func GenerateRecoveryKeys(n int) ([]string, error) {
	keys := make([]string, n)
	for i := range keys {
		key, err := generateRecoveryKey()
		if err != nil {
			return nil, err
		}
		keys[i] = key
	}
	return keys, nil
}

func generateRecoveryKey() (string, error) {
	buf := make([]byte, recoveryKeyLength)
	if _, err := rand.Read(buf); err != nil {
		return "", err
	}

	var sb strings.Builder
	for i, b := range buf {
		if i > 0 && i%recoveryGroupWidth == 0 {
			sb.WriteByte('-')
		}
		sb.WriteByte(recoveryAlphabet[int(b)%len(recoveryAlphabet)])
	}
	return sb.String(), nil
}

func NormalizeRecoveryKey(key string) string {
	key = strings.ToUpper(key)
	return strings.Map(func(r rune) rune {
		if r == '-' || r == ' ' || r == '\t' {
			return -1
		}
		return r
	}, key)
}

func HashRecoveryKey(key string) string {
	sum := sha256.Sum256([]byte(NormalizeRecoveryKey(key)))
	return hex.EncodeToString(sum[:])
}
