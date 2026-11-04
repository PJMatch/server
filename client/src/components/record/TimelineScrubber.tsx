import { useRef, useState } from "react";

interface TimelineScrubberProps {
  currentGlosses: string[];
  duration: number;
  currentTime: number;
  trimStart: number;
  trimEnd: number;
  glossMarkers: number[];
  disabled: boolean;
  onTrimStartChange: (newStart: number) => void;
  onTrimEndChange: (newEnd: number) => void;
  onPlayheadChange: (newTime: number) => void;
  onMarkerChange: (index: number, newTime: number) => void;
  onScrubbingChange: (isScrubbing: boolean) => void;
}

export function TimelineScrubber({
  currentGlosses,
  duration,
  currentTime,
  trimStart,
  trimEnd,
  glossMarkers,
  disabled,
  onTrimStartChange,
  onTrimEndChange,
  onPlayheadChange,
  onMarkerChange,
  onScrubbingChange
}: TimelineScrubberProps) {
  const [activeHandle, setActiveHandle] = useState<string>('none');
  const timelineRef = useRef<HTMLDivElement | null>(null);

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  const trimStartPercent = duration > 0 ? (trimStart / duration) * 100 : 0;
  const trimEndPercent = duration > 0 ? (trimEnd / duration) * 100 : 100;

  const handleSeek = (clientX: number, handle: string) => {
    if (!timelineRef.current || duration <= 0 || disabled) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const targetTime = ratio * duration;

    if (handle === 'trimStart') {
      const maxAllowed = glossMarkers.length > 0 ? glossMarkers[0] - 0.05 : trimEnd - 0.1;
      const newTrimStart = Math.max(0, Math.min(maxAllowed, targetTime));
      onTrimStartChange(newTrimStart);
    } else if (handle === 'trimEnd') {
      const minAllowed = glossMarkers.length > 0 ? glossMarkers[glossMarkers.length - 1] + 0.05 : trimStart + 0.1;
      const newTrimEnd = Math.max(minAllowed, Math.min(duration, targetTime));
      onTrimEndChange(newTrimEnd);
    } else if (handle === 'playhead') {
      const newTime = Math.max(0, Math.min(duration, targetTime));
      onPlayheadChange(newTime);
    } else if (handle.startsWith('marker-')) {
      const idx = parseInt(handle.replace('marker-', ''), 10);
      const minAllowed = idx === 0 ? trimStart + 0.05 : glossMarkers[idx - 1] + 0.05;
      const maxAllowed = idx === glossMarkers.length - 1 ? trimEnd - 0.05 : glossMarkers[idx + 1] - 0.05;
      const newMarkerTime = Math.max(minAllowed, Math.min(maxAllowed, targetTime));
      onMarkerChange(idx, newMarkerTime);
    }
  };

  return (
    <>
      <div className="relative w-full h-5 overflow-hidden flex text-[10px] font-black text-blue-900">
        {currentGlosses.map((gloss, idx) => {
          const segStart = idx === 0 ? trimStartPercent : (glossMarkers[idx - 1] / duration) * 100;
          const segEnd = idx < glossMarkers.length ? (glossMarkers[idx] / duration) * 100 : trimEndPercent;
          const segWidth = Math.max(0, segEnd - segStart);

          return (
            <div
              key={idx}
              className="absolute top-0 bottom-0 bg-blue-50 border border-blue-900/30 rounded px-0.5 flex items-center justify-center truncate pointer-events-none"
              style={{
                left: `${segStart}%`,
                width: `${segWidth}%`
              }}
              title={gloss}
            >
              {gloss}
            </div>
          );
        })}
      </div>

      <div
        ref={timelineRef}
        onPointerDown={(e) => {
          if (disabled) return;
          timelineRef.current?.setPointerCapture(e.pointerId);
          setActiveHandle('playhead');
          onScrubbingChange(true);
          handleSeek(e.clientX, 'playhead');
        }}
        onPointerMove={(e) => {
          if (activeHandle !== 'none' && !disabled) {
            handleSeek(e.clientX, activeHandle);
          }
        }}
        onPointerUp={(e) => {
          setActiveHandle('none');
          onScrubbingChange(false);
          try {
            e.currentTarget.releasePointerCapture(e.pointerId);
          } catch (_err) {
            void _err;
          }
        }}
        className="relative w-full h-6 bg-slate-200 border-2 border-blue-900 rounded-lg cursor-pointer touch-none select-none overflow-visible"
      >
        <div
          className="absolute top-0 bottom-0 left-0 bg-slate-400/50 border-r-2 border-red-600 rounded-l-md pointer-events-none"
          style={{ width: `${trimStartPercent}%` }}
        />

        <div
          className="absolute top-0 bottom-0 bg-blue-100 pointer-events-none"
          style={{
            left: `${trimStartPercent}%`,
            width: `${Math.max(0, trimEndPercent - trimStartPercent)}%`
          }}
        />

        <div
          className="absolute top-0 bottom-0 right-0 bg-slate-400/50 border-l-2 border-red-600 rounded-r-md pointer-events-none"
          style={{ width: `${Math.max(0, 100 - trimEndPercent)}%` }}
        />

        <div
          className="absolute top-0 bottom-0 bg-[#fca55d]/80 pointer-events-none"
          style={{
            left: `${trimStartPercent}%`,
            width: `${Math.max(0, Math.min(progressPercent, trimEndPercent) - trimStartPercent)}%`
          }}
        />

        {glossMarkers.map((markerTime, idx) => {
          const markerPercent = duration > 0 ? (markerTime / duration) * 100 : 0;
          return (
            <div
              key={idx}
              onPointerDown={(e) => {
                if (disabled) return;
                e.stopPropagation();
                timelineRef.current?.setPointerCapture(e.pointerId);
                setActiveHandle(`marker-${idx}`);
                onScrubbingChange(true);
                handleSeek(e.clientX, `marker-${idx}`);
              }}
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3.5 h-8 bg-blue-900 border-2 border-[#fca55d] rounded cursor-ew-resize z-25 flex items-center justify-center shadow"
              style={{ left: `${markerPercent}%` }}
              title={`Koniec ${currentGlosses[idx]} / Początek ${currentGlosses[idx + 1]}`}
            >
              <div className="w-0.5 h-3 bg-[#fca55d]" />
            </div>
          );
        })}

        <div
          onPointerDown={(e) => {
            if (disabled) return;
            e.stopPropagation();
            timelineRef.current?.setPointerCapture(e.pointerId);
            setActiveHandle('trimStart');
            onScrubbingChange(true);
            handleSeek(e.clientX, 'trimStart');
          }}
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-8 bg-red-600 border-2 border-white rounded cursor-ew-resize z-30 flex items-center justify-center shadow"
          style={{ left: `${trimStartPercent}%` }}
          title="Początek nagrania"
        >
          <div className="w-0.5 h-3 bg-white" />
        </div>

        <div
          onPointerDown={(e) => {
            if (disabled) return;
            e.stopPropagation();
            timelineRef.current?.setPointerCapture(e.pointerId);
            setActiveHandle('trimEnd');
            onScrubbingChange(true);
            handleSeek(e.clientX, 'trimEnd');
          }}
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-8 bg-red-600 border-2 border-white rounded cursor-ew-resize z-30 flex items-center justify-center shadow"
          style={{ left: `${trimEndPercent}%` }}
          title="Koniec nagrania (EoR)"
        >
          <div className="w-0.5 h-3 bg-white" />
        </div>

        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-6 bg-blue-950 border-2 border-white rounded shadow-md pointer-events-none z-40"
          style={{ left: `${progressPercent}%` }}
        />
      </div>
    </>
  );
}
