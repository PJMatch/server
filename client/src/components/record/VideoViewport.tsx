import { type RefObject } from "react";
import type { ExtractionProgress } from "../../services/mediapipe";
import ExtractionProgressOverlay from "./ExtractionProgressOverlay";

export type RecordingStatus = 'IDLE' | 'COUNTDOWN' | 'RECORDING' | 'ANNOTATING';

interface VideoViewportProps {
  videoRef: RefObject<HTMLVideoElement | null>;
  skeletonCanvasRef: RefObject<HTMLCanvasElement | null>;
  status: RecordingStatus;
  countdown: number;
  isExpanded: boolean;
  showSkeleton: boolean;
  isVerifying: boolean;
  isSubmitted: boolean;
  isExtracting: boolean;
  extractionProgress: ExtractionProgress | null;
  onCancelExtraction: () => void;
  onTimeUpdate: () => void;
  onLoadedMetadata: () => void;
  onPlay: () => void;
  onPause: () => void;
  onEnded: () => void;
}

export function VideoViewport({
  videoRef,
  skeletonCanvasRef,
  status,
  countdown,
  isExpanded,
  showSkeleton,
  isVerifying,
  isSubmitted,
  isExtracting,
  extractionProgress,
  onCancelExtraction,
  onTimeUpdate,
  onLoadedMetadata,
  onPlay,
  onPause,
  onEnded
}: VideoViewportProps) {
  return (
    <div
      className={`relative aspect-square bg-black rounded-2xl overflow-hidden border-4 border-blue-900 shadow-[8px_8px_0px_0px_rgba(30,58,138,0.15)] transition-all duration-500 ease-in-out flex-shrink ${
        isExpanded
          ? 'h-[52vh] sm:h-[56vh] md:h-[58vh] max-h-[calc(100vh-250px)]'
          : 'h-[44vh] sm:h-[48vh] md:h-[52vh] max-h-[calc(100vh-220px)]'
      }`}
    >
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={status !== 'ANNOTATING'}
        className={`w-full h-full object-cover ${status !== 'ANNOTATING' ? '-scale-x-100' : ''}`}
        onTimeUpdate={onTimeUpdate}
        onLoadedMetadata={onLoadedMetadata}
        onPlay={onPlay}
        onPause={onPause}
        onEnded={onEnded}
      />

      <canvas
        ref={skeletonCanvasRef}
        className={`absolute inset-0 w-full h-full pointer-events-none z-10 transition-opacity duration-200 ${
          status === 'ANNOTATING' && showSkeleton ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {status === 'IDLE' && (
        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[1px] flex flex-col items-center justify-center text-white p-3 transition-opacity duration-300 z-20">
          <p className="text-base sm:text-lg font-bold mb-0.5">Kamera gotowa</p>
          <p className="text-xs text-slate-300">Kliknij przycisk poniżej, aby rozpocząć nagrywanie</p>
        </div>
      )}

      {status === 'COUNTDOWN' && (
        <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-[2px] flex flex-col items-center justify-center text-white z-20">
          <div
            key={countdown}
            className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-blue-900 border-4 border-[#fca55d] shadow-[0px_0px_25px_rgba(252,165,93,0.5)] flex items-center justify-center animate-pulse"
          >
            <span className="text-5xl sm:text-6xl font-black text-white">
              {countdown}
            </span>
          </div>
          <p className="text-xs font-extrabold text-blue-100 uppercase tracking-widest mt-2 bg-blue-950/80 px-3 py-1 rounded-full border border-blue-800">
            Przygotuj się do nagrania...
          </p>
        </div>
      )}

      {status === 'RECORDING' && (
        <div className="absolute top-2.5 left-2.5 bg-red-600 text-white text-xs font-black px-2 py-0.5 rounded-md flex items-center gap-1.5 animate-pulse shadow-md z-20">
          <span className="w-2 h-2 rounded-full bg-white" />
          <span>REC</span>
        </div>
      )}

      {status === 'ANNOTATING' && (
        <div className="absolute top-2.5 left-2.5 flex items-center gap-2 z-20">
          <div className="bg-blue-900 text-white text-xs font-black px-2 py-0.5 rounded-md flex items-center gap-1.5 shadow-md border border-blue-700 pointer-events-none">
            <span>{isVerifying ? "WERYFIKACJA WYNIKU" : "TRYB ANOTACJI"}</span>
          </div>
          {isSubmitted && (
            <div className="bg-emerald-600 text-white text-xs font-black px-2 py-0.5 rounded-md flex items-center gap-1.5 shadow-md border border-emerald-700 pointer-events-none">
              <span>ZATWIERDZONO</span>
            </div>
          )}
        </div>
      )}

      {isExtracting && (
        <ExtractionProgressOverlay
          progress={extractionProgress}
          onCancel={onCancelExtraction}
        />
      )}
    </div>
  );
}
