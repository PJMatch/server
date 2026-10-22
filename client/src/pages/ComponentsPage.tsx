import { useState } from 'react';
import { Button, Input, Select, Card, ProgressBar } from '../components/ui';

const ROLE_OPTIONS = [
  { value: 'student', label: 'Student' },
  { value: 'prowadzacy', label: 'Prowadzący' },
  { value: 'admin', label: 'Administrator' },
];

const YEAR_OPTIONS = [
  { value: '1', label: 'I rok' },
  { value: '2', label: 'II rok' },
  { value: '3', label: 'III rok' },
  { value: '4', label: 'IV rok' },
];

export default function ComponentsPage() {
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [role, setRole] = useState('');
  const [roleError, setRoleError] = useState('');
  const [progress, setProgress] = useState(62);

  const validateForm = () => {
    let valid = true;

    if (!email.includes('@')) {
      setEmailError('Podaj poprawny adres e-mail.');
      valid = false;
    } else {
      setEmailError('');
    }

    if (password.length < 8) {
      setPasswordError('Hasło musi mieć co najmniej 8 znaków.');
      valid = false;
    } else {
      setPasswordError('');
    }

    if (!role) {
      setRoleError('Wybierz rolę użytkownika.');
      valid = false;
    } else {
      setRoleError('');
    }

    return valid;
  };

  return (
    <div className="w-full max-w-5xl flex flex-col gap-12">

      {/* ── Header ── */}
      <div className="text-center">
        <span className="inline-block bg-[#fca55d] text-blue-900 text-xs font-black uppercase tracking-widest px-4 py-1.5 rounded-full border-2 border-blue-900 mb-4">
          Biblioteka komponentów
        </span>
        <h1 className="text-5xl font-black tracking-tighter text-blue-900">
          Komponenty UI
        </h1>
        <p className="mt-3 text-blue-900/60 font-medium text-lg">
          Reużywalne elementy interfejsu w stylu PJMatch
        </p>
      </div>

      {/* ── Buttons ── */}
      <Card variant="flat">
        <h2 className="text-2xl font-black text-blue-900 mb-6 pb-4 border-b-2 border-blue-900/10">
          Button
        </h2>

        <div className="space-y-6">
          {/* Variants */}
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-blue-900/40 mb-3">Warianty</p>
            <div className="flex flex-wrap gap-3">
              <Button variant="primary">Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
            </div>
          </div>

          {/* Sizes */}
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-blue-900/40 mb-3">Rozmiary</p>
            <div className="flex flex-wrap items-end gap-3">
              <Button size="sm">Mały</Button>
              <Button size="md">Średni</Button>
              <Button size="lg">Duży</Button>
            </div>
          </div>

          {/* States */}
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-blue-900/40 mb-3">Stany</p>
            <div className="flex flex-wrap gap-3">
              <Button disabled>Wyłączony</Button>
              <Button variant="outline" disabled>Wyłączony outline</Button>
              <Button variant="secondary">
                <span className="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                    <path d="M9.25 13.25a.75.75 0 0 0 1.5 0V4.636l2.955 3.129a.75.75 0 0 0 1.09-1.03l-4.25-4.5a.75.75 0 0 0-1.09 0l-4.25 4.5a.75.75 0 1 0 1.09 1.03L9.25 4.636v8.614Z" />
                    <path d="M3.5 12.75a.75.75 0 0 0-1.5 0v2.5A2.75 2.75 0 0 0 4.75 18h10.5A2.75 2.75 0 0 0 18 15.25v-2.5a.75.75 0 0 0-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5Z" />
                  </svg>
                  Wgraj plik
                </span>
              </Button>
            </div>
          </div>

          {/* Full width */}
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-blue-900/40 mb-3">Pełna szerokość</p>
            <Button fullWidth>Zaloguj się</Button>
          </div>
        </div>
      </Card>

      {/* ── Input ── */}
      <Card variant="flat">
        <h2 className="text-2xl font-black text-blue-900 mb-6 pb-4 border-b-2 border-blue-900/10">
          Input
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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
            placeholder="Minimum 8 znaków"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={passwordError}
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                <path fillRule="evenodd" d="M10 1a4.5 4.5 0 0 0-4.5 4.5V9H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2h-.5V5.5A4.5 4.5 0 0 0 10 1Zm3 8V5.5a3 3 0 1 0-6 0V9h6Z" clipRule="evenodd" />
              </svg>
            }
          />
          <Input
            label="Imię i nazwisko"
            placeholder="Jan Kowalski"
          />
          <Input
            label="Numer albumu"
            placeholder="123456"
            disabled
            value="(tylko do odczytu)"
          />
        </div>
      </Card>

      {/* ── Select ── */}
      <Card variant="flat">
        <h2 className="text-2xl font-black text-blue-900 mb-6 pb-4 border-b-2 border-blue-900/10">
          Select / Dropdown
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Select
            label="Rola"
            options={ROLE_OPTIONS}
            placeholder="Wybierz rolę..."
            value={role}
            onChange={(e) => setRole(e.target.value)}
            error={roleError}
          />
          <Select
            label="Rok studiów"
            options={YEAR_OPTIONS}
            placeholder="Wybierz rok..."
            defaultValue=""
          />
        </div>
        <div className="mt-4">
          <Button onClick={validateForm} variant="outline">
            Sprawdź walidację
          </Button>
        </div>
      </Card>

      {/* ── ProgressBar ── */}
      <Card variant="flat">
        <h2 className="text-2xl font-black text-blue-900 mb-6 pb-4 border-b-2 border-blue-900/10">
          ProgressBar
        </h2>
        <div className="space-y-5">
          <ProgressBar value={progress} label="Postęp nagrywania" showPercent color="primary" />
          <ProgressBar value={35}  label="Transkrypcja"          showPercent color="accent"  />
          <ProgressBar value={88}  label="Analiza danych"        showPercent color="success" size="sm" />
          <ProgressBar value={50}  label="Duży pasek"            showPercent size="lg" />

          {/* Interactive slider */}
          <div className="pt-2 border-t-2 border-blue-900/10">
            <p className="text-xs font-black uppercase tracking-widest text-blue-900/40 mb-3">
              Interaktywny
            </p>
            <input
              type="range"
              min={0}
              max={100}
              value={progress}
              onChange={(e) => setProgress(Number(e.target.value))}
              className="w-full accent-blue-900 cursor-pointer"
            />
          </div>
        </div>
      </Card>

      {/* ── Card variants ── */}
      <div>
        <h2 className="text-2xl font-black text-blue-900 mb-6">Card</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card variant="default">
            <p className="text-xs font-black uppercase tracking-widest text-blue-900/40 mb-2">Default</p>
            <p className="font-bold text-blue-900">Gruba ramka z mocnym cieniem neo-brutalistycznym.</p>
          </Card>
          <Card variant="elevated">
            <p className="text-xs font-black uppercase tracking-widest text-blue-900/40 mb-2">Elevated</p>
            <p className="font-bold text-blue-900">Wyższy cień – przyciąga wzrok.</p>
          </Card>
          <Card variant="flat">
            <p className="text-xs font-black uppercase tracking-widest text-blue-900/40 mb-2">Flat</p>
            <p className="font-bold text-blue-900">Subtelny cień – do sekcji drugorzędnych.</p>
          </Card>
        </div>
      </div>

      {/* ── Realistic form example ── */}
      <Card variant="elevated">
        <h2 className="text-2xl font-black text-blue-900 mb-2">
          Przykładowy formularz
        </h2>
        <p className="text-blue-900/50 font-medium mb-8">
          Rejestracja nowego konta PJMatch
        </p>
        <form className="grid grid-cols-1 md:grid-cols-2 gap-5" onSubmit={(e) => { e.preventDefault(); validateForm(); }}>
          <Input label="Imię" placeholder="Jan" />
          <Input label="Nazwisko" placeholder="Kowalski" />
          <Input
            label="E-mail uczelniany"
            type="email"
            placeholder="s123456@student.pg.edu.pl"
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                <path d="M3 4a2 2 0 0 0-2 2v1.161l8.441 4.221a1.25 1.25 0 0 0 1.118 0L19 7.162V6a2 2 0 0 0-2-2H3Z" />
                <path d="m19 8.839-7.77 3.885a2.75 2.75 0 0 1-2.46 0L1 8.839V14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8.839Z" />
              </svg>
            }
          />
          <Select label="Rola" options={ROLE_OPTIONS} placeholder="Wybierz..." />
          <div className="md:col-span-2">
            <Input
              label="Hasło"
              type="password"
              placeholder="Minimum 8 znaków"
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                  <path fillRule="evenodd" d="M10 1a4.5 4.5 0 0 0-4.5 4.5V9H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2h-.5V5.5A3 3 0 1 0 7 9h6V5.5A4.5 4.5 0 0 0 10 1Z" clipRule="evenodd" />
                </svg>
              }
            />
          </div>
          <div className="md:col-span-2 flex gap-3 pt-2">
            <Button type="submit" fullWidth>
              Zarejestruj się
            </Button>
            <Button type="reset" variant="outline">
              Wyczyść
            </Button>
          </div>
        </form>
      </Card>

    </div>
  );
}

