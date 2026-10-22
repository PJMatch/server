export default function Footer() {
  return (
    <footer className="w-full border-t-4 border-blue-900 bg-white/90 backdrop-blur-sm mt-auto z-10">
      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

          {/* Kolumna 1 – Brand */}
          <div className="flex flex-col gap-3">
            <span className="text-xl font-black text-blue-900 tracking-tight">PJMatch</span>
            <p className="text-sm font-medium text-blue-900/60 leading-relaxed">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Projekt
              studentów Wydziału ETI Politechniki Gdańskiej.
            </p>
          </div>

          {/* Kolumna 2 – Linki */}
          <div className="flex flex-col gap-2">
            <p className="text-xs font-black uppercase tracking-widest text-blue-900/40 mb-1">
              Nawigacja
            </p>
            {['O projekcie', 'Zaloguj się', 'Rejestracja'].map((item) => (
              <a
                key={item}
                href="#"
                className="text-sm font-bold text-blue-900 hover:text-blue-700 transition-colors w-fit"
              >
                {item}
              </a>
            ))}
          </div>

          {/* Kolumna 3 – Informacje */}
          <div className="flex flex-col gap-2">
            <p className="text-xs font-black uppercase tracking-widest text-blue-900/40 mb-1">
              Informacje
            </p>
            <p className="text-sm font-medium text-blue-900/60 leading-relaxed">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do
              eiusmod tempor incididunt ut labore et dolore magna aliqua.
            </p>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-8 pt-6 border-t-2 border-blue-900/10 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs font-medium text-blue-900/40">
            © {new Date().getFullYear()} PJMatch — Politechnika Gdańska, Wydział ETI
          </p>
          <p className="text-xs font-medium text-blue-900/40">
            Lorem ipsum dolor sit amet
          </p>
        </div>
      </div>
    </footer>
  );
}

