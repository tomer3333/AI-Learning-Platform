import { Link, useLocation, useNavigate } from 'react-router-dom';
import { GraduationCap, ChevronRight } from 'lucide-react';

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const isHome = location.pathname === '/';

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* ── Top nav ── */}
      <header className="sticky top-0 z-10 border-b border-gray-200 bg-white/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3.5">
          {/* Right — brand (RTL: brand on right, back on left) */}
          <Link
            to="/"
            className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 transition-colors"
            aria-label="חזרה לדשבורד"
          >
            <GraduationCap size={22} />
            <span className="text-sm font-semibold text-gray-900 tracking-tight">
              מורה ערבית AI
            </span>
          </Link>

          {/* Left — back button */}
          {!isHome && (
            <button
              onClick={() => navigate(-1)}
              aria-label="חזרה"
              className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm text-gray-500 hover:bg-gray-100 hover:text-gray-800 transition-colors"
            >
              חזרה
              <ChevronRight size={16} />
            </button>
          )}
        </div>
      </header>

      {/* ── Page content ── */}
      <main>{children}</main>
    </div>
  );
}
