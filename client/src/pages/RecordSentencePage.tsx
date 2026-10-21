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

  const toggleRecording = () => {
    setIsRecording((prev) => !prev);
  };

  return (
    <div className="w-full max-w-7xl flex flex-col md:flex-row gap-12 items-center justify-center z-10">
      {/* Left Column: Login Box */}
      <div className="w-full max-w-md bg-white border-4 border-blue-900 rounded-2xl p-8 shadow-[8px_8px_0px_0px_rgba(30,58,138,1)] flex-shrink-0">
        <h2 className="text-3xl font-extrabold mb-8 text-center tracking-tight text-blue-900">
          Wybierz zdanie
        </h2>
        <select
          value={selectedSentence}
          onChange={(e) => setSelectedSentence(e.target.value)}
          disabled={isRecording}
          className="w-full border-2 border-blue-900 rounded-xl p-3 font-medium bg-slate-50 focus:outline-none focus:ring-4 focus:ring-blue-900/20 mb-6
          cursor-pointer disabled:opacity-50"
        >
          {SENTENCES.map((sentence, index) => (
            <option key={index} value={sentence}>
              {index + 1}. {sentence}
            </option>
          ))}
        </select>
      <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">                                                                           
        <span className="text-xs uppercase text-center font-extrabold text-blue-900 block mb-1">                                                                 Aktualnie migane zdanie:                                                                                                                   
        </span>                                                                                                                                      
        <p className="text-base font-bold text-center text-blue-950 leading-snug">                                                                               
          „{selectedSentence}”                                                                                                                       
        </p>                                                                                                                                         
      </div>     
      </div>

      {/* Right Column: Main Content Area */}
      <div className="flex-1 flex flex-col items-center justify-center max-w-7xl text-center">
        <div className="mb-4 flex flex-col items-center w-full">
          {/* Kontener i element video z autoPlay, playsInline, muted */}
          <div className="relative w-full max-w-2xl aspect-video bg-black rounded-2xl overflow-hidden border-4 border-blue-900 shadow-                  
            [8px_8px_0px_0px_rgba(30,58,138,0.1)] mb-4">
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              muted 
            />
            {/* PÓŁPRZEZROCZYSTA SZARA NAKŁADKA (efekt szarości z kanałem alfa) */}                                                                    
            {!isRecording && (                                                                                                                         
              <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[1px] flex flex-col items-center justify-center text-white p-4">          
                <p className="text-lg font-bold">Kamera gotowa</p>                                                                         
                <p className="text-xs text-slate-300">Kliknij przycisk poniżej, aby rozpocząć nagrywanie</p>                                             
              </div>                                                                                                                                   
            )}   
          </div>

          <button 
            type="button" 
            onClick={toggleRecording}
            className="bg-blue-900 text-white font-bold py-4 px-8 rounded-xl hover:bg-blue-800 transition-colors text-lg cursor-pointer shadow-[4px_4px_0px_0px_rgba(30,58,138,0.2)]"
          >
            {isRecording ? "Zakończ nagrywanie" : "Rozpocznij nagrywanie"}
          </button>
        </div>

      </div>
    </div>
  );
}
