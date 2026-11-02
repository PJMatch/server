import { useEffect, useRef, useState } from "react";
import { Button, Select, Card } from "../components/ui";

const SENTENCES = [
  "Nie rozumiem, co ty mówisz.",
  "Dzień dobry, jak się dzisiaj czujesz?",
  "Gdzie jest najbliższy przystanek autobusowy?",
  "Dziękuję za pomoc i miłe spotkanie."
];

const SENTENCE_GLOSS_LIST: string[][] = [
  ["JA", "NIE-ROZUMIEM", "TY", "CO", "MÓWIĆ", "CO"],
  ["DZIEŃ-DOBRY", "JAK", "TY", "CZUJESZ", "DZISIAJ"],
  ["PRZYSTANEK", "AUTOBUSOWY", "NAJBLIŻSZY", "GDZIE"],
  ["DZIĘKUJĘ", "POMOC", "SPOTKANIE", "MIŁE"]
];

const GLOSSES = SENTENCE_GLOSS_LIST.map((list) => list.join(" - "));

const SENTENCE_OPTIONS = SENTENCES.map((sentence, index) => ({
  value: sentence,
  label: `${index + 1}. ${sentence}`
}));

export type RecordingStatus = 'IDLE' | 'COUNTDOWN' | 'RECORDING' | 'ANNOTATING';

export default function RecordSentencePage() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timelineRef = useRef<HTMLDivElement | null>(null);

  const [selectedSentence, setSelectedSentence] = useState<string>(SENTENCES[0]);
  const selectedSentenceIdx = SENTENCES.indexOf(selectedSentence);
  const currentGlosses = SENTENCE_GLOSS_LIST[selectedSentenceIdx] || [];

  const [status, setStatus] = useState<RecordingStatus>('IDLE');
  const [countdown, setCountdown] = useState<number>(3);
  const [recordedVideoUrl, setRecordedVideoUrl] = useState<string | null>(null);

  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [trimStart, setTrimStart] = useState<number>(0);
  const [trimEnd, setTrimEnd] = useState<number>(0);
  const [glossMarkers, setGlossMarkers] = useState<number[]>([]);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [activeHandle, setActiveHandle] = useState<string>('none');
  const [showJsonPreview, setShowJsonPreview] = useState<boolean>(false);

  const isExpanded = status !== 'IDLE';

  useEffect(() => {
    if (status !== 'COUNTDOWN') return;

    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      setStatus('RECORDING');
    }
  }, [status, countdown]);

  useEffect(() => {
    let activeStream: MediaStream | null = null;

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: "user",
          },
          audio: false,
        });

        activeStream = stream;
        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error(err);
      }
    };

    startCamera();

    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

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
    if (status !== 'RECORDING') return;
    if (!streamRef.current) return;

    chunksRef.current = [];

    let mimeType = 'video/webm;codecs=vp9';
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      mimeType = 'video/webm;codecs=vp8';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'video/webm';
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = '';
        }
      }
    }

    const options = mimeType ? { mimeType } : undefined;
    const recorder = new MediaRecorder(streamRef.current, options);

    recorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        chunksRef.current.push(event.data);
      }
    };

    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: mimeType || 'video/webm' });
      const url = URL.createObjectURL(blob);
      setRecordedVideoUrl(url);
      setStatus('ANNOTATING');
    };

    recorder.start();
    mediaRecorderRef.current = recorder;
  }, [status]);

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
    return () => {
      if (recordedVideoUrl) {
        URL.revokeObjectURL(recordedVideoUrl);
      }
    };
  }, [recordedVideoUrl]);

  const handleStartRecording = () => {
    setCountdown(3);
    setStatus('COUNTDOWN');
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    } else {
      setStatus('ANNOTATING');
    }
  };

  const handleReset = () => {
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setTrimStart(0);
    setTrimEnd(0);
    setGlossMarkers([]);
    setActiveHandle('none');
    setShowJsonPreview(false);
    if (recordedVideoUrl) {
      URL.revokeObjectURL(recordedVideoUrl);
      setRecordedVideoUrl(null);
    }
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.removeAttribute('src');
      videoRef.current.load();
      videoRef.current.controls = false;
      videoRef.current.muted = true;
      videoRef.current.loop = false;
      if (streamRef.current) {
        videoRef.current.srcObject = streamRef.current;
        videoRef.current.play().catch(() => {});
      }
    }
    setStatus('IDLE');
    setCountdown(3);
  };

  const togglePlayPause = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play().catch(() => {});
    } else {
      videoRef.current.pause();
    }
  };

  const handleSeek = (clientX: number, handle: string) => {
    if (!timelineRef.current || !videoRef.current || duration <= 0) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const targetTime = ratio * duration;

    if (handle === 'trimStart') {
      const maxAllowed = glossMarkers.length > 0 ? glossMarkers[0] - 0.05 : trimEnd - 0.1;
      const newTrimStart = Math.max(0, Math.min(maxAllowed, targetTime));
      setTrimStart(newTrimStart);
      videoRef.current.currentTime = newTrimStart;
      setCurrentTime(newTrimStart);
    } else if (handle === 'trimEnd') {
      const minAllowed = glossMarkers.length > 0 ? glossMarkers[glossMarkers.length - 1] + 0.05 : trimStart + 0.1;
      const newTrimEnd = Math.max(minAllowed, Math.min(duration, targetTime));
      setTrimEnd(newTrimEnd);
      videoRef.current.currentTime = newTrimEnd;
      setCurrentTime(newTrimEnd);
    } else if (handle === 'playhead') {
      const newTime = Math.max(0, Math.min(duration, targetTime));
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    } else if (handle.startsWith('marker-')) {
      const idx = parseInt(handle.replace('marker-', ''), 10);
      const minAllowed = idx === 0 ? trimStart + 0.05 : glossMarkers[idx - 1] + 0.05;
      const maxAllowed = idx === glossMarkers.length - 1 ? trimEnd - 0.05 : glossMarkers[idx + 1] - 0.05;
      const newMarkerTime = Math.max(minAllowed, Math.min(maxAllowed, targetTime));

      setGlossMarkers((prev) => {
        const next = [...prev];
        next[idx] = newMarkerTime;
        return next;
      });

      videoRef.current.currentTime = newMarkerTime;
      setCurrentTime(newMarkerTime);
    }
  };

  const formatTime = (timeInSeconds: number) => {
    const mins = Math.floor(timeInSeconds / 60);
    const secs = Math.floor(timeInSeconds % 60);
    const tenths = Math.floor((timeInSeconds % 1) * 10);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${tenths}`;
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  const trimStartPercent = duration > 0 ? (trimStart / duration) * 100 : 0;
  const trimEndPercent = duration > 0 ? (trimEnd / duration) * 100 : 100;

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
    glosses: finalAnnotationList
  };

  return (
    <div 
      className={`w-full max-w-5xl flex flex-col md:flex-row items-center justify-center z-10 transition-all duration-500 ease-in-out -mt-4 md:-mt-8 ${
        isExpanded ? 'gap-0' : 'gap-6 lg:gap-8'
      }`}
    >
      <div 
        className={`transition-all duration-500 ease-in-out flex-shrink-0 ${
          isExpanded 
            ? 'w-0 max-w-0 opacity-0 -translate-x-16 pointer-events-none m-0 overflow-hidden p-0' 
            : 'w-full max-w-xs sm:max-w-sm opacity-100 translate-x-0 pb-2 pr-2 overflow-visible'
        }`}
      >
        <Card variant="flat" noPadding className="p-4 sm:p-5">
          <div className="w-[260px] sm:w-[300px] flex flex-col gap-3">
            <h2 className="text-xl sm:text-2xl font-black text-center tracking-tight text-blue-900">
              Wybierz zdanie
            </h2>
            
            <Select
              label="Zdanie do zamigania"
              value={selectedSentence}
              onChange={(e) => {
                const sentence = e.target.value;
                setSelectedSentence(sentence);
              }}
              disabled={isExpanded}
              options={SENTENCE_OPTIONS}
            />
          </div>
        </Card>
      </div>

      <div className="flex-1 min-h-0 flex flex-col items-center justify-start w-full transition-all duration-500 ease-in-out">
        
        <Card 
          variant="flat"
          noPadding
          className={`w-full transition-all duration-500 ease-in-out overflow-hidden flex-shrink-0 ${
            isExpanded 
              ? 'max-h-20 opacity-100 mb-2 py-1.5 px-4 max-w-3xl' 
              : 'max-h-0 opacity-0 mb-0 py-0 px-0 pointer-events-none'
          }`}
        >
          <p className="text-sm sm:text-base text-center font-black tracking-tight leading-tight">
            „{selectedSentence}”
          </p>
          <p className="text-xs sm:text-sm text-center font-black tracking-tight text-blue-900/70 mt-0.5">
            „{GLOSSES[selectedSentenceIdx]}”
          </p>
        </Card>

        <div 
          className={`relative aspect-video bg-black rounded-2xl overflow-hidden border-4 border-blue-900 shadow-[8px_8px_0px_0px_rgba(30,58,138,0.15)] transition-all duration-500 ease-in-out flex-shrink ${
            isExpanded 
              ? 'max-h-[38vh] max-w-3xl w-full' 
              : 'max-h-[36vh] max-w-md w-full'
          }`}
        >
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            muted={status !== 'ANNOTATING'} 
            className="w-full h-full object-cover"
            onTimeUpdate={() => {
              if (activeHandle === 'none' && videoRef.current) {
                const curr = videoRef.current.currentTime;
                if (trimEnd > 0 && curr >= trimEnd) {
                  videoRef.current.currentTime = trimStart;
                  setCurrentTime(trimStart);
                } else {
                  setCurrentTime(curr);
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

          {status === 'IDLE' && (
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[1px] flex flex-col items-center justify-center text-white p-3 transition-opacity duration-300">
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
            <div className="absolute top-2.5 left-2.5 bg-red-600 text-white text-xs font-black px-2 py-0.5 rounded-md flex items-center gap-1.5 animate-pulse shadow-md">
              <span className="w-2 h-2 rounded-full bg-white"></span>
              <span>REC</span>
            </div>
          )}

          {status === 'ANNOTATING' && (
            <div className="absolute top-2.5 left-2.5 bg-blue-900 text-white text-xs font-black px-2 py-0.5 rounded-md flex items-center gap-1.5 shadow-md border border-blue-700 pointer-events-none">
              <span>TRYB ANOTACJI</span>
            </div>
          )}
        </div>

        <div className="flex-shrink-0 mt-2.5 w-full max-w-3xl flex flex-col items-center">
          {status === 'IDLE' && (
            <Button
              variant="primary"
              size="md"
              onClick={handleStartRecording}
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
              onClick={handleStopRecording}
              className="!bg-red-600 !border-red-900 !text-white hover:!bg-red-700 shadow-[4px_4px_0px_0px_rgba(127,29,29,1)]"
            >
              Zakończ nagrywanie
            </Button>
          )}

          {status === 'ANNOTATING' && (
            <Card variant="flat" noPadding className="w-full p-2.5 flex flex-col gap-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={togglePlayPause}
                  >
                    {isPlaying ? "Pauza" : "Odtwórz"}
                  </Button>

                  <span className="text-xs font-black font-mono text-blue-900">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowJsonPreview((prev) => !prev)}
                  >
                    {showJsonPreview ? "Ukryj JSON" : "Podgląd JSON"}
                  </Button>

                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleReset}
                  >
                    Nagraj ponownie
                  </Button>
                </div>
              </div>

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
                  timelineRef.current?.setPointerCapture(e.pointerId);
                  setActiveHandle('playhead');
                  handleSeek(e.clientX, 'playhead');
                }}
                onPointerMove={(e) => {
                  if (activeHandle !== 'none') {
                    handleSeek(e.clientX, activeHandle);
                  }
                }}
                onPointerUp={(e) => {
                  setActiveHandle('none');
                  try {
                    e.currentTarget.releasePointerCapture(e.pointerId);
                  } catch {}
                }}
                className="relative w-full h-6 bg-slate-200 border-2 border-blue-900 rounded-lg cursor-pointer touch-none select-none overflow-visible"
              >
                <div
                  className="absolute top-0 bottom-0 left-0 bg-slate-400/50 border-r-2 border-red-600 rounded-l-md pointer-events-none"
                  style={{ width: `${trimStartPercent}%` }}
                />

                <div
                  className="absolute top-0 bottom-0 bg-blue-100 pointer-events-none"
                  style={{ left: `${trimStartPercent}%`, width: `${Math.max(0, trimEndPercent - trimStartPercent)}%` }}
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
                        e.stopPropagation();
                        timelineRef.current?.setPointerCapture(e.pointerId);
                        setActiveHandle(`marker-${idx}`);
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
                    e.stopPropagation();
                    timelineRef.current?.setPointerCapture(e.pointerId);
                    setActiveHandle('trimStart');
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
                    e.stopPropagation();
                    timelineRef.current?.setPointerCapture(e.pointerId);
                    setActiveHandle('trimEnd');
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

              {showJsonPreview && (
                <div className="bg-slate-900 text-emerald-400 p-2.5 rounded-xl font-mono text-[11px] overflow-x-auto max-h-36">
                  <pre>{JSON.stringify(finalJsonOutput, null, 2)}</pre>
                </div>
              )}
            </Card>
          )}
        </div>

      </div>

    </div>
  );
}
