import type { ExtractionProgress } from "../../services/mediapipe";

interface ExtractionProgressOverlayProps {
  progress: ExtractionProgress | null;
  onCancel: () => void;
}

export default function ExtractionProgressOverlay({
  progress,
  onCancel
}: ExtractionProgressOverlayProps) {
  if (!progress) return null;

  return (
    <div className="absolute inset-0 bg-slate-950/75 backdrop-blur-[2px] flex flex-col items-center justify-center text-white p-4 z-30">
      <div className="w-full max-w-sm flex flex-col items-center gap-3 bg-blue-950/90 border-2 border-blue-600 p-4 rounded-xl shadow-xl">
        <p className="text-sm font-black text-blue-100 uppercase tracking-wide">
          {progress.stage === 'loading_models'
            ? "Inicjalizacja modeli MediaPipe..."
            : `Ekstrakcja: klatka ${progress.currentFrame || 0} / ${progress.totalFrames || 0}`}
        </p>

        <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden border border-blue-500">
          <div
            className="h-full bg-[#fca55d] transition-all duration-150 ease-out"
            style={{ width: `${progress.percentage || 0}%` }}
          />
        </div>

        <div className="w-full flex items-center justify-between text-xs text-blue-200 font-bold">
          <span>{progress.percentage || 0}%</span>
          <button
            type="button"
            onClick={onCancel}
            className="text-red-400 hover:text-red-300 underline cursor-pointer"
          >
            Anuluj
          </button>
        </div>
      </div>
    </div>
  );
}
