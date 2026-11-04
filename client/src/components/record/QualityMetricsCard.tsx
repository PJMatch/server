import { Card } from "../ui";
import ProgressBar from "../ui/ProgressBar";
import type { QualityMetrics } from "../../services/mediapipe";

interface QualityMetricsCardProps {
  metrics: QualityMetrics | null;
  isVisible: boolean;
}

export function QualityMetricsCard({
  metrics,
  isVisible
}: QualityMetricsCardProps) {
  const getBarColor = (val: number): 'success' | 'accent' | 'danger' => {
    if (val >= 80) return 'success';
    if (val >= 60) return 'accent';
    return 'danger';
  };

  const items = [
    {
      label: 'Barki',
      fullLabel: 'Widoczność barków',
      value: metrics?.shoulders ?? 0,
      color: getBarColor(metrics?.shoulders ?? 0)
    },
    {
      label: 'Twarz',
      fullLabel: 'Widoczność twarzy',
      value: metrics?.face ?? 0,
      color: getBarColor(metrics?.face ?? 0)
    },
    {
      label: 'Dłonie',
      fullLabel: 'Widoczność dłoni',
      value: metrics?.hands ?? 0,
      color: getBarColor(metrics?.hands ?? 0)
    },
    {
      label: 'Odległość',
      fullLabel: 'Odległość od kamery (biodra)',
      value: metrics?.distance ?? 0,
      color: getBarColor(metrics?.distance ?? 0)
    }
  ];

  return (
    <div
      className={`transition-all duration-500 ease-in-out flex-shrink-0 ${
        isVisible
          ? 'w-64 sm:w-72 md:w-80 opacity-100 translate-x-0 ml-3 sm:ml-4 overflow-visible'
          : 'w-0 max-w-0 opacity-0 translate-x-8 pointer-events-none m-0 p-0 overflow-hidden'
      }`}
    >
      <Card
        variant="flat"
        noPadding
        className="h-[52vh] sm:h-[56vh] md:h-[58vh] max-h-[calc(100vh-250px)] flex flex-col p-3 sm:p-4 bg-white"
      >
        <div className="flex-shrink-0">
          <div
            className={`w-full py-1.5 px-3 rounded-xl border-2 text-center font-black tracking-wide text-xs sm:text-sm shadow-sm transition-colors duration-300 ${
              metrics?.status === 'READY'
                ? 'bg-emerald-100 text-emerald-800 border-emerald-600'
                : metrics?.status === 'GOOD'
                ? 'bg-[#fca55d]/20 text-amber-900 border-[#fca55d]'
                : 'bg-red-100 text-red-800 border-red-600'
            }`}
          >
            {metrics?.statusLabel || 'ANALIZA JAKOŚCI'}
          </div>

          <p className="text-[11px] sm:text-xs font-bold text-center text-blue-900/70 mt-1">
            Wskaźniki widoczności w kadrze
          </p>
        </div>

        <div className="flex-1 min-h-0 flex items-stretch justify-around w-full my-3 px-1">
          {items.map((item, idx) => (
            <div key={idx} className="flex-1 flex flex-col items-center h-full min-h-0 px-0.5">
              <span className="flex-shrink-0 text-xs sm:text-sm font-black font-mono text-blue-900 mb-1.5">
                {Math.round(item.value)}%
              </span>

              <div className="flex-1 min-h-0 w-full flex items-center justify-center">
                <ProgressBar
                  orientation="vertical"
                  value={item.value}
                  size="lg"
                  color={item.color}
                  className="h-full"
                />
              </div>

              <span
                className="flex-shrink-0 text-[10px] sm:text-[11px] font-black text-blue-900 text-center tracking-tight leading-tight mt-1.5 max-w-[64px] truncate"
                title={item.fullLabel}
              >
                {item.label}
              </span>
            </div>
          ))}
        </div>

        <div className="flex-shrink-0 bg-slate-50 border border-blue-900/20 rounded-xl p-2 text-center text-[10px] sm:text-[11px] font-semibold text-blue-950/80 leading-snug">
          {metrics?.status === 'READY' &&
            'Wszystkie punkty są stabilnie widoczne. Nagranie gotowe do przesłania.'}
          {metrics?.status === 'GOOD' &&
            'Dobra widoczność punktów. Możesz zatwierdzić lub poprawić kadr.'}
          {metrics?.status === 'NEEDS_IMPROVEMENT' &&
            'Punkty uciekają poza kadr. Zalecane ponowne nagranie w pełniejszym kadrze.'}
        </div>
      </Card>
    </div>
  );
}
