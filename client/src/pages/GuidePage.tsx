import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Card } from '../components/ui';
import { TimelineScrubber } from '../components/record/TimelineScrubber';

// ─── Konfiguracja demo osi czasu ─────────────────────────────────────────────

// ─── Strona poradnika ─────────────────────────────────────────────────────────

const DEMO_GLOSSES = ['JA', 'UCZYĆ SIĘ', 'MIGAĆ'];
const DEMO_DURATION = 4.0;
const INITIAL_TRIM_START = 0.3;
const INITIAL_TRIM_END = 3.7;
const INITIAL_MARKERS = [1.4, 2.6];

function formatDemoTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = (seconds % 60).toFixed(1).padStart(4, '0');
  return `${mins}:${secs}`;
}

export default function GuidePage() {
  const [currentTime, setCurrentTime] = useState(INITIAL_TRIM_START);
  const [trimStart, setTrimStart] = useState(INITIAL_TRIM_START);
  const [trimEnd, setTrimEnd] = useState(INITIAL_TRIM_END);
  const [glossMarkers, setGlossMarkers] = useState<number[]>(INITIAL_MARKERS);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isScrubbing, setIsScrubbing] = useState(false);

  useEffect(() => {
    if (!isPlaying || isScrubbing) return;
    const interval = window.setInterval(() => {
      setCurrentTime((prev) => {
        const next = prev + 0.05;
        return next >= trimEnd ? trimStart : next;
      });
    }, 50);
    return () => window.clearInterval(interval);
  }, [isPlaying, isScrubbing, trimStart, trimEnd]);

  const handleTrimStartChange = (newStart: number) => {
    setTrimStart(newStart);
    setCurrentTime((prev) => Math.max(prev, newStart));
  };

  const handleTrimEndChange = (newEnd: number) => {
    setTrimEnd(newEnd);
    setCurrentTime((prev) => Math.min(prev, newEnd));
  };

  const handleMarkerChange = (index: number, newTime: number) => {
    setGlossMarkers((prev) => prev.map((m, i) => (i === index ? newTime : m)));
  };

  const handleResetDemo = () => {
    setIsPlaying(false);
    setTrimStart(INITIAL_TRIM_START);
    setTrimEnd(INITIAL_TRIM_END);
    setGlossMarkers(INITIAL_MARKERS);
    setCurrentTime(INITIAL_TRIM_START);
  };

  const activeGlossIndex = (() => {
    for (let i = 0; i < glossMarkers.length; i++) {
      if (currentTime < glossMarkers[i]) return i;
    }
    return DEMO_GLOSSES.length - 1;
  })();

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col gap-16 py-12 px-6">

      {/* Nagłówek */}
      <div className="text-center flex flex-col items-center gap-4">
        <span className="inline-block bg-[#fca55d] text-blue-900 text-xs font-black uppercase tracking-widest px-4 py-1.5 rounded-full border-2 border-blue-900">
          Poradnik
        </span>
        <h1 className="text-4xl sm:text-5xl font-black tracking-tighter text-blue-900 leading-tight">
          Jak nagrywać?
        </h1>

      </div>

      {/* Sekcja: Przygotowanie */}
      <section className="flex flex-col gap-8">
        <div className="flex flex-col gap-2">
          <span className="inline-block bg-white text-blue-900 text-xs font-black uppercase tracking-widest px-4 py-1.5 rounded-full border-2 border-blue-900 w-fit">
            Krok 1
          </span>
          <h2 className="text-3xl font-black tracking-tight text-blue-900">
            Przejdź do "Nagraj zdania", zezwól na użycie kamery i wybierz zdanie z listy.
          </h2>
        </div>


      </section>

      {/* Sekcja: Podczas nagrywania */}
      <section className="flex flex-col gap-8">
        <div className="flex flex-col gap-2">
          <span className="inline-block bg-white text-blue-900 text-xs font-black uppercase tracking-widest px-4 py-1.5 rounded-full border-2 border-blue-900 w-fit">
            Krok 2
          </span>
          <h2 className="text-3xl font-black tracking-tight text-blue-900">
            Po zapoznaniu się z referencyjnym wideo, zamigaj zdanie.
          </h2>
        </div>

      
      </section>

      <section className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <span className="inline-block bg-white text-blue-900 text-xs font-black uppercase tracking-widest px-4 py-1.5 rounded-full border-2 border-blue-900 w-fit">
            Krok 3
          </span>
          <h2 className="text-3xl font-black tracking-tight text-blue-900">
            Po skończonym nagraniu, zaznacz na osi momenty, w których zaczynają się nowe sekwencje.
          </h2>
        </div>

        <Card noPadding className="p-5 sm:p-6 flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsPlaying((prev) => !prev)}
              >
                {isPlaying ? 'Pauza' : 'Odtwórz'}
              </Button>
              <span className="text-xs font-bold text-blue-900/70 bg-blue-50 border border-blue-200 rounded-lg px-2.5 py-1">
                Aktualny znak: <strong className="text-blue-900">{DEMO_GLOSSES[activeGlossIndex]}</strong>
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-black font-mono text-blue-900">
                {formatDemoTime(currentTime)} / {formatDemoTime(DEMO_DURATION)}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleResetDemo}
              >
                Resetuj
              </Button>
            </div>
          </div>

          <TimelineScrubber
            currentGlosses={DEMO_GLOSSES}
            duration={DEMO_DURATION}
            currentTime={currentTime}
            trimStart={trimStart}
            trimEnd={trimEnd}
            glossMarkers={glossMarkers}
            disabled={false}
            onTrimStartChange={handleTrimStartChange}
            onTrimEndChange={handleTrimEndChange}
            onPlayheadChange={setCurrentTime}
            onMarkerChange={handleMarkerChange}
            onScrubbingChange={setIsScrubbing}
          />

          <div className="flex flex-wrap gap-x-5 gap-y-2 pt-2 text-xs font-medium text-blue-900/70">
            <span className="inline-flex items-center gap-2">
              <span className="w-3 h-4 bg-red-600 border border-blue-900 rounded-sm inline-block" />
              Początek i koniec nagrania
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="w-3 h-4 bg-blue-900 border-2 border-[#fca55d] rounded-sm inline-block" />
              Granica między kolejnymi znakami
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="w-2.5 h-4 bg-blue-950 border border-slate-400 rounded-sm inline-block" />
              Aktualna pozycja (kliknij lub przeciągnij na osi)
            </span>
          </div>
        </Card>
      </section>

      {/* Sekcja: Czego unikać */}
      <section className="flex flex-col gap-8">
        <div className="flex flex-col gap-2">

          <h2 className="text-3xl font-black tracking-tight text-blue-900">
            Czego unikać?
          </h2>
        </div>

        <div className="bg-white border-4 border-blue-900 rounded-2xl p-8 shadow-[6px_6px_0px_0px_rgba(30,58,138,1)]">
          
          <ul className="flex flex-col gap-3 text-sm font-medium text-blue-900/70">
            <li className="flex items-start gap-3">
              <span className="text-red-500 font-black mt-0.5">✕</span>
              <span>Zbyt ciemne pomieszczenie — system nie wykryje prawidłowo punktów szkieletu</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-red-500 font-black mt-0.5">✕</span>
              <span>Dłonie poza kadrem — ważne, aby wszystkie gesty były widoczne w całości</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-red-500 font-black mt-0.5">✕</span>
              <span>Inne osoby w kadrze — mogą zakłócać ekstrakcję szkieletu</span>
            </li>

            
          </ul>
        </div>
      </section>

      {/* CTA */}
      <div className="bg-blue-900 rounded-2xl border-4 border-blue-900 p-10 text-center shadow-[8px_8px_0px_0px_rgba(252,165,93,1)] flex flex-col items-center gap-5">
        <h3 className="text-3xl font-black text-white tracking-tight">
          Gotowy do nagrywania?
        </h3>
        <p className="text-white/60 font-medium max-w-md">
          Zaloguj się i przejdź do sekcji nagrywania.
        </p>
        <div className="flex gap-3 flex-wrap justify-center">
          <Link to="/nagraj">
            <Button variant="secondary" size="lg">Zacznij nagrywać</Button>
          </Link>
          <Link to="/">
            <Button variant="ghost" size="lg" className="text-white hover:bg-white/10 border-white">
              Strona główna
            </Button>
          </Link>
        </div>
      </div>

    </div>
  );
}
