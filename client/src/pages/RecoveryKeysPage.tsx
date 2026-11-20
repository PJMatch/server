import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { regenerateRecoveryKeys } from '../services/recoveryService';
import { Button, Card, Input } from '../components/ui';
import RecoveryKeysPanel from '../components/auth/RecoveryKeysPanel';

export default function RecoveryKeysPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const initialKeys = (location.state as { recoveryKeys?: string[] } | null)?.recoveryKeys ?? null;
  const isAfterRegistration = initialKeys !== null && initialKeys.length > 0;

  const [keys, setKeys] = useState<string[] | null>(isAfterRegistration ? initialKeys : null);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [generalError, setGeneralError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError('');

    if (!password) {
      setPasswordError('Hasło jest wymagane.');
      return;
    }
    setPasswordError('');

    setIsLoading(true);
    try {
      const newKeys = await regenerateRecoveryKeys(password);
      setPassword('');
      setKeys(newKeys);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        if (err.response?.status === 403) {
          setPasswordError('Niepoprawne hasło.');
        } else if (err.response?.status === 429) {
          setGeneralError('Zbyt wiele prób. Odczekaj chwilę i spróbuj ponownie.');
        } else if (err.response?.status === 401) {
          setGeneralError('Sesja wygasła. Zaloguj się ponownie.');
        } else {
          setGeneralError('Nie udało się wygenerować kluczy. Spróbuj ponownie.');
        }
      } else {
        setGeneralError('Nie udało się połączyć z serwerem.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleContinue = () => {
    navigate('/nagraj', { replace: true });
  };

  return (
    <div className="w-full max-w-xl flex flex-col items-center">
      <Card variant="default" className="w-full">
        <h2 className="text-3xl font-extrabold mb-3 text-center tracking-tight text-blue-900">
          Klucze odzyskiwania
        </h2>

        {keys ? (
          <>
            <p className="text-center text-sm font-medium text-blue-900/60 mb-6">
              {isAfterRegistration
                ? 'Twoje konto zostało utworzone. Oto Twoje klucze odzyskiwania.'
                : 'Wygenerowano nowe klucze. Poprzednie klucze przestały działać.'}
            </p>
            <RecoveryKeysPanel
              keys={keys}
              username={user?.username}
              continueLabel="Przejdź do nagrywania"
              onContinue={handleContinue}
            />
          </>
        ) : (
          <>
            <p className="text-center text-sm font-medium text-blue-900/60 mb-6">
              Wygenerowanie nowych kluczy unieważni wszystkie poprzednie. Potwierdź hasłem.
            </p>

            {generalError && (
              <div className="mb-5 p-4 rounded-xl bg-red-50 border-2 border-red-500 text-red-700 text-sm font-bold">
                {generalError}
              </div>
            )}

            <form className="flex flex-col gap-5" onSubmit={handleSubmit} noValidate>
              <Input
                label="Hasło"
                type="password"
                placeholder="Wpisz hasło"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                error={passwordError}
              />
              <Button type="submit" fullWidth size="lg" disabled={isLoading}>
                {isLoading ? 'Generowanie...' : 'Wygeneruj nowe klucze'}
              </Button>
            </form>
          </>
        )}
      </Card>
    </div>
  );
}
