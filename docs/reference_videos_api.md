# Instrukcja: Obsługa nagrań referencyjnych (Reference Videos API)

Niniejszy dokument opisuje architekturę oraz sposób korzystania z nagrań referencyjnych (filmików instruktażowych dla zdań/znaków PJM) w aplikacji **PJMatch**.

---

## 1. Dostępne Endpointy API

Wszystkie endpointy są dostępne pod prefiksem `/api/v1/references` i są publiczne (nie wymagają nagłówka `Authorization`, aby aplikacja mogła od razu strumieniować wideo do odtwarzacza):

### `GET /api/v1/references`
Zwraca listę wszystkich zarejestrowanych nagrań referencyjnych w bazie.

**Przykładowa odpowiedź (`200 OK`):**
```json
[
  {
    "id": "e4b1054a-5b12-4f76-bc3a-9694240763ec",
    "sign_slug": "sentence_1",
    "title": "Nie rozumiem, co ty mówisz.",
    "file_path": "videos/sentence_1.mp4",
    "video_url": "/api/v1/references/sentence_1/video",
    "mime_type": "video/mp4",
    "created_at": "2026-11-14T10:00:00Z"
  },
  {
    "id": "f5c2165b-6c23-5a87-cd4b-0705351874fd",
    "sign_slug": "sentence_2",
    "title": "Dzień dobry, jak się dzisiaj czujesz?",
    "file_path": "videos/sentence_2.mp4",
    "video_url": "/api/v1/references/sentence_2/video",
    "mime_type": "video/mp4",
    "created_at": "2026-11-14T10:00:00Z"
  }
]
```

---

### `GET /api/v1/references/:slug`
Zwraca metadane pojedynczego nagrania na podstawie jego identyfikatora (`slug`, np. `sentence_1`).

**Przykładowy request:**
`GET /api/v1/references/sentence_1`

**Przykładowa odpowiedź (`200 OK`):**
```json
{
  "id": "e4b1054a-5b12-4f76-bc3a-9694240763ec",
  "sign_slug": "sentence_1",
  "title": "Nie rozumiem, co ty mówisz.",
  "file_path": "videos/sentence_1.mp4",
  "video_url": "/api/v1/references/sentence_1/video",
  "mime_type": "video/mp4",
  "created_at": "2026-11-14T10:00:00Z"
}
```

---

### `GET /api/v1/references/:slug/video`
Endpoint strumieniujący plik wideo.

* **Obsługa streamingu:** Endpoint w pełni obsługuje nagłówki `Range` oraz kody `206 Partial Content`. Dzięki temu przeglądarka internetowa może przewijać wideo, buforować fragmentami i odtwarzać od dowolnego momentu.
* **Typ MIME:** Zwracany w nagłówku `Content-Type` (domyślnie `video/mp4`).

**Kody błędów:**
* `404 Not Found` – brak wpisu w bazie (`{"error": "reference not found"}`) lub brak pliku MP4 na dysku serwera (`{"error": "video file not found on server"}`).

---

## 2. Gdzie umieszczać pliki wideo na serwerze?

Pliki wideo umieszczane są w katalogu:
```text
storage/videos/
```
Przykładowo dla 4 zdań z aplikacji:
```text
storage/videos/
├── sentence_1.mp4
├── sentence_2.mp4
├── sentence_3.mp4
└── sentence_4.mp4
```

> **Wskazówka:** Konfiguracja domyślnych nagrań ładowana jest przy starcie serwera z pliku `server/internal/database/references.json`. Można tam w dowolnej chwili dopisać kolejne zdania lub znaki.

---

## 3. Przykłady użycia ze strony aplikacji (React / TypeScript)

### Wariant 1: Bezpośrednie osadzenie w komponencie wideo (Najprostszy)

Wystarczy przekazać adres URL endpointu do standardowego elementu `<video>` w React:

```tsx
import React from 'react';

interface ReferencePlayerProps {
  sentenceSlug: string; // np. "sentence_1"
}

export const ReferencePlayer: React.FC<ReferencePlayerProps> = ({ sentenceSlug }) => {
  const videoSrc = `/api/v1/references/${sentenceSlug}/video`;

  return (
    <div className="rounded-2xl overflow-hidden border-2 border-blue-900 bg-black aspect-video">
      <video
        key={sentenceSlug} // Wymusza przeładowanie wideo przy zmianie zdania
        src={videoSrc}
        controls
        playsInline
        preload="metadata"
        className="w-full h-full object-contain"
      >
        Twoja przeglądarka nie obsługuje odtwarzania wideo.
      </video>
    </div>
  );
};
```

---

### Wariant 2: Pobranie metadanych przez Axios przed odtworzeniem

Jeśli aplikacja potrzebuje sprawdzić dostępność filmiku lub wyświetlić jego tytuł:

```tsx
import { useEffect, useState } from 'react';
import api from '../services/api';

interface ReferenceMeta {
  sign_slug: string;
  title: string;
  video_url: string;
}

export function useReferenceVideo(sentenceSlug: string) {
  const [meta, setMeta] = useState<ReferenceMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasVideo, setHasVideo] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    api.get<ReferenceMeta>(`/references/${sentenceSlug}`)
      .then((res) => {
        if (isMounted) {
          setMeta(res.data);
          setHasVideo(true);
        }
      })
      .catch(() => {
        if (isMounted) {
          setMeta(null);
          setHasVideo(false);
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => { isMounted = false; };
  }, [sentenceSlug]);

  return { meta, loading, hasVideo };
}
```

---

### Wariant 3: Integracja z `RecordSentencePage`

W widoku nagrywania (`client/src/pages/RecordSentencePage.tsx`), w panelu pomocniczym obok kamery użytkownika:

```tsx
// selectedSentenceIdx to indeks aktualnie wybranego zdania (0, 1, 2...)
const currentSlug = `sentence_${selectedSentenceIdx + 1}`;

<div className="flex flex-col gap-2">
  <span className="text-sm font-bold text-blue-900">Nagranie wzorcowe (refka):</span>
  <video
    src={`/api/v1/references/${currentSlug}/video`}
    controls
    loop
    muted
    className="rounded-xl border-2 border-blue-900 w-full"
  />
</div>
```
