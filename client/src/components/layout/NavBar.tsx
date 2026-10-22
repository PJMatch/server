import { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui';

// ── Ikony inline (bez dodatkowych paczek) ─────────────────────────────────────

function MenuIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
      className="w-6 h-6">
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
      className="w-6 h-6">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function ChevronDownIcon({ open }: { open: boolean }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"
      className={`w-4 h-4 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>
      <path fillRule="evenodd"
        d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z"
        clipRule="evenodd" />
    </svg>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function NavLink({ to, children, onClick }: { to: string; children: React.ReactNode; onClick?: () => void }) {
  const { pathname } = useLocation();
  const isActive = pathname === to;
  return (
    <Link
      to={to}
      onClick={onClick}
      className={`font-bold px-4 py-2 rounded-xl transition-all duration-200 text-sm whitespace-nowrap ${
        isActive
          ? 'bg-blue-900 text-white shadow-[2px_2px_0px_0px_rgba(30,58,138,0.3)]'
          : 'text-blue-900 hover:bg-blue-100/60'
      }`}
    >
      {children}
    </Link>
  );
}

// ── Główny komponent ──────────────────────────────────────────────────────────

export default function NavBar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setDropdownOpen(false);
    setMobileOpen(false);
    navigate('/');
  };

  // Ref do zamknięcia dropdownu po kliknięciu poza nim
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Zamknij menu mobilne przy zmianie rozmiaru okna do desktop
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)');
    const handler = (e: MediaQueryListEvent) => { if (e.matches) setMobileOpen(false); };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const closeMobile = () => setMobileOpen(false);

  return (
    <header className="w-full bg-white/90 backdrop-blur-sm border-b-4 border-blue-900 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between gap-4">

        {/* ── Logo ── */}
        <Link to="/" className="flex items-center gap-3 group flex-shrink-0">
          <img
            src="/logo.png"
            alt="PJMatch"
            className="w-9 h-9 object-contain"
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
          <span className="text-2xl font-black text-blue-900 tracking-tight group-hover:text-blue-800 transition-colors">
            PJMatch
          </span>
        </Link>

        {/* ── Desktop Nav ── */}
        <nav className="hidden md:flex items-center gap-2">
          {user ? (
            // ---- Zalogowany ----
            <>
              <NavLink to="/o-projekcie">O projekcie</NavLink>

              {/* User dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen((v) => !v)}
                  className="flex items-center gap-2 font-bold px-4 py-2 rounded-xl border-2 border-blue-900 bg-white text-blue-900 hover:bg-blue-50 transition-all duration-200 shadow-[2px_2px_0px_0px_rgba(30,58,138,0.5)] cursor-pointer"
                >
                  {/* Avatar inicjały */}
                  <span className="w-7 h-7 rounded-lg bg-blue-900 text-white text-xs font-black flex items-center justify-center flex-shrink-0">
                    {user.login.charAt(0).toUpperCase()}
                  </span>
                  <span className="max-w-[120px] truncate">{user.login}</span>
                  <ChevronDownIcon open={dropdownOpen} />
                </button>

                {/* Dropdown panel */}
                {dropdownOpen && (
                  <div className="absolute right-0 top-full mt-2 w-52 bg-white border-4 border-blue-900 rounded-2xl shadow-[6px_6px_0px_0px_rgba(30,58,138,1)] overflow-hidden">
                    <Link
                      to="/nagraj"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-3 px-5 py-3.5 font-bold text-blue-900 hover:bg-blue-50 transition-colors border-b-2 border-blue-900/10"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 flex-shrink-0">
                        <path d="M9.25 13.25a.75.75 0 0 0 1.5 0V4.636l2.955 3.129a.75.75 0 0 0 1.09-1.03l-4.25-4.5a.75.75 0 0 0-1.09 0l-4.25 4.5a.75.75 0 1 0 1.09 1.03L9.25 4.636v8.614Z" />
                        <path d="M3.5 12.75a.75.75 0 0 0-1.5 0v2.5A2.75 2.75 0 0 0 4.75 18h10.5A2.75 2.75 0 0 0 18 15.25v-2.5a.75.75 0 0 0-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5Z" />
                      </svg>
                      Wgraj szkielet
                    </Link>
                    <Link
                      to="/statystyki"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-3 px-5 py-3.5 font-bold text-blue-900 hover:bg-blue-50 transition-colors border-b-2 border-blue-900/10"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 flex-shrink-0">
                        <path d="M15.5 2A1.5 1.5 0 0 0 14 3.5v13a1.5 1.5 0 0 0 3 0v-13A1.5 1.5 0 0 0 15.5 2ZM9.5 6A1.5 1.5 0 0 0 8 7.5v9a1.5 1.5 0 0 0 3 0v-9A1.5 1.5 0 0 0 9.5 6ZM3.5 10A1.5 1.5 0 0 0 2 11.5v5a1.5 1.5 0 0 0 3 0v-5A1.5 1.5 0 0 0 3.5 10Z" />
                      </svg>
                      Moje statystyki
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-5 py-3.5 font-bold text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 flex-shrink-0">
                        <path fillRule="evenodd" d="M3 4.25A2.25 2.25 0 0 1 5.25 2h5.5A2.25 2.25 0 0 1 13 4.25v2a.75.75 0 0 1-1.5 0v-2a.75.75 0 0 0-.75-.75h-5.5a.75.75 0 0 0-.75.75v11.5c0 .414.336.75.75.75h5.5a.75.75 0 0 0 .75-.75v-2a.75.75 0 0 1 1.5 0v2A2.25 2.25 0 0 1 10.75 18h-5.5A2.25 2.25 0 0 1 3 15.75V4.25Z" clipRule="evenodd" />
                        <path fillRule="evenodd" d="M19 10a.75.75 0 0 0-.75-.75H8.704l1.048-1.04a.75.75 0 1 0-1.06-1.062l-2.25 2.25a.75.75 0 0 0 0 1.062l2.25 2.25a.75.75 0 1 0 1.06-1.06l-1.048-1.04h9.546A.75.75 0 0 0 19 10Z" clipRule="evenodd" />
                      </svg>
                      Wyloguj
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            // ---- Gość ----
            <>
              <NavLink to="/o-projekcie">O projekcie</NavLink>
              <Link to="/logowanie">
                <Button variant="outline" size="sm">Zaloguj</Button>
              </Link>
              <Link to="/rejestracja">
                <Button variant="primary" size="sm">Rejestracja</Button>
              </Link>
            </>
          )}
        </nav>

        {/* ── Hamburger (mobile) ── */}
        <button
          className="md:hidden flex items-center justify-center w-10 h-10 rounded-xl border-2 border-blue-900 text-blue-900 hover:bg-blue-50 transition-colors cursor-pointer"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label={mobileOpen ? 'Zamknij menu' : 'Otwórz menu'}
        >
          {mobileOpen ? <CloseIcon /> : <MenuIcon />}
        </button>
      </div>

      {/* ── Mobile Menu ── */}
      <div
        className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${
          mobileOpen ? 'max-h-screen border-t-4 border-blue-900' : 'max-h-0'
        }`}
      >
        <nav className="flex flex-col gap-2 px-6 py-5 bg-white">
          {user ? (
            // ---- Zalogowany (mobile) ----
            <>
              {/* Identyfikacja użytkownika */}
              <div className="flex items-center gap-3 px-4 py-3 bg-blue-50 rounded-xl border-2 border-blue-900 mb-1">
                <span className="w-9 h-9 rounded-lg bg-blue-900 text-white text-sm font-black flex items-center justify-center flex-shrink-0">
                  {user.login.charAt(0).toUpperCase()}
                </span>
                <div>
                  <p className="font-black text-blue-900 text-sm leading-none">{user.login}</p>
                  <p className="text-blue-900/50 text-xs mt-0.5">{user.email}</p>
                </div>
              </div>

              <NavLink to="/o-projekcie" onClick={closeMobile}>O projekcie</NavLink>
              <NavLink to="/nagraj" onClick={closeMobile}>Wgraj szkielet</NavLink>
              <NavLink to="/statystyki" onClick={closeMobile}>Moje statystyki</NavLink>

              <button
                onClick={handleLogout}
                className="flex items-center gap-3 px-4 py-2 rounded-xl font-bold text-red-600 hover:bg-red-50 transition-colors cursor-pointer text-sm mt-1"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                  <path fillRule="evenodd" d="M3 4.25A2.25 2.25 0 0 1 5.25 2h5.5A2.25 2.25 0 0 1 13 4.25v2a.75.75 0 0 1-1.5 0v-2a.75.75 0 0 0-.75-.75h-5.5a.75.75 0 0 0-.75.75v11.5c0 .414.336.75.75.75h5.5a.75.75 0 0 0 .75-.75v-2a.75.75 0 0 1 1.5 0v2A2.25 2.25 0 0 1 10.75 18h-5.5A2.25 2.25 0 0 1 3 15.75V4.25Z" clipRule="evenodd" />
                  <path fillRule="evenodd" d="M19 10a.75.75 0 0 0-.75-.75H8.704l1.048-1.04a.75.75 0 1 0-1.06-1.062l-2.25 2.25a.75.75 0 0 0 0 1.062l2.25 2.25a.75.75 0 1 0 1.06-1.06l-1.048-1.04h9.546A.75.75 0 0 0 19 10Z" clipRule="evenodd" />
                </svg>
                Wyloguj
              </button>
            </>
          ) : (
            // ---- Gość (mobile) ----
            <>
              <NavLink to="/o-projekcie" onClick={closeMobile}>O projekcie</NavLink>
              <div className="flex flex-col gap-2 pt-1">
                <Link to="/logowanie" onClick={closeMobile}>
                  <Button variant="outline" size="md" fullWidth>Zaloguj</Button>
                </Link>
                <Link to="/rejestracja" onClick={closeMobile}>
                  <Button variant="primary" size="md" fullWidth>Rejestracja</Button>
                </Link>
              </div>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
