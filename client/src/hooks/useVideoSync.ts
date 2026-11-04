import { useEffect, useRef } from "react";

interface UseVideoSyncProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  isPlaying: boolean;
  isEnabled: boolean;
  trimStart: number;
  trimEnd: number;
  isScrubbing: boolean;
  onTimeUpdate: (time: number) => void;
}

export function useVideoSync({
  videoRef,
  isPlaying,
  isEnabled,
  trimStart,
  trimEnd,
  isScrubbing,
  onTimeUpdate
}: UseVideoSyncProps) {
  const trimStartRef = useRef(trimStart);
  const trimEndRef = useRef(trimEnd);
  const isScrubbingRef = useRef(isScrubbing);
  const onTimeUpdateRef = useRef(onTimeUpdate);

  useEffect(() => {
    trimStartRef.current = trimStart;
  }, [trimStart]);

  useEffect(() => {
    trimEndRef.current = trimEnd;
  }, [trimEnd]);

  useEffect(() => {
    isScrubbingRef.current = isScrubbing;
  }, [isScrubbing]);

  useEffect(() => {
    onTimeUpdateRef.current = onTimeUpdate;
  }, [onTimeUpdate]);

  useEffect(() => {
    if (!isEnabled || !videoRef.current || !isPlaying) return;

    const videoEl = videoRef.current;
    let animId: number | null = null;
    let rfcId: number | null = null;
    let active = true;

    const syncLoop = () => {
      if (!active) return;

      if (!videoEl.paused && !videoEl.ended) {
        const curr = videoEl.currentTime;
        const tStart = trimStartRef.current;
        const tEnd = trimEndRef.current;

        if (tEnd > 0 && curr >= tEnd) {
          videoEl.currentTime = tStart;
          if (!isScrubbingRef.current) {
            onTimeUpdateRef.current(tStart);
          }
        } else {
          if (!isScrubbingRef.current) {
            onTimeUpdateRef.current(curr);
          }
        }
      }

      if ('requestVideoFrameCallback' in videoEl) {
        rfcId = (videoEl as HTMLVideoElement & {
          requestVideoFrameCallback: (cb: (now: number, metadata: { mediaTime: number }) => void) => number;
        }).requestVideoFrameCallback((_now, metadata) => {
          if (!active) return;
          if (!videoEl.paused && !videoEl.ended) {
            const mediaTime = metadata.mediaTime ?? videoEl.currentTime;
            const tStart = trimStartRef.current;
            const tEnd = trimEndRef.current;

            if (tEnd > 0 && mediaTime >= tEnd) {
              videoEl.currentTime = tStart;
              if (!isScrubbingRef.current) {
                onTimeUpdateRef.current(tStart);
              }
            } else {
              if (!isScrubbingRef.current) {
                onTimeUpdateRef.current(mediaTime);
              }
            }
          }
          syncLoop();
        });
      } else {
        animId = requestAnimationFrame(syncLoop);
      }
    };

    syncLoop();

    return () => {
      active = false;
      if (rfcId !== null && 'cancelVideoFrameCallback' in videoEl) {
        (videoEl as HTMLVideoElement & {
          cancelVideoFrameCallback: (id: number) => void;
        }).cancelVideoFrameCallback(rfcId);
      }
      if (animId !== null) {
        cancelAnimationFrame(animId);
      }
    };
  }, [isEnabled, isPlaying, videoRef]);
}
