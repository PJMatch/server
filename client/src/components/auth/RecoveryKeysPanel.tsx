import { useState } from 'react';
import { Button } from '../ui';

interface RecoveryKeysPanelProps {
  keys: string[];
  username?: string;
  continueLabel: string;
  onContinue: () => void;
}

export default function RecoveryKeysPanel({ keys, username, continueLabel, onContinue }: RecoveryKeysPanelProps) {
  const [confirmed, setConfirmed] = useState(false);
  const [copied, setCopied] = useState(false);

  const fileContent = [
    'PJMatch - klucze odzyskiwania konta',
    ...(username ? [`Login: ${username}`] : []),
    '',
    ...keys,
    '',
    'Każdy klucz można użyć tylko raz.',
  ].join('\n');

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(keys.join('\n'));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([fileContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'pjmatch-klucze-odzyskiwania.txt';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="p-4 rounded-xl bg-orange-50 border-2 border-[#fca55d] text-blue-900 text-sm font-bold">
        Zapisz te klucze w bezpiecznym miejscu. Pozwolą zmienić login lub hasło, gdy stracisz dostęp do konta.
        Każdy klucz działa tylko raz i nie zobaczysz ich ponownie.
      </div>

      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {keys.map((key) => (
          <li
            key={key}
            className="font-mono font-bold text-center text-blue-900 tracking-wider bg-blue-50 border-2 border-blue-900 rounded-xl py-3 select-all"
          >
            {key}
          </li>
        ))}
      </ul>

      <div className="flex flex-col sm:flex-row gap-3">
        <Button type="button" variant="outline" fullWidth onClick={handleCopy}>
          {copied ? 'Skopiowano!' : 'Kopiuj'}
        </Button>
        <Button type="button" variant="outline" fullWidth onClick={handleDownload}>
          Pobierz .txt
        </Button>
      </div>

      <label className="flex items-center gap-3 text-sm font-bold text-blue-900 cursor-pointer">
        <input
          type="checkbox"
          checked={confirmed}
          onChange={(e) => setConfirmed(e.target.checked)}
          className="w-5 h-5 accent-blue-900 cursor-pointer"
        />
        Zapisałem klucze w bezpiecznym miejscu
      </label>

      <Button type="button" fullWidth size="lg" disabled={!confirmed} onClick={onContinue}>
        {continueLabel}
      </Button>
    </div>
  );
}
