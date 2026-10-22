import type { ReactNode } from 'react';
import NavBar from './NavBar';
import Footer from './Footer';

interface PageLayoutProps {
  children: ReactNode;
  /** Wyśrodkuj treść pionowo i poziomo (domyślnie true) */
  centered?: boolean;
}

export default function PageLayout({ children, centered = true }: PageLayoutProps) {
  return (
    <div className="min-h-screen bg-white text-blue-900 font-sans flex flex-col relative overflow-x-hidden z-0">

      {/* Dekoracyjne plamy w tle */}
      <div className="fixed top-1/3 -translate-y-1/2 -left-32 w-80 h-80 bg-[#fca55d] rounded-full -z-10 pointer-events-none" />
      <div className="fixed -top-32 -right-32 w-96 h-96 bg-[#fca55d] rounded-full -z-10 pointer-events-none" />
      <div className="fixed -bottom-40 left-2/3 -translate-x-1/2 w-[28rem] h-[28rem] bg-[#fca55d] rounded-full -z-10 pointer-events-none" />

      {/* Nawigacja */}
      <NavBar />

      {/* Treść strony */}
      <main
        className={`flex-1 z-10 ${
          centered
            ? 'flex items-center justify-center p-8'
            : 'p-8'
        }`}
      >
        {children}
      </main>

      {/* Stopka */}
      <Footer />
    </div>
  );
}

