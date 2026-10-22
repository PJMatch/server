import { useEffect, useRef, useState } from "react";

const SENTENCES = [
  "Nie rozumiem, co ty mówisz.",
  "Ta nowa szkoła zawsze uczy, dlaczego czas to pieniądz.",
  "Dzień dobry, jak się dzisiaj czujesz?",
  "Gdzie jest najbliższy przystanek autobusowy?",
  "Dziękuję za pomoc i miłe spotkanie."
];

export default function RecordSentencePage() {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const [selectedSentence, setSelectedSentence] = useState<string>(SENTENCES[0]);
  const [isRecording, setIsRecording] = useState<boolean>(false);

  useEffect(() => {
    let stream: MediaStream | null = null;

    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: "user",
          },
          audio: false,
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Błąd dostępu do kamery:", err);
      }
    };

    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  const toggleRecording = () => {
    setIsRecording((prev) => !prev);
  };

  return (
    <div 
      className={`w-full max-w-7xl h-[calc(100dvh-5rem)] max-h-[calc(100dvh-5rem)] flex flex-col md:flex-row items-center justify-center z-10 transition-all duration-500 ease-in-out overflow-hidden ${
        isRecording ? 'gap-0' : 'gap-8 lg:gap-12'
      }`}
    >
      {/* Left Column: Sentence choosing */}
      <div 
        className={`transition-all duration-500 ease-in-out overflow-hidden flex-shrink-0 bg-white rounded-2xl ${
          isRecording 
            ? 'w-0 max-w-0 opacity-0 -translate-x-16 pointer-events-none p-0 border-0 shadow-none m-0' 
            : 'w-full max-w-sm lg:max-w-md opacity-100 translate-x-0 p-6 lg:p-8 border-4 border-blue-900 shadow-[8px_8px_0px_0px_rgba(30,58,138,1)]'
        }`}
      >
        <div className="w-[300px] sm:w-[340px] lg:w-[380px]">
          <h2 className="text-2xl lg:text-3xl font-extrabold mb-6 text-center tracking-tight text-blue-900">
            Wybierz zdanie
          </h2>
          
          <select
            value={selectedSentence}
            onChange={(e) => setSelectedSentence(e.target.value)}
            disabled={isRecording}
            className="w-full border-2 border-blue-900 rounded-xl p-3 font-medium bg-slate-50 focus:outline-none focus:ring-4 focus:ring-blue-900/20 mb-5 cursor-pointer disabled:opacity-50 text-sm lg:text-base"
          >
            {SENTENCES.map((sentence, index) => (
              <option key={index} value={sentence}>
                {index + 1}. {sentence}
              </option>
            ))}
          </select>

        </div>
      </div>

      {/* Right column: camera */}
      <div className="flex-1 min-h-0 h-full max-h-full flex flex-col items-center justify-center w-full transition-all duration-500 ease-in-out overflow-hidden">
        
        {/* display chosen sentence when recording */}
        <div 
          className={`w-full transition-all duration-500 ease-in-out overflow-hidden flex-shrink-0 ${
            isRecording 
              ? 'max-h-20 opacity-100 mb-3 max-w-4xl lg:max-w-5xl' 
              : 'max-h-0 opacity-0 mb-0 pointer-events-none'
          }`}
        >
          <div className="bg-blue-900 text-white py-2.5 px-6 rounded-2xl text-center shadow-[4px_4px_0px_0px_rgba(30,58,138,0.2)] border-2 border-blue-800">
            <span className="text-xs uppercase font-extrabold tracking-wider text-blue-200 block">
              Wybrane zdanie:
            </span>
            <p className="text-base sm:text-lg md:text-xl font-black tracking-tight">
              „{selectedSentence}”
            </p>
          </div>
        </div>

        <div 
          className={`relative aspect-video bg-black rounded-2xl overflow-hidden border-4 border-blue-900 shadow-[8px_8px_0px_0px_rgba(30,58,138,0.15)] transition-all duration-500 ease-in-out flex-shrink ${
            isRecording 
              ? 'max-h-[60vh] max-w-5xl w-full' 
              : 'max-h-[46vh] max-w-xl w-full'
          }`}
        >
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            muted 
            className="w-full h-full object-cover"
          />

          {/* translucent overlay */}
          {!isRecording && (
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[1px] flex flex-col items-center justify-center text-white p-4 transition-opacity duration-300">
              <p className="text-lg lg:text-xl font-bold mb-1">Kamera gotowa</p>
              <p className="text-xs lg:text-sm text-slate-300">Kliknij przycisk poniżej, aby rozpocząć nagrywanie</p>
            </div>
          )}

          {/* REC symbol when recording */}
          {isRecording && (
            <div className="absolute top-3 left-3 bg-red-600 text-white text-xs font-black px-2.5 py-1 rounded-md flex items-center gap-1.5 animate-pulse shadow-md">
              <span className="w-2.5 h-2.5 rounded-full bg-white"></span>
              <span>REC</span>
            </div>
          )}
        </div>

        {/* start / stop button */}
        <div className="flex-shrink-0 mt-4">
          <button 
            type="button" 
            onClick={toggleRecording}
            className={`font-bold py-3 px-8 rounded-xl transition-all duration-300 text-base md:text-lg cursor-pointer shadow-[4px_4px_0px_0px_rgba(30,58,138,0.2)] ${
              isRecording 
                ? 'bg-red-600 hover:bg-red-700 text-white' 
                : 'bg-blue-900 hover:bg-blue-800 text-white'
            }`}
          >
            {isRecording ? "Zakończ nagrywanie" : "Rozpocznij nagrywanie"}
          </button>
        </div>

      </div>

    </div>
  );
}
