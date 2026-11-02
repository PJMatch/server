import { useEffect, useRef, useState } from "react";
import { Button, Select, Card } from "../components/ui";

const SENTENCES = [
  "Nie rozumiem, co ty mówisz.",
  "Dzień dobry, jak się dzisiaj czujesz?",
  "Gdzie jest najbliższy przystanek autobusowy?",
  "Dziękuję za pomoc i miłe spotkanie."
];

const GLOSSES = [
  "JA-NIE-ROZUMIEĆ-TY-MÓWIĆ-CO",
  "DZIEŃ-DOBRY-JAK-TY-CZUJESZ-DZISIAJ",
  "PRZYSTANEK-AUTOBUSOWY-NAJBLIŻSZY-GDZIE",
  "DZIĘKUJĘ-POMOC-SPOTKANIE-MIŁE"
];

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

  const [status, setStatus] = useState<RecordingStatus>('IDLE');
  const [countdown, setCountdown] = useState<number>(3);
  const [recordedVideoUrl, setRecordedVideoUrl] = useState<string | null>(null);

  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);

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

  const handleSeek = (clientX: number) => {
    if (!timelineRef.current || !videoRef.current || duration <= 0) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const newTime = ratio * duration;
    videoRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsDragging(true);
    handleSeek(e.clientX);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    handleSeek(e.clientX);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    setIsDragging(false);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}
  };

  const formatTime = (timeInSeconds: number) => {
    const mins = Math.floor(timeInSeconds / 60);
    const secs = Math.floor(timeInSeconds % 60);
    const tenths = Math.floor((timeInSeconds % 1) * 10);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${tenths}`;
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

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
              ? 'max-h-[42vh] max-w-3xl w-full' 
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
              if (!isDragging && videoRef.current) {
                setCurrentTime(videoRef.current.currentTime);
              }
            }}
            onLoadedMetadata={() => {
              if (videoRef.current) {
                setDuration(videoRef.current.duration || 0);
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

        <div className="flex-shrink-0 mt-3 w-full max-w-3xl flex flex-col items-center">
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
            <Card variant="flat" noPadding className="w-full p-3 flex flex-col gap-2">
              <div className="flex items-center justify-between gap-3">
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

                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleReset}
                >
                  Nagraj ponownie
                </Button>
              </div>

              <div
                ref={timelineRef}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                className="relative w-full h-4 bg-slate-100 border-2 border-blue-900 rounded-lg cursor-pointer touch-none select-none overflow-visible"
              >
                <div
                  className="h-full bg-[#fca55d] rounded-l-md"
                  style={{ width: `${progressPercent}%` }}
                />

                <div
                  className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-5 bg-blue-900 border-2 border-white rounded shadow-md pointer-events-none"
                  style={{ left: `${progressPercent}%` }}
                />
              </div>
            </Card>
          )}
        </div>

      </div>

    </div>
  );
}
