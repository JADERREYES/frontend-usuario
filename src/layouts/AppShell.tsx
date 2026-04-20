import { Bell } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { BottomNav } from '../components/ui/BottomNav';
import { useI18n } from '../i18n/I18nProvider';
import { chatService } from '../services/chat.service';
import type { UrgentNotificationItem } from '../types/chat';

export function AppShell() {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useI18n();
  const [urgentNotifications, setUrgentNotifications] = useState<UrgentNotificationItem[]>([]);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const titles: Record<string, string> = {
    '/home': t.shell.titles.home,
    '/chat': t.shell.titles.chat,
    '/history': t.shell.titles.history,
    '/profile': t.shell.titles.profile,
    '/personalization': t.shell.titles.personalization,
    '/reminders': t.shell.titles.reminders,
    '/subscription': t.shell.titles.subscription,
    '/weekly-summary': t.shell.titles.weeklySummary,
    '/privacy-security': t.shell.titles.privacySecurity,
    '/support': t.shell.titles.support,
  };

  const loadUrgentNotifications = async () => {
    try {
      const data = await chatService.getUrgentNotifications();
      setUrgentNotifications(data);
    } catch {
      setUrgentNotifications([]);
    }
  };

  useEffect(() => {
    void loadUrgentNotifications();

    const intervalId = window.setInterval(() => {
      void loadUrgentNotifications();
    }, 10000);

    return () => window.clearInterval(intervalId);
  }, []);

  const unreadCount = urgentNotifications.length;
  const topNotifications = useMemo(() => urgentNotifications.slice(0, 4), [urgentNotifications]);

  const openUrgentChat = async (chatId: string) => {
    await chatService.markUrgentNotificationsRead(chatId);
    await loadUrgentNotifications();
    setNotificationsOpen(false);
    navigate(`/chat?chatId=${chatId}`);
  };

  return (
    <div className="relative min-h-svh overflow-hidden px-4 pb-40 pt-6">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-2rem] top-[-2rem] h-52 w-52 rounded-full bg-[rgba(139,101,255,0.38)] blur-[90px]" />
        <div className="absolute right-[-3rem] top-28 h-52 w-52 rounded-full bg-[rgba(255,151,134,0.34)] blur-[90px]" />
        <div className="absolute bottom-20 left-8 h-52 w-52 rounded-full bg-[rgba(110,211,255,0.24)] blur-[90px]" />
        <div className="absolute inset-x-6 top-20 h-28 rounded-full bg-[linear-gradient(90deg,rgba(255,255,255,0.2),rgba(255,255,255,0.02),rgba(255,255,255,0.16))] blur-3xl" />
      </div>
      <main className="app-container relative">
        <div className="mb-6 flex items-start justify-between gap-4 px-1">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-[var(--text-muted)]">MenteAmiga AI</p>
            <h1 className="mt-2 text-[32px] font-semibold tracking-[-0.05em] text-[var(--text-main)]">
              {titles[location.pathname] ?? t.shell.fallbackTitle}
            </h1>
          </div>
          <div className="relative">
            <button
              type="button"
              onClick={() => setNotificationsOpen((current) => !current)}
              className="relative inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/60 bg-white/82 text-[var(--text-main)] shadow-[0_14px_28px_rgba(96,72,168,0.14)]"
            >
              <Bell size={18} />
              {unreadCount > 0 ? (
                <span className="absolute -right-1 -top-1 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
                  {unreadCount}
                </span>
              ) : null}
            </button>
            {notificationsOpen ? (
              <div className="absolute right-0 top-14 z-30 w-[min(22rem,calc(100vw-2rem))] rounded-[20px] border border-white/65 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(244,239,255,0.96))] p-3 shadow-[0_26px_50px_rgba(92,67,160,0.22)]">
                <p className="px-2 text-sm font-semibold text-[var(--text-main)]">Mensajes prioritarios</p>
                {topNotifications.length === 0 ? (
                  <p className="px-2 pb-1 pt-3 text-sm text-[var(--text-soft)]">
                    No tienes avisos urgentes pendientes.
                  </p>
                ) : (
                  <div className="mt-3 space-y-2">
                    {topNotifications.map((notification) => (
                      <button
                        key={notification._id ?? notification.id}
                        type="button"
                        onClick={() => void openUrgentChat(notification.chatId)}
                        className="w-full rounded-[16px] border border-[rgba(90,102,214,0.16)] bg-[rgba(237,244,255,0.9)] px-3 py-3 text-left"
                      >
                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[rgba(87,70,171,0.92)]">
                          Apoyo urgente
                        </p>
                        <p className="mt-1 line-clamp-3 text-sm leading-6 text-[var(--text-main)]">
                          {notification.content}
                        </p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
