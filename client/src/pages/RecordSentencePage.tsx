import { useEffect, useRef, useState, useCallback } from "react";
import { Button, Card } from "../components/ui";
import {
  extractVideoKeypoints,
  drawSkeletonOverlay,
  normalizeKeypointsSequence,
  type FrameKeypoints,
  type ExtractionProgress
} from "../services/mediapipe";
import {
  SENTENCES,
  SENTENCE_GLOSS_LIST,
  GLOSSES
} from "../constants/sentences";
import {
  SentenceSelectorCard,
  SentenceBanner
} from "../components/record/SentenceSelectorCard";
import {
  VideoViewport,
  type RecordingStatus
} from "../components/record/VideoViewport";
import { TimelineScrubber } from "../components/record/TimelineScrubber";
import { useCameraRecorder } from "../hooks/useCameraRecorder";
import { useVideoSync } from "../hooks/useVideoSync";

export default function RecordSentencePage() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const skeletonCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const abortSignalRef = useRef<{ aborted: boolean }>({ aborted: false });
  const extractedKeypointsRef = useRef<FrameKeypoints[] | null>(null);
  const rawKeypointsRef = useRef<FrameKeypoints[] | null>(null);
  const showSkeletonRef = useRef<boolean>(true);
  const trimStartRef = useRef<number>(0);
  const trimEndRef = useRef<number>(0);

  const [selectedSentence, setSelectedSentence] = useState<string>(SENTENCES[0]);
  const selectedSentenceIdx = SENTENCES.indexOf(selectedSentence);
  const currentGlosses = SENTENCE_GLOSS_LIST[selectedSentenceIdx] || [];

  const [status, setStatus] = useState<RecordingStatus>('IDLE');
  const [countdown, setCountdown] = useState<number>(3);

  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [trimStart, setTrimStart] = useState<number>(0);
  const [trimEnd, setTrimEnd] = useState<number>(0);
  const [glossMarkers, setGlossMarkers] = useState<number[]>([]);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isScrubbing, setIsScrubbing] = useState<boolean>(false);
  const [showJsonPreview, setShowJsonPreview] = useState<boolean>(false);

  const [extractedKeypoints, setExtractedKeypoints] = useState<FrameKeypoints[] | null>(null);
  const [rawKeypoints, setRawKeypoints] = useState<FrameKeypoints[] | null>(null);
  const [isExtracting, setIsExtracting] = useState<boolean>(false);
  const [extractionProgress, setExtractionProgress] = useState<ExtractionProgress | null>(null);
  const [showSkeleton, setShowSkeleton] = useState<boolean>(true);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);

  const isExpanded = status !== 'IDLE';

  const handleRecordingComplete = useCallback(() => {
    setExtractedKeypoints(null);
    setRawKeypoints(null);
    rawKeypointsRef.current = null;
    setIsVerifying(false);
    setIsSubmitted(false);
    setStatus('ANNOTATING');
  }, []);

  const {
    recordedVideoUrl,
    startRecording,
    stopRecording,
    resetRecording
  } = useCameraRecorder({
    videoRef,
    onRecordingComplete: handleRecordingComplete
  });

  useEffect(() => {
    if (status !== 'COUNTDOWN') return;

    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      const timer = setTimeout(() => {
        setStatus('RECORDING');
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [status, countdown]);

  useEffect(() => {
    if (status === 'RECORDING') {
      startRecording();
    }
  }, [status, startRecording]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    const footer = document.querySelector("footer");
    if (footer) footer.style.display = "none";

    return () => {
      document.body.style.overflow = "auto";
      if (footer) footer.style.display = "";
    };
  }, []);

  useEffect(() => {
    if (status === 'ANNOTATING' && recordedVideoUrl && videoRef.current) {
      videoRef.current.srcObject = null;
      videoRef.current.src = recordedVideoUrl;
      videoRef.current.controls = false;
      videoRef.current.muted = false;
      videoRef.current.loop = false;
      videoRef.current.load();
    }
  }, [status, recordedVideoUrl]);

  useEffect(() => {
    extractedKeypointsRef.current = extractedKeypoints;
  }, [extractedKeypoints]);

  useEffect(() => {
    rawKeypointsRef.current = rawKeypoints;
  }, [rawKeypoints]);

  useEffect(() => {
    showSkeletonRef.current = showSkeleton;
  }, [showSkeleton]);

  useEffect(() => {
    trimStartRef.current = trimStart;
  }, [trimStart]);

  useEffect(() => {
    trimEndRef.current = trimEnd;
  }, [trimEnd]);

  const updateSkeletonCanvas = useCallback((time: number) => {
    const canvas = skeletonCanvasRef.current;
    if (!canvas) return;

    const keypoints = rawKeypointsRef.current || extractedKeypointsRef.current;
    const show = showSkeletonRef.current;
    const tStart = trimStartRef.current;
    const tEnd = trimEndRef.current;

    if (!show || !keypoints || keypoints.length === 0) {
      drawSkeletonOverlay(canvas, null);
      return;
    }

    if (time < tStart || (tEnd > 0 && time > tEnd)) {
      drawSkeletonOverlay(canvas, null);
      return;
    }

    const frameIdx = Math.round(Math.max(0, time - tStart) * 30);
    if (frameIdx >= 0 && frameIdx < keypoints.length) {
      drawSkeletonOverlay(canvas, keypoints[frameIdx]);
    } else {
      drawSkeletonOverlay(canvas, null);
    }
  }, []);

  const handleTimeUpdateFromSync = useCallback((time: number) => {
    setCurrentTime(time);
    updateSkeletonCanvas(time);
  }, [updateSkeletonCanvas]);

  useVideoSync({
    videoRef,
    isPlaying,
    isEnabled: status === 'ANNOTATING',
    trimStart,
    trimEnd,
    isScrubbing,
    onTimeUpdate: handleTimeUpdateFromSync
  });

  const handleStartRecordingClick = () => {
    setCountdown(3);
    setStatus('COUNTDOWN');
  };

  const handleStopRecordingClick = () => {
    stopRecording();
  };

  const handleReset = () => {
    abortSignalRef.current.aborted = true;
    resetRecording();
    setIsExtracting(false);
    setExtractionProgress(null);
    setExtractedKeypoints(null);
    setRawKeypoints(null);
    rawKeypointsRef.current = null;
    setIsVerifying(false);
    setIsSubmitted(false);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setTrimStart(0);
    setTrimEnd(0);
    setGlossMarkers([]);
    setIsScrubbing(false);
    setShowJsonPreview(false);

    if (skeletonCanvasRef.current) {
      drawSkeletonOverlay(skeletonCanvasRef.current, null);
    }

    setStatus('IDLE');
    setCountdown(3);
  };

  const togglePlayPause = () => {
    if (!videoRef.current || isExtracting) return;
    if (videoRef.current.paused) {
      videoRef.current.play().catch(() => {});
    } else {
      videoRef.current.pause();
    }
  };

  const handleTrimStartChange = (newStart: number) => {
    setTrimStart(newStart);
    if (videoRef.current) {
      videoRef.current.currentTime = newStart;
    }
    setCurrentTime(newStart);
    setExtractedKeypoints(null);
    setRawKeypoints(null);
    rawKeypointsRef.current = null;
    setIsVerifying(false);
    setIsSubmitted(false);
    updateSkeletonCanvas(newStart);
  };

  const handleTrimEndChange = (newEnd: number) => {
    setTrimEnd(newEnd);
    if (videoRef.current) {
      videoRef.current.currentTime = newEnd;
    }
    setCurrentTime(newEnd);
    setExtractedKeypoints(null);
    setRawKeypoints(null);
    rawKeypointsRef.current = null;
    setIsVerifying(false);
    setIsSubmitted(false);
    updateSkeletonCanvas(newEnd);
  };

  const handlePlayheadChange = (newTime: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = newTime;
    }
    setCurrentTime(newTime);
    updateSkeletonCanvas(newTime);
  };

  const handleMarkerChange = (idx: number, newMarkerTime: number) => {
    setGlossMarkers((prev) => {
      const next = [...prev];
      next[idx] = newMarkerTime;
      return next;
    });
    if (videoRef.current) {
      videoRef.current.currentTime = newMarkerTime;
    }
    setCurrentTime(newMarkerTime);
    updateSkeletonCanvas(newMarkerTime);
  };

  const handleStartExtraction = async () => {
    if (!videoRef.current || isExtracting) return;

    if (!videoRef.current.paused) {
      videoRef.current.pause();
      setIsPlaying(false);
    }

    if (skeletonCanvasRef.current) {
      skeletonCanvasRef.current.width = videoRef.current.videoWidth || 1080;
      skeletonCanvasRef.current.height = videoRef.current.videoHeight || 1080;
    }

    abortSignalRef.current = { aborted: false };
    setIsExtracting(true);

    try {
      const keypoints = await extractVideoKeypoints(
        videoRef.current,
        trimStart,
        trimEnd,
        (progress) => {
          setExtractionProgress(progress);
        },
        abortSignalRef.current,
        (frame) => {
          if (skeletonCanvasRef.current && showSkeleton) {
            drawSkeletonOverlay(skeletonCanvasRef.current, frame);
          }
        }
      );

      if (!abortSignalRef.current.aborted) {
        const { normalized } = normalizeKeypointsSequence(keypoints);
        setRawKeypoints(keypoints);
        rawKeypointsRef.current = keypoints;
        setExtractedKeypoints(normalized);
        setIsVerifying(true);
        setIsSubmitted(false);

        if (videoRef.current) {
          videoRef.current.currentTime = trimStart;
          setCurrentTime(trimStart);
          videoRef.current.play().catch(() => {});
        }
        if (skeletonCanvasRef.current && keypoints.length > 0 && showSkeleton) {
          drawSkeletonOverlay(skeletonCanvasRef.current, keypoints[0]);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsExtracting(false);
      setExtractionProgress(null);
    }
  };

  const handleAcceptAndSend = () => {
    setIsSubmitted(true);
  };

  const handleEditAnnotation = () => {
    if (videoRef.current && !videoRef.current.paused) {
      videoRef.current.pause();
      setIsPlaying(false);
    }
    setIsVerifying(false);
    setIsSubmitted(false);
  };

  const handleCancelExtraction = () => {
    abortSignalRef.current.aborted = true;
    setIsExtracting(false);
    setExtractionProgress(null);
  };

  const calculatedAnnotations = currentGlosses.map((gloss, idx) => {
    const endTime = idx < glossMarkers.length ? glossMarkers[idx] : trimEnd;
    const frame = Math.round(Math.max(0, endTime - trimStart) * 30);
    return [gloss, frame] as [string, number];
  });
  const eorFrame = Math.round(Math.max(0, trimEnd - trimStart) * 30);
  const finalAnnotationList = [...calculatedAnnotations, ["EoR", eorFrame] as [string, number]];

  const finalJsonOutput = {
    recorded_correctly: true,
    sentence: selectedSentence,
    fps: 30,
    glosses: finalAnnotationList,
    keypoints: extractedKeypoints || [],
    keypoints_raw: rawKeypoints || []
  };

  const handleDownloadJson = () => {
    const jsonStr = JSON.stringify(finalJsonOutput, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const sentenceId = selectedSentenceIdx + 1;
    a.href = url;
    a.download = `pjm_sentence_${sentenceId}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  void handleDownloadJson;

  const formatTime = (timeInSeconds: number) => {
    const mins = Math.floor(timeInSeconds / 60);
    const secs = Math.floor(timeInSeconds % 60);
    const tenths = Math.floor((timeInSeconds % 1) * 10);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${tenths}`;
  };

  return (
    <div
      className={`w-full max-w-5xl flex flex-col md:flex-row items-center justify-center z-10 transition-all duration-500 ease-in-out -mt-4 md:-mt-8 ${
        isExpanded ? 'gap-0' : 'gap-6 lg:gap-8'
      }`}
    >
      <SentenceSelectorCard
        selectedSentence={selectedSentence}
        onSentenceChange={(sentence) => setSelectedSentence(sentence)}
        isExpanded={isExpanded}
      />

      <div className="flex-1 min-h-0 flex flex-col items-center justify-start w-full transition-all duration-500 ease-in-out">
        <SentenceBanner
          selectedSentence={selectedSentence}
          glossesText={GLOSSES[selectedSentenceIdx]}
          isExpanded={isExpanded}
        />

        <VideoViewport
          videoRef={videoRef}
          skeletonCanvasRef={skeletonCanvasRef}
          status={status}
          countdown={countdown}
          isExpanded={isExpanded}
          showSkeleton={showSkeleton}
          isVerifying={isVerifying}
          isSubmitted={isSubmitted}
          isExtracting={isExtracting}
          extractionProgress={extractionProgress}
          onCancelExtraction={handleCancelExtraction}
          onTimeUpdate={() => {
            if (!isScrubbing && videoRef.current && !isExtracting && !isPlaying) {
              const curr = videoRef.current.currentTime;
              if (trimEnd > 0 && curr >= trimEnd) {
                videoRef.current.currentTime = trimStart;
                setCurrentTime(trimStart);
                updateSkeletonCanvas(trimStart);
              } else {
                setCurrentTime(curr);
                updateSkeletonCanvas(curr);
              }
            }
          }}
          onLoadedMetadata={() => {
            if (videoRef.current) {
              const dur = videoRef.current.duration || 0;
              setDuration(dur);
              setTrimStart(0);
              setTrimEnd(dur);
              setCurrentTime(0);

              if (skeletonCanvasRef.current) {
                skeletonCanvasRef.current.width = videoRef.current.videoWidth || 1080;
                skeletonCanvasRef.current.height = videoRef.current.videoHeight || 1080;
              }

              const numGlosses = currentGlosses.length;
              if (numGlosses > 1 && dur > 0) {
                const initialMarkers: number[] = [];
                for (let i = 1; i < numGlosses; i++) {
                  initialMarkers.push((i / numGlosses) * dur);
                }
                setGlossMarkers(initialMarkers);
              } else {
                setGlossMarkers([]);
              }
            }
          }}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onEnded={() => setIsPlaying(false)}
        />

        <div className="flex-shrink-0 mt-2.5 w-full max-w-3xl flex flex-col items-center">
          {status === 'IDLE' && (
            <Button
              variant="primary"
              size="md"
              onClick={handleStartRecordingClick}
            >
              Rozpocznij nagrywanie
            </Button>
          )}

          {status === 'COUNTDOWN' && (
            <Button
              variant="outline"
              size="md"
              onClick={handleReset}
            >
              Anuluj odliczanie
            </Button>
          )}

          {status === 'RECORDING' && (
            <Button
              variant="secondary"
              size="md"
              onClick={handleStopRecordingClick}
              className="!bg-red-600 !border-red-900 !text-white hover:!bg-red-700 shadow-[4px_4px_0px_0px_rgba(127,29,29,1)]"
            >
              Zakończ nagrywanie
            </Button>
          )}

          {status === 'ANNOTATING' && (
            <Card variant="flat" noPadding className="w-full p-2.5 flex flex-col gap-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={togglePlayPause}
                    disabled={isExtracting}
                  >
                    {isPlaying ? "Pauza" : "Odtwórz"}
                  </Button>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-black font-mono text-blue-900">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </span>

                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleReset}
                    disabled={isExtracting}
                  >
                    Nagraj ponownie
                  </Button>

                  {!isVerifying ? (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleStartExtraction}
                      disabled={isExtracting}
                    >
                      {isExtracting ? "Przetwarzanie..." : "Gotowe"}
                    </Button>
                  ) : (
                    <>
                      {/* <Button
                        variant="primary"
                        size="sm"
                        onClick={handleDownloadJson}
                        className="!bg-emerald-600 !border-emerald-900 hover:!bg-emerald-700 shadow-[3px_3px_0px_0px_rgba(6,78,59,1)]"
                      >
                        Pobierz JSON
                      </Button> */}

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const nextState = !showSkeleton;
                          setShowSkeleton(nextState);
                          if (!nextState && skeletonCanvasRef.current) {
                            drawSkeletonOverlay(skeletonCanvasRef.current, null);
                          } else {
                            updateSkeletonCanvas(currentTime);
                          }
                        }}
                      >
                        {showSkeleton ? "Szkielet: WŁ" : "Szkielet: WYŁ"}
                      </Button>

                      <Button
                        variant="primary"
                        size="sm"
                        onClick={handleAcceptAndSend}
                        disabled={isExtracting || isSubmitted}
                        className={isSubmitted ? "!bg-emerald-600 !border-emerald-900 !text-white" : ""}
                      >
                        {isSubmitted ? "Zatwierdzono do wysyłki" : "Akceptuj i wyślij"}
                      </Button>


                      {/* <Button
                        variant="outline"
                        size="sm"
                        onClick={handleEditAnnotation}
                        disabled={isExtracting}
                      >
                        Popraw anotację
                      </Button> */}
                    </>
                  )}

                  {/* <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowJsonPreview((prev) => !prev)}
                  >
                    {showJsonPreview ? "Ukryj JSON" : "Podgląd JSON"}
                  </Button> */}
                </div>
              </div>

              <TimelineScrubber
                currentGlosses={currentGlosses}
                duration={duration}
                currentTime={currentTime}
                trimStart={trimStart}
                trimEnd={trimEnd}
                glossMarkers={glossMarkers}
                disabled={isExtracting}
                onTrimStartChange={handleTrimStartChange}
                onTrimEndChange={handleTrimEndChange}
                onPlayheadChange={handlePlayheadChange}
                onMarkerChange={handleMarkerChange}
                onScrubbingChange={setIsScrubbing}
              />

              {showJsonPreview && (
                <div className="bg-slate-900 text-emerald-400 p-2.5 rounded-xl font-mono text-[11px] overflow-x-auto max-h-36">
                  <pre>
                    {JSON.stringify(
                      {
                        recorded_correctly: finalJsonOutput.recorded_correctly,
                        sentence: finalJsonOutput.sentence,
                        fps: finalJsonOutput.fps,
                        glosses: finalJsonOutput.glosses,
                        keypoints_frames_count: finalJsonOutput.keypoints.length,
                        keypoints_sample_first_frame: finalJsonOutput.keypoints[0] || null
                      },
                      null,
                      2
                    )}
                  </pre>
                </div>
              )}
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
