package database

import (
	"strings"
	"testing"

	"github.com/PJMatch/server/internal/models"
)

func TestParseSentencesEmbeddedDataset(t *testing.T) {
	sentences, err := parseSentences(sentencesJSON)
	if err != nil {
		t.Fatalf("embedded sentences.json is invalid: %v", err)
	}
	if len(sentences) == 0 {
		t.Fatal("expected sentences in embedded dataset")
	}
	for _, s := range sentences {
		if !s.Active {
			t.Fatalf("sentence %d not marked active", s.ID)
		}
	}
}

func TestParseSentencesValid(t *testing.T) {
	data := `[{"id": 3, "text": "Dlaczego wczoraj nie byłeś w szkole?",
		"glosses": ["WCZORAJ", "SZKOŁA", "NIE-BYŁO", "DLACZEGO"],
		"glosses_lemma": ["WCZORAJ", "SZKOŁA", "NIE-BYĆ", "DLACZEGO"]}]`

	sentences, err := parseSentences([]byte(data))
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	s := sentences[0]
	if s.ID != 3 || s.Glosses[2] != "NIE-BYŁO" || s.GlossesLemma[2] != "NIE-BYĆ" {
		t.Fatalf("unexpected sentence: %+v", s)
	}
}

func TestParseSentencesInvalid(t *testing.T) {
	cases := map[string]struct {
		data    string
		wantErr string
	}{
		"empty list":   {`[]`, "empty"},
		"bad json":     {`{`, "unmarshal"},
		"missing id":   {`[{"text": "a", "glosses": ["A"], "glosses_lemma": ["A"]}]`, "no id"},
		"duplicate id": {`[{"id": 1, "text": "a", "glosses": ["A"], "glosses_lemma": ["A"]}, {"id": 1, "text": "b", "glosses": ["B"], "glosses_lemma": ["B"]}]`, "duplicate"},
		"empty text":   {`[{"id": 1, "text": "", "glosses": ["A"], "glosses_lemma": ["A"]}]`, "empty text"},
		"no glosses":   {`[{"id": 1, "text": "a", "glosses": [], "glosses_lemma": ["A"]}]`, "no glosses"},
	}
	for name, tc := range cases {
		t.Run(name, func(t *testing.T) {
			_, err := parseSentences([]byte(tc.data))
			if err == nil || !strings.Contains(err.Error(), tc.wantErr) {
				t.Fatalf("expected error containing %q, got %v", tc.wantErr, err)
			}
		})
	}
}

func TestStringListRoundTrip(t *testing.T) {
	in := models.StringList{"ZMĘCZONY", "JA"}
	v, err := in.Value()
	if err != nil {
		t.Fatal(err)
	}
	var out models.StringList
	if err := out.Scan([]byte(v.(string))); err != nil {
		t.Fatal(err)
	}
	if len(out) != 2 || out[0] != "ZMĘCZONY" || out[1] != "JA" {
		t.Fatalf("round trip mismatch: %v", out)
	}

	empty, _ := models.StringList(nil).Value()
	if empty != "[]" {
		t.Fatalf("nil list should store as [], got %v", empty)
	}
}
