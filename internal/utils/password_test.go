package utils

import (
	"strings"
	"testing"
)

func TestHashPassword(t *testing.T) {
	hash, err := HashPassword("secret123")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if hash == "secret123" {
		t.Fatal("hash must not equal plain password")
	}
	if !strings.HasPrefix(hash, "$2a$") {
		t.Fatalf("expected bcrypt hash, got %q", hash)
	}
}

func TestHashPasswordIsSalted(t *testing.T) {
	h1, _ := HashPassword("secret123")
	h2, _ := HashPassword("secret123")
	if h1 == h2 {
		t.Fatal("two hashes of the same password should differ")
	}
}

func TestCheckPasswordHash(t *testing.T) {
	hash, err := HashPassword("secret123")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if !CheckPasswordHash("secret123", hash) {
		t.Error("correct password should match")
	}
	if CheckPasswordHash("wrong", hash) {
		t.Error("wrong password should not match")
	}
	if CheckPasswordHash("secret123", "not-a-hash") {
		t.Error("invalid hash should not match")
	}
}

func TestHashPasswordTooLong(t *testing.T) {
	if _, err := HashPassword(strings.Repeat("a", 73)); err == nil {
		t.Error("expected error for password longer than 72 bytes")
	}
}
