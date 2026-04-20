import { Heart, House, MessageCircleMore, Sparkles, UserRound } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useI18n } from '../../i18n/I18nProvider';
import { cn } from '../../utils/cn';

export function BottomNav() {
  const { t } = useI18n();
  const items = [
    { to: '/home', label: t.shell.nav.home, icon: House },
    { to: '/chat', label: t.shell.nav.chat, icon: MessageCircleMore },
    { to: '/history', label: t.shell.nav.history, icon: Heart },
    { to: '/subscription', label: t.shell.nav.subscription, icon: Sparkles },
    { to: '/profile', label: t.shell.nav.profile, icon: UserRound },
  ];

  return (
    <nav className="safe-bottom fixed inset-x-0 bottom-0 z-30 px-4">
      <div className="app-container">
        <div className="premium-card flex items-center justify-between rounded-[28px] border border-white/60 px-2 py-2 shadow-[0_22px_40px_rgba(90,60,160,0.16)]">
          {items.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  'flex min-w-0 flex-1 flex-col items-center gap-1 rounded-[20px] px-2 py-2 text-[11px] font-medium text-[var(--text-muted)] transition duration-200',
                  isActive &&
                    'bg-[linear-gradient(135deg,#5f46ff,#ff966f)] text-white shadow-[0_18px_28px_rgba(107,78,196,0.22)]',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={cn(
                      'inline-flex h-8 w-8 items-center justify-center rounded-full transition',
                      isActive ? 'bg-white/18' : 'bg-transparent',
                    )}
                  >
                    <Icon size={18} />
                  </span>
                  <span>{label}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  );
}
