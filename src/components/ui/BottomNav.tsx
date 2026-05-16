import { Heart, House, MessageCircleMore, Sparkles, UserRound } from 'lucide-react';
import { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { apiConfig, resolveApiAssetUrl } from '../../config/api';
import { useI18n } from '../../i18n/I18nProvider';
import type { UserProfile } from '../../types/profile';
import { cn } from '../../utils/cn';

export function BottomNav() {
  const { t } = useI18n();
  const [profile, setProfile] = useState<UserProfile | null>(() => {
    const raw = localStorage.getItem(apiConfig.storage.profileDetailsKey);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as UserProfile;
    } catch {
      return null;
    }
  });
  const [avatarImageFailed, setAvatarImageFailed] = useState(false);
  const items = [
    { to: '/home', label: t.shell.nav.home, icon: House },
    { to: '/chat', label: t.shell.nav.chat, icon: MessageCircleMore },
    { to: '/history', label: t.shell.nav.history, icon: Heart },
    { to: '/subscription', label: t.shell.nav.subscription, icon: Sparkles },
    { to: '/profile', label: t.shell.nav.profile, icon: UserRound },
  ];

  useEffect(() => {
    const syncProfile = () => {
      const raw = localStorage.getItem(apiConfig.storage.profileDetailsKey);
      if (!raw) {
        setProfile(null);
        setAvatarImageFailed(false);
        return;
      }

      try {
        setProfile(JSON.parse(raw) as UserProfile);
        setAvatarImageFailed(false);
      } catch {
        setProfile(null);
      }
    };

    syncProfile();
    window.addEventListener('focus', syncProfile);
    window.addEventListener('storage', syncProfile);
    window.addEventListener('menteamiga:profile-details-updated', syncProfile);

    return () => {
      window.removeEventListener('focus', syncProfile);
      window.removeEventListener('storage', syncProfile);
      window.removeEventListener('menteamiga:profile-details-updated', syncProfile);
    };
  }, []);

  const profileAvatarLabel =
    (profile?.displayName || 'M').trim().slice(0, 1).toUpperCase() || 'M';
  const profileAvatarSrc =
    !profile?.avatarUrl || avatarImageFailed
      ? ''
      : resolveApiAssetUrl(
          profile.avatarUrl,
          profile.updatedAt || profile.avatarSize || profile.avatarUrl.length,
        );

  return (
    <nav className="safe-bottom fixed inset-x-0 bottom-0 z-30 px-4" style={{ height: 'calc(var(--bottom-nav-height) + env(safe-area-inset-bottom))' }}>
      <div className="app-container">
        <div className="premium-card flex min-h-[var(--bottom-nav-height)] items-center justify-between rounded-[28px] border border-white/60 px-2 py-2 shadow-[0_22px_40px_rgba(90,60,160,0.16)]">
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
                      'inline-flex h-8 w-8 items-center justify-center overflow-hidden rounded-full transition',
                      isActive ? 'bg-white/18' : 'bg-transparent',
                    )}
                  >
                    {to === '/profile' && profileAvatarSrc ? (
                      <img
                        src={profileAvatarSrc}
                        alt="Avatar del usuario"
                        className="h-8 w-8 rounded-full object-cover"
                        onError={() => setAvatarImageFailed(true)}
                      />
                    ) : to === '/profile' ? (
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/80 text-[11px] font-semibold text-[var(--brand-deep)]">
                        {profileAvatarLabel}
                      </span>
                    ) : (
                      <Icon size={18} />
                    )}
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
