import { Link, useLocation } from 'react-router-dom';

export default function NavBar() {
  const location = useLocation();

  const getLinkClasses = (path: string) => {
    const isActive = location.pathname === path;
    return `font-bold px-4 py-2 rounded-xl transition-all duration-200 text-sm md:text-base ${
      isActive
        ? 'bg-blue-900 text-white shadow-[2px_2px_0px_0px_rgba(30,58,138,0.3)]'
        : 'text-blue-900 hover:bg-blue-100/60'
    }`;
  };

  return (
    <header className="w-full bg-white/90 backdrop-blur-sm border-b-4 border-blue-900 px-6 py-4 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        {/* Logo / Brand */}
        <Link to="/" className="flex items-center gap-3 group">
          <img 
            src="/logo.png" 
            alt="PJMatch" 
            className="w-9 h-9 object-contain"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
          <span className="text-2xl font-black text-blue-900 tracking-tight group-hover:text-blue-800 transition-colors">
            PJMatch
          </span>
        </Link>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-2 md:gap-4">
          <Link to="/nagraj" className={getLinkClasses('/nagraj')}>
            Nagraj zdanie
          </Link>
          <Link to="/komponenty" className={getLinkClasses('/komponenty')}>
            Komponenty
          </Link>
          <Link to="/" className={getLinkClasses('/')}>
            Logowanie
          </Link>
        </nav>
      </div>
    </header>
  );
}
