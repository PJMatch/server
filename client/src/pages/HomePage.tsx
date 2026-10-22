import { Link } from 'react-router-dom';
import { Button, Card } from '../components/ui';

export default function HomePage() {
  return (
    <div className="w-full max-w-4xl flex flex-col items-center justify-center text-center gap-10">

      <img
        src="/logo.png"
        alt="PJMatch Logo"
        className="w-64 h-auto object-contain"
        onError={(e) => { e.currentTarget.style.display = 'none'; }}
      />

      <div className="flex flex-col items-center gap-4">
        <span className="inline-block bg-[#fca55d] text-blue-900 text-xs font-black uppercase tracking-widest px-4 py-1.5 rounded-full border-2 border-blue-900">
          Wydział ETI · Politechnika Gdańska
        </span>
        <h1 className="text-7xl font-black tracking-tighter text-blue-900">
          PJMatch
        </h1>
      </div>

      <Card variant="flat" className="w-full max-w-2xl">
        <p className="text-xl font-bold leading-relaxed text-blue-900">
          Witaj na stronie internetowej PJMatch — projektu studentów
          wydziału ETI Politechniki Gdańskiej!
        </p>
      </Card>

      <div className="flex gap-4 flex-wrap justify-center">
        <Link to="/logowanie">
          <Button variant="outline" size="lg">Zaloguj się</Button>
        </Link>
        <Link to="/rejestracja">
          <Button variant="primary" size="lg">Zarejestruj się</Button>
        </Link>
      </div>

    </div>
  );
}

