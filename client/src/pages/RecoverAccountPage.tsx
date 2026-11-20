import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { recoverAccount, type RecoverAccountRequest } from '../services/recoveryService';
import { Button, Card, Input } from '../components/ui';

export default function RecoverAccountPage() {
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [recoveryKey, setRecoveryKey] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [usernameError, setUsernameError] = useState('');
  const [recoveryKeyError, setRecoveryKeyError] = useState('');
  const [newUsernameError, setNewUsernameError] = useState('');
  const [newPasswordError, setNewPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [generalError, setGeneralError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [result, setResult] = useState<{ username: string; remaining: number } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError('');
    let valid = true;

    const trimmedUsername = username.trim();
    const trimmedKey = recoveryKey.trim();
    const trimmedNewUsername = newUsername.trim();

    if (!trimmedUsername) {
      setUsernameError('Wprowadź login.');
      valid = false;
    } else {
      setUsernameError('');
    }

    if (!trimmedKey) {
      setRecoveryKeyError('Wprowadź klucz odzyskiwania.');
      valid = false;
    } else {
      setRecoveryKeyError('');
    }

    if (trimmedNewUsername && (trimmedNewUsername.length < 3 || trimmedNewUsername.length > 50)) {
      setNewUsernameError('Login musi zawierać od 3 do 50 znaków.');
      valid = false;
    } else {
      setNewUsernameError('');
    }

    if (newPassword && (newPassword.length < 8 || newPassword.length > 72)) {
      setNewPasswordError('Hasło musi zawierać od 8 do 72 znaków.');
      valid = false;
    } else {
      setNewPasswordError('');
    }

    if (newPassword !== confirmPassword) {
      setConfirmPasswordError('Wprowadzone hasła nie są identyczne.');
      valid = false;
    } else {
      setConfirmPasswordError('');
    }

    if (valid && !trimmedNewUsername && !newPassword) {
      setGeneralError('Podaj nowe hasło lub nowy login.');
      valid = false;
    }

    if (!valid) return;

    const request: RecoverAccountRequest = {
      username: trimmedUsername,
      recovery_key: trimmedKey,
    };
    if (trimmedNewUsername) request.new_username = trimmedNewUsername;
    if (newPassword) request.new_password = newPassword;

    setIsLoading(true);
    try {
      const response = await recoverAccount(request);
      setResult({ username: response.user.username, remaining: response.recovery_keys_remaining });
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        if (err.response?.status === 401) {
          setGeneralError('Niepoprawny login lub klucz odzyskiwania.');
        } else if (err.response?.status === 409) {
          setNewUsernameError('Użytkownik o podanym loginie już istnieje.');
        } else if (err.response?.status === 400) {
          setGeneralError('Nowy login musi różnić się od obecnego lub podaj nowe hasło.');
        } else if (err.response?.status === 429) {
          setGeneralError('Zbyt wiele prób. Odczekaj chwilę i spróbuj ponownie.');
        } else {
          setGeneralError('Wystąpił błąd podczas odzyskiwania konta. Spróbuj ponownie.');
        }
      } else {
        setGeneralError('Nie udało się połączyć z serwerem.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (result) {
    return (
      <div className="w-full max-w-md flex flex-col items-center">
        <Card variant="default" className="w-full">
          <h2 className="text-3xl font-extrabold mb-6 text-center tracking-tight text-blue-900">
            Konto odzyskane
          </h2>
          <div className="mb-5 p-4 rounded-xl bg-green-50 border-2 border-green-600 text-green-800 text-sm font-bold">
            Dane zostały zmienione. Zaloguj się jako <span className="font-black">{result.username}</span>.
          </div>
          <p className={`mb-6 text-sm font-bold ${result.remaining <= 2 ? 'text-red-600' : 'text-blue-900/60'}`}>
            Pozostałe klucze odzyskiwania: {result.remaining}.
            {result.remaining <= 2 && ' Po zalogowaniu wygeneruj nowe klucze.'}
          </p>
          <Button type="button" fullWidth size="lg" onClick={() => navigate('/logowanie', { replace: true })}>
            Przejdź do logowania
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md flex flex-col items-center">
      <Card variant="default" className="w-full">
        <h2 className="text-3xl font-extrabold mb-3 text-center tracking-tight text-blue-900">
          Odzyskiwanie konta
        </h2>
        <p className="text-center text-sm font-medium text-blue-900/60 mb-6">
          Użyj jednego z kluczy otrzymanych przy rejestracji, aby zmienić hasło lub login.
        </p>

        {generalError && (
          <div className="mb-5 p-4 rounded-xl bg-red-50 border-2 border-red-500 text-red-700 text-sm font-bold">
            {generalError}
          </div>
        )}

        <form className="flex flex-col gap-5" onSubmit={handleSubmit} noValidate>
          <Input
            label="Login"
            type="text"
            placeholder="Wpisz obecny login"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            error={usernameError}
          />
          <Input
            label="Klucz odzyskiwania"
            type="text"
            placeholder="XXXX-XXXX-XXXX"
            autoComplete="off"
            spellCheck={false}
            className="font-mono uppercase tracking-wider"
            value={recoveryKey}
            onChange={(e) => setRecoveryKey(e.target.value)}
            error={recoveryKeyError}
          />
          <Input
            label="Nowe hasło"
            type="password"
            placeholder="Min. 8 znaków"
            autoComplete="new-password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            error={newPasswordError}
          />
          <Input
            label="Powtórz nowe hasło"
            type="password"
            placeholder="Powtórz hasło"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            error={confirmPasswordError}
          />
          <Input
            label="Nowy login (opcjonalnie)"
            type="text"
            placeholder="Zostaw puste, aby nie zmieniać"
            value={newUsername}
            onChange={(e) => setNewUsername(e.target.value)}
            error={newUsernameError}
          />
          <Button type="submit" fullWidth size="lg" className="mt-2" disabled={isLoading}>
            {isLoading ? 'Zapisywanie...' : 'Odzyskaj konto'}
          </Button>
        </form>

        <p className="text-center text-sm font-medium text-blue-900/50 mt-6">
          Pamiętasz hasło?{' '}
          <Link to="/logowanie" className="font-bold text-blue-900 underline underline-offset-2 hover:text-blue-700">
            Zaloguj się
          </Link>
        </p>
      </Card>
    </div>
  );
}
