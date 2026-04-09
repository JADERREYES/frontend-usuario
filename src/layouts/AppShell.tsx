import { Outlet, useLocation } from 'react-router-dom';
import { BottomNav } from '../components/ui/BottomNav';

const titles: Record<string, string> = {
  '/home': 'Tu refugio',
  '/chat': 'Conversar',
  '/history': 'Historial',
  '/profile': 'Perfil',
  '/personalization': 'Tu rincon',
  '/reminders': 'Recordatorios',
  '/subscription': 'Suscripcion',
  '/weekly-summary': 'Resumen semanal',
  '/privacy-security': 'Privacidad y seguridad',
  '/support': 'Ayuda y soporte',
};

export function AppShell() {
  const location = useLocation();

  return (
    <div className="relative min-h-svh overflow-hidden px-4 pb-40 pt-6">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-2rem] top-[-2rem] h-52 w-52 rounded-full bg-[rgba(139,101,255,0.38)] blur-[90px]" />
        <div className="absolute right-[-3rem] top-28 h-52 w-52 rounded-full bg-[rgba(255,151,134,0.34)] blur-[90px]" />
        <div className="absolute bottom-20 left-8 h-52 w-52 rounded-full bg-[rgba(110,211,255,0.24)] blur-[90px]" />
        <div className="absolute inset-x-6 top-20 h-28 rounded-full bg-[linear-gradient(90deg,rgba(255,255,255,0.2),rgba(255,255,255,0.02),rgba(255,255,255,0.16))] blur-3xl" />
      </div>
      <main className="app-container relative">
        <div className="mb-6 px-1">
          <p className="text-xs uppercase tracking-[0.24em] text-[var(--text-muted)]">MenteAmiga AI</p>
          <h1 className="mt-2 text-[32px] font-semibold tracking-[-0.05em] text-[var(--text-main)]">
            {titles[location.pathname] ?? 'Tu espacio'}
          </h1>
        </div>
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
