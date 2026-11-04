import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Button, Card, Input } from '../components/ui';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Retrieve origin route from ProtectedRoute redirection state or fallback to home
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/nagraj';

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [generalError, setGeneralError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError('');
    let valid = true;

    const trimmedUsername = username.trim();
    if (!trimmedUsername) {
      setUsernameError('Wprowadź login lub adres e-mail.');
      valid = false;
    } else {
      setUsernameError('');
    }

    if (!password) {
      setPasswordError('Hasło jest wymagane.');
      valid = false;
    } else {
      setPasswordError('');
    }

    if (!valid) return;

    setIsLoading(true);
    try {
      // Call backend login endpoint
      const response = await api.post<{
        access_token: string;
        refresh_token: string;
        user: { id: string; username: string; role: string };
      }>('/auth/login/web', {
        username: trimmedUsername,
        password,
      });

      const { access_token, refresh_token, user } = response.data;
      login(user, {
        accessToken: access_token,
        refreshToken: refresh_token,
      });

      navigate(from, { replace: true });
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        if (err.response?.status === 401) {
          setGeneralError('Niepoprawny login lub hasło.');
        } else if (err.response?.status === 429) {
          setGeneralError('Zbyt wiele nieudanych prób logowania. Odczekaj chwilę.');
        } else if (err.response?.data?.error) {
          setGeneralError(err.response.data.error);
        } else {
          setGeneralError('Wystąpił błąd logowania. Spróbuj ponownie.');
        }
      } else {
        setGeneralError('Nie udało się połączyć z serwerem.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-6xl flex flex-col md:flex-row gap-12 items-center justify-center">

      {/* Left column – login form */}
      <Card variant="default" className="w-full max-w-md flex-shrink-0">
        <h2 className="text-3xl font-extrabold mb-8 text-center tracking-tight text-blue-900">
          Logowanie
        </h2>

        {generalError && (
          <div className="mb-5 p-4 rounded-xl bg-red-50 border-2 border-red-500 text-red-700 text-sm font-bold">
            {generalError}
          </div>
        )}

        <form className="flex flex-col gap-5" onSubmit={handleSubmit} noValidate>
          <Input
            label="Login"
            type="text"
            placeholder="Wpisz login"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            error={usernameError}
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                <path d="M10 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM3.465 14.493a1.23 1.23 0 0 0 .41 1.412A9.957 9.957 0 0 0 10 18c2.31 0 4.438-.784 6.131-2.1.43-.333.604-.903.408-1.41a7.002 7.002 0 0 0-13.074.003Z" />
              </svg>
            }
          />
          <Input
            label="Hasło"
            type="password"
            placeholder="Wpisz hasło"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={passwordError}
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                <path fillRule="evenodd" d="M10 1a4.5 4.5 0 0 0-4.5 4.5V9H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2h-.5V5.5A4.5 4.5 0 0 0 10 1Zm3 8V5.5a3 3 0 1 0-6 0V9h6Z" clipRule="evenodd" />
              </svg>
            }
          />
          <Button type="submit" fullWidth size="lg" className="mt-2" disabled={isLoading}>
            {isLoading ? 'Logowanie...' : 'Zaloguj się'}
          </Button>
        </form>

        <p className="text-center text-sm font-medium text-blue-900/50 mt-6">
          Nie masz konta?{' '}
          <Link to="/rejestracja" className="font-bold text-blue-900 underline underline-offset-2 hover:text-blue-700">
            Zarejestruj się
          </Link>
        </p>
      </Card>

      {/* Right column – hero branding */}
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
            Witaj na stronie PJMatch
          </p>
        </Card>
      </div>

    </div>
  );
}
