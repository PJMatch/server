export default function Footer() {
  return (
    <footer className="w-full border-t-4 border-blue-900 bg-white/90 backdrop-blur-sm mt-auto z-10">
      <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-center">
        <p className="text-xs font-medium text-blue-900/40">
          © {new Date().getFullYear()} PJMatch — Politechnika Gdańska, Wydział ETI
        </p>
      </div>
    </footer>
  );
}
