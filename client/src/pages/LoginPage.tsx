import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button, Card, Input } from '../components/ui';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let valid = true;

    if (!email.includes('@')) {
      setEmailError('Podaj poprawny adres e-mail.');
      valid = false;
    } else {
      setEmailError('');
    }

    if (password.length < 1) {
      setPasswordError('Hasło jest wymagane.');
      valid = false;
    } else {
      setPasswordError('');
    }

    if (!valid) return;

    // Symulacja logowania (do zastąpienia wywołaniem API)
    login({ login: email.split('@')[0], email });
    navigate('/');
  };

  return (
    <div className="w-full max-w-6xl flex flex-col md:flex-row gap-12 items-center justify-center">

      {/* Lewa kolumna – formularz */}
      <Card variant="default" className="w-full max-w-md flex-shrink-0">
        <h2 className="text-3xl font-extrabold mb-8 text-center tracking-tight text-blue-900">
          Logowanie
        </h2>
        <form className="flex flex-col gap-5" onSubmit={handleSubmit} noValidate>
          <Input
            label="Adres e-mail"
            type="email"
            placeholder="jan.kowalski@pg.edu.pl"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={emailError}
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                <path d="M3 4a2 2 0 0 0-2 2v1.161l8.441 4.221a1.25 1.25 0 0 0 1.118 0L19 7.162V6a2 2 0 0 0-2-2H3Z" />
                <path d="m19 8.839-7.77 3.885a2.75 2.75 0 0 1-2.46 0L1 8.839V14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8.839Z" />
              </svg>
            }
          />
          <Input
            label="Hasło"
            type="password"
            placeholder="Twoje hasło"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={passwordError}
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                <path fillRule="evenodd" d="M10 1a4.5 4.5 0 0 0-4.5 4.5V9H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2h-.5V5.5A4.5 4.5 0 0 0 10 1Zm3 8V5.5a3 3 0 1 0-6 0V9h6Z" clipRule="evenodd" />
              </svg>
            }
          />
          <Button type="submit" fullWidth size="lg" className="mt-2">
            Zaloguj się
          </Button>
        </form>

        <p className="text-center text-sm font-medium text-blue-900/50 mt-6">
          Nie masz konta?{' '}
          <a href="/rejestracja" className="font-bold text-blue-900 underline underline-offset-2 hover:text-blue-700">
            Zarejestruj się
          </a>
        </p>
      </Card>

      {/* Prawa kolumna – hero */}
      <div className="flex-1 flex flex-col items-center justify-center max-w-2xl text-center">
        <img
          src="/logo.png"
          alt="PJMatch Logo"
          className="w-64 h-auto object-contain mb-4"
          onError={(e) => { e.currentTarget.style.display = 'none'; }}
        />

        <h1 className="text-7xl font-black mb-8 tracking-tighter text-blue-900">
          PJMatch
        </h1>

        <Card variant="flat" className="w-full">
          <p className="text-xl font-bold leading-relaxed text-blue-900">
            Witaj na stronie internetowej PJMatch, projektu studentów
            wydziału ETI Politechniki Gdańskiej!
          </p>
        </Card>
      </div>

    </div>
  );
}
