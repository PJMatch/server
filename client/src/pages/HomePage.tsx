import { Link } from 'react-router-dom';
import { Button } from '../components/ui';

// ─── Ikony inline ─────────────────────────────────────────────────────────────

function IconCamera() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7">
      <path d="M12 9a3.75 3.75 0 1 0 0 7.5A3.75 3.75 0 0 0 12 9Z" />
      <path fillRule="evenodd" d="M9.344 3.071a49.52 49.52 0 0 1 5.312 0c.967.052 1.83.585 2.332 1.39l.821 1.317c.24.383.645.643 1.11.71.386.054.77.113 1.152.177 1.432.239 2.429 1.493 2.429 2.909V18a3 3 0 0 1-3 3h-15a3 3 0 0 1-3-3V9.574c0-1.416.997-2.67 2.429-2.909.382-.064.766-.123 1.151-.178a1.56 1.56 0 0 0 1.11-.71l.822-1.315a2.942 2.942 0 0 1 2.332-1.39ZM6.75 12.75a5.25 5.25 0 1 1 10.5 0 5.25 5.25 0 0 1-10.5 0Zm12-1.5a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z" clipRule="evenodd" />
    </svg>
  );
}

function IconBrain() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7">
      <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 0 1-.383-.218 25.18 25.18 0 0 1-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0 1 12 5.052 5.5 5.5 0 0 1 16.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 0 1-4.244 3.17 15.247 15.247 0 0 1-.383.219l-.022.012-.007.004-.003.001a.752.752 0 0 1-.704 0l-.003-.001Z" />
    </svg>
  );
}

function IconUpload() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7">
      <path fillRule="evenodd" d="M10.5 3.75a6 6 0 0 0-5.98 6.496A5.25 5.25 0 0 0 6.75 20.25H18a4.5 4.5 0 0 0 2.206-8.423 3.75 3.75 0 0 0-4.133-4.303A6.001 6.001 0 0 0 10.5 3.75Zm2.03 5.47a.75.75 0 0 0-1.06 0l-3 3a.75.75 0 1 0 1.06 1.06l1.72-1.72v4.94a.75.75 0 0 0 1.5 0v-4.94l1.72 1.72a.75.75 0 1 0 1.06-1.06l-3-3Z" clipRule="evenodd" />
    </svg>
  );
}

function IconChartBar() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7">
      <path d="M18.375 2.25c-1.035 0-1.875.84-1.875 1.875v15.75c0 1.035.84 1.875 1.875 1.875h.75c1.035 0 1.875-.84 1.875-1.875V4.125c0-1.036-.84-1.875-1.875-1.875h-.75ZM9.75 8.625c0-1.036.84-1.875 1.875-1.875h.75c1.036 0 1.875.84 1.875 1.875v11.25c0 1.035-.84 1.875-1.875 1.875h-.75a1.875 1.875 0 0 1-1.875-1.875V8.625ZM3 13.125c0-1.036.84-1.875 1.875-1.875h.75c1.036 0 1.875.84 1.875 1.875v6.75c0 1.035-.84 1.875-1.875 1.875h-.75A1.875 1.875 0 0 1 3 19.875v-6.75Z" />
    </svg>
  );
}

// ─── Komponent kroku "Jak to działa" ─────────────────────────────────────────

interface StepProps {
  number: number;
  icon: React.ReactNode;
  title: string;
  description: string;
  accent?: boolean;
}

function Step({ number, icon, title, description, accent = false }: StepProps) {
  return (
    <div className={`relative flex flex-col gap-4 rounded-2xl border-4 border-blue-900 p-7 shadow-[6px_6px_0px_0px_rgba(30,58,138,1)] ${accent ? 'bg-blue-900 text-white' : 'bg-white text-blue-900'}`}>
      <span className={`absolute -top-4 -left-4 w-9 h-9 rounded-xl border-4 border-blue-900 flex items-center justify-center text-sm font-black shadow-[3px_3px_0px_0px_rgba(30,58,138,1)] bg-[#fca55d] text-blue-900`}>
        {number}
      </span>
      <div className={`w-14 h-14 rounded-xl border-2 flex items-center justify-center ${accent ? 'bg-white/10 border-white/20 text-white' : 'bg-blue-50 border-blue-200 text-blue-900'}`}>
        {icon}
      </div>
      <h3 className="text-lg font-black tracking-tight">{title}</h3>
      <p className={`text-sm font-medium leading-relaxed ${accent ? 'text-white/70' : 'text-blue-900/60'}`}>{description}</p>
    </div>
  );
}

// ─── Strona główna ────────────────────────────────────────────────────────────

export default function HomePage() {
  return (
    <div className="w-full flex flex-col">

      {/* 
          HERO
       */}
      <section className="relative min-h-[85vh] flex items-center justify-center px-6 py-20 overflow-hidden">
        {/* Tło  */}
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-[#fca55d] rounded-full opacity-60 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-[#fca55d] rounded-full opacity-40 blur-2xl pointer-events-none" />

        <div className="relative z-10 max-w-5xl mx-auto w-full grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="flex flex-col gap-7">
            <div>
              <h1 className="text-6xl sm:text-7xl font-black tracking-tighter text-blue-900 leading-none">
                PJMatch
              </h1>
              <p className="mt-4 text-xl font-black text-blue-900/40 tracking-tight uppercase">
                Projekt tłumacza Polskiego Języka Migowego
              </p>
            </div>

            <p className="text-lg font-medium text-blue-900/70 leading-relaxed max-w-md">
              <span className="bg-blue-900/5 text-blue-900/40 italic px-1 rounded">
                Jeśli kiedyś myślałeś o starcie z migowym, to trafiłeś w idealne miejsce. (Kiedyś tutaj ładniejszy tekst)
              </span>
            </p>
          </div>

          <div className="flex items-center justify-center">
            <img
              src="/logo.png"
              alt="PJMatch Logo"
              className="w-full max-w-xs h-auto object-contain drop-shadow-xl"
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
          </div>
        </div>
      </section>

      {/* 
           JAK TO DZIAŁA
       */}
      <section id="jak-to-dziala" className="bg-blue-50/60 border-y-4 border-blue-900 px-6 py-20">
        <div className="max-w-5xl mx-auto w-full flex flex-col gap-12">

          {/* Nagłówek sekcji */}
          <div className="text-center flex flex-col items-center gap-3">
            <span className="inline-block bg-white text-blue-900 text-xs font-black uppercase tracking-widest px-4 py-1.5 rounded-full border-2 border-blue-900">
              Jak to działa
            </span>
            <h2 className="text-4xl font-black tracking-tight text-blue-900">
              Od nagrania do wyników — i to w kilka kroków
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <Step
              number={1}
              icon={<IconCamera />}
              title="Rozpocznij nagrywanie"
              description="Wybierz słowo lub zdanie, które chciałbyś się nauczyć"
            />
            <Step
              number={2}
              icon={<IconBrain />}
              title="Ekstrakcja szkieletu"
              description="Twoje nagranie zostaje przerobione na zbiór punktów przy użyciu Mediapipe, które posłuży do analizy"
              accent
            />
            <Step
              number={3}
              icon={<IconUpload />}
              title="Analiza wideo"
              description="Nasza wyuczona sieć porównuje Twoje migi do wcześniej już nauczonych się danych"
            />
            <Step
              number={4}
              icon={<IconChartBar />}
              title="Wyniki i statystyki"
              description="Dostajesz zwrotną informację, na ile poprawnie wykonałeś znak i co możesz mieć do poprawy"
            />
          </div>

          <div className="flex items-start gap-4 bg-blue-900 rounded-2xl border-4 border-blue-900 px-8 py-6 shadow-[8px_8px_0px_0px_rgba(252,165,93,1)]">
            <span className="text-3xl flex-shrink-0 mt-0.5">🛡️</span>
            <p className="text-white font-semibold text-base leading-relaxed">
              Ekstrakcja szkieletu przy użyciu Mediapipe odbywa się całkowicie lokalnie na Twoim urządzeniu.
              Twój wizerunek w żaden sposób nie jest zapisywany i jest w pełni bezpieczny.
            </p>
          </div>

        </div>
      </section>

      {/* 
         O NAS
       */}
      <section className="px-6 py-20">
        <div className="max-w-5xl mx-auto w-full flex flex-col gap-10">

          {/* Nagłówek */}
          <div className="text-center flex flex-col items-center gap-3">
            <span className="inline-block bg-[#fca55d] text-blue-900 text-xs font-black uppercase tracking-widest px-4 py-1.5 rounded-full border-2 border-blue-900">
              O projekcie
            </span>
            <h2 className="text-4xl font-black tracking-tight text-blue-900">
              Zespół &amp; Osiągnięcia
            </h2>
          </div>

          <div className="bg-white border-4 border-blue-900 rounded-2xl p-10 shadow-[6px_6px_0px_0px_rgba(30,58,138,1)]">
            <p className="text-blue-900/40 italic text-lg font-medium leading-relaxed text-center">
              Jesteśmy grupą studentów z Politechniki Gdańskiej na Wydziale Elektroniki, Telekomunikacji i Informatyki. 
              Pracę na PJMatch zaczęliśmy ponad pół roku temu. Od tamtego czasu udało się nam współpracować z Polskim Związkiem Głuchych oraz niezależnymi wolontariuszami, którzy wykorzystali tą okazję do sprawdzenia własnych umiejętności. 
              Od tamtego czasu udało zebrać się ponad 5000 nagrań, które posłużyły do nauczenia sieci. <br/><br/>

              Wierzymy, że godziny które zostały włożone w ten projekt, będą w stanie komuś realnie pomóc.
              
            </p>
          </div>

          <div className="bg-blue-900 rounded-2xl border-4 border-blue-900 p-10 text-center shadow-[8px_8px_0px_0px_rgba(252,165,93,1)] flex flex-col items-center gap-5">
            <h3 className="text-3xl font-black text-white tracking-tight">
              Gotowy, żeby zacząć?
            </h3>
            <div className="flex gap-3 flex-wrap justify-center">
              <Link to="/rejestracja">
                <Button variant="secondary" size="lg">Zarejestruj się</Button>
              </Link>
              <Link to="/logowanie">
                <Button variant="ghost" size="lg" className="text-white hover:bg-white/10 border-white">
                  Zaloguj się
                </Button>
              </Link>
            </div>
          </div>

        </div>
      </section>

    </div>
  );
}
