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

  const [selectedSentence, setSelectedSentence] = useState<string>(SENTENCES[0]);
  const selectedSentenceIdx = SENTENCES.indexOf(selectedSentence);

  const [status, setStatus] = useState<RecordingStatus>('IDLE');
  const [countdown, setCountdown] = useState<number>(3);
  const [recordedVideoUrl, setRecordedVideoUrl] = useState<string | null>(null);

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
    return () => {
      document.body.style.overflow = "auto";
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
      videoRef.current.controls = true;
      videoRef.current.muted = false;
      videoRef.current.loop = true;
      videoRef.current.play().catch(() => {});
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

  return (
    <div 
      className={`w-full max-w-7xl h-[calc(100dvh-5rem)] max-h-[calc(100dvh-5rem)] flex flex-col md:flex-row items-center justify-center z-10 transition-all duration-500 ease-in-out ${
        isExpanded ? 'gap-0' : 'gap-8 lg:gap-12'
      }`}
    >
      <div 
        className={`transition-all duration-500 ease-in-out flex-shrink-0 ${
          isExpanded 
            ? 'w-0 max-w-0 opacity-0 -translate-x-16 pointer-events-none m-0 overflow-hidden p-0' 
            : 'w-full max-w-sm lg:max-w-md opacity-100 translate-x-0 pb-3 pr-3 overflow-visible'
        }`}
      >
        <Card variant="flat">
          <div className="w-[300px] sm:w-[340px] lg:w-[380px] flex flex-col gap-5">
            <h2 className="text-2xl lg:text-3xl font-black text-center tracking-tight text-blue-900">
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

      <div className="flex-1 min-h-0 h-full max-h-full flex flex-col items-center justify-center w-full transition-all duration-500 ease-in-out overflow-hidden">
        
        <Card variant="default"
          className={`w-full transition-all duration-500 ease-in-out overflow-hidden flex-shrink-0 ${
            isExpanded 
              ? 'max-h-24 opacity-100 mb-3 max-w-4xl lg:max-w-5xl' 
              : 'max-h-0 opacity-0 mb-0 pointer-events-none'
          }`}
        >
          <p className="text-base sm:text-lg md:text-xl text-center font-black tracking-tight">
            „{selectedSentence}”
          </p>
          <p className="text-base sm:text-lg md:text-xl text-center font-black tracking-tight text-blue-900/70">
            „{GLOSSES[selectedSentenceIdx]}”
          </p>
        </Card>

        <div 
          className={`relative aspect-video bg-black rounded-2xl overflow-hidden border-4 border-blue-900 shadow-[8px_8px_0px_0px_rgba(30,58,138,0.15)] transition-all duration-500 ease-in-out flex-shrink ${
            isExpanded 
              ? 'max-h-[60vh] max-w-5xl w-full' 
              : 'max-h-[46vh] max-w-xl w-full'
          }`}
        >
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            muted={status !== 'ANNOTATING'} 
            className="w-full h-full object-cover"
          />

          {status === 'IDLE' && (
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[1px] flex flex-col items-center justify-center text-white p-4 transition-opacity duration-300">
              <p className="text-lg lg:text-xl font-bold mb-1">Kamera gotowa</p>
              <p className="text-xs lg:text-sm text-slate-300">Kliknij przycisk poniżej, aby rozpocząć nagrywanie</p>
            </div>
          )}

          {status === 'COUNTDOWN' && (
            <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-[2px] flex flex-col items-center justify-center text-white z-20">
              <div 
                key={countdown} 
                className="w-28 h-28 md:w-36 md:h-36 rounded-full bg-blue-900 border-4 border-[#fca55d] shadow-[0px_0px_30px_rgba(252,165,93,0.5)] flex items-center justify-center animate-pulse"
              >
                <span className="text-6xl md:text-8xl font-black text-white">
                  {countdown}
                </span>
              </div>
              <p className="text-xs md:text-sm font-extrabold text-blue-100 uppercase tracking-widest mt-4 bg-blue-950/80 px-4 py-1.5 rounded-full border border-blue-800">
                Przygotuj się do nagrania...
              </p>
            </div>
          )}

          {status === 'RECORDING' && (
            <div className="absolute top-3 left-3 bg-red-600 text-white text-xs font-black px-2.5 py-1 rounded-md flex items-center gap-1.5 animate-pulse shadow-md">
              <span className="w-2.5 h-2.5 rounded-full bg-white"></span>
              <span>REC</span>
            </div>
          )}

          {status === 'ANNOTATING' && (
            <div className="absolute top-3 left-3 bg-blue-900 text-white text-xs font-black px-2.5 py-1 rounded-md flex items-center gap-1.5 shadow-md border border-blue-700 pointer-events-none">
              <span>PODGLĄD NAGRANIA</span>
            </div>
          )}
        </div>

        <div className="flex-shrink-0 mt-4">
          {status === 'IDLE' && (
            <Button
              variant="primary"
              size="lg"
              onClick={handleStartRecording}
            >
              Rozpocznij nagrywanie
            </Button>
          )}

          {status === 'COUNTDOWN' && (
            <Button
              variant="outline"
              size="lg"
              onClick={handleReset}
            >
              Anuluj odliczanie
            </Button>
          )}

          {status === 'RECORDING' && (
            <Button
              variant="secondary"
              size="lg"
              onClick={handleStopRecording}
              className="!bg-red-600 !border-red-900 !text-white hover:!bg-red-700 shadow-[4px_4px_0px_0px_rgba(127,29,29,1)]"
            >
              Zakończ nagrywanie
            </Button>
          )}

          {status === 'ANNOTATING' && (
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="bg-blue-50 border-2 border-blue-900/20 text-blue-900 text-xs md:text-sm font-bold px-4 py-2.5 rounded-xl">
                Nagranie gotowe do anotacji
              </div>
              <Button
                variant="secondary"
                size="md"
                onClick={handleReset}
              >
                Nagraj ponownie
              </Button>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
