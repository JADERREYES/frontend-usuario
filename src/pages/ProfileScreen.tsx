import { useEffect, useState, type FormEvent } from 'react';
import {
  Bell,
  LogOut,
  Palette,
  Repeat,
  ShieldCheck,
  Sparkles,
  UserRound,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { GlassCard } from '../components/ui/GlassCard';
import { Input } from '../components/ui/Input';
import { profileService } from '../services/profile.service';
import { useAuthStore } from '../store/auth.store';
import type { UserProfile } from '../types/profile';

const quickLinks = [
  { to: '/personalization', label: 'Personalizar', icon: Palette },
  { to: '/subscription', label: 'Premium', icon: Sparkles },
  { to: '/reminders', label: 'Recordatorios', icon: Bell },
  { to: '/weekly-summary', label: 'Resumen', icon: Repeat },
  { to: '/privacy-security', label: 'Privacidad', icon: ShieldCheck },
];

const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const resolveAssetUrl = (path?: string) => {
  if (!path) return '';
  if (/^https?:\/\//i.test(path)) {
    return path;
  }
  return `${apiBaseUrl}${path}`;
};

export function ProfileScreen() {
  const navigate = useNavigate();
  const logout = useAuthStore((state) => state.logout);
  const user = useAuthStore((state) => state.user);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [form, setForm] = useState({
    displayName: '',
    pronouns: '',
    bio: '',
  });
  const [message, setMessage] = useState('');
  const [avatarMessage, setAvatarMessage] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const data = await profileService.getMe();
        setProfile(data);
        setForm({
          displayName: data?.displayName ?? user?.name ?? '',
          pronouns: data?.pronouns ?? '',
          bio: data?.bio ?? '',
        });
      } catch {
        setProfile(null);
        setForm({
          displayName: user?.name ?? '',
          pronouns: '',
          bio: '',
        });
      }
    };

    void load();
  }, [user?.name]);

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      const updated = await profileService.upsertMe(form);
      setProfile(updated);
      setMessage('Tu perfil ya quedo actualizado.');
    } catch {
      setMessage('No pudimos guardar tu perfil.');
    }
  };

  return (
    <div className="space-y-3">
      <GlassCard className="aurora-panel premium-card rounded-[32px] border border-white/55 px-5 py-5">
        <div className="flex items-start gap-4">
          <div className="inline-flex h-18 w-18 shrink-0 items-center justify-center rounded-[26px] bg-[linear-gradient(135deg,rgba(255,255,255,0.92),rgba(255,240,247,0.78))] text-xl font-semibold text-[var(--brand-deep)] shadow-[0_18px_30px_rgba(126,84,198,0.14)]">
            {profile?.avatarUrl ? (
              <img
                src={resolveAssetUrl(profile.avatarUrl)}
                alt="Avatar"
                className="h-18 w-18 rounded-[26px] object-cover"
              />
            ) : (
              (profile?.displayName ?? user?.name ?? user?.email ?? 'M').slice(0, 1).toUpperCase()
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[24px] font-semibold tracking-[-0.05em] text-[var(--text-main)]">
                  {profile?.displayName ?? user?.name ?? 'Tu espacio personal'}
                </p>
                <p className="mt-1 truncate text-sm text-[var(--text-muted)]">{user?.email}</p>
              </div>
              <UserRound size={18} className="shrink-0 text-[var(--brand-deep)]" />
            </div>
            <p className="mt-3 text-sm leading-6 text-[var(--text-soft)]">
              {profile?.bio || 'Ajusta tu perfil, tu estilo y tus accesos sin tener que recorrer una pantalla larga.'}
            </p>
          </div>
        </div>

        <div className="mt-4 rounded-[22px] bg-white/74 px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.34)]">
          <p className="text-xs uppercase tracking-[0.14em] text-[var(--text-muted)]">Avatar</p>
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="mt-2 block w-full text-sm text-[var(--text-soft)]"
            onChange={async (event) => {
              const file = event.target.files?.[0];
              if (!file) return;
              try {
                const updated = await profileService.uploadAvatar(file);
                setProfile(updated);
                setAvatarMessage('Tu avatar ya quedo actualizado.');
              } catch {
                setAvatarMessage('No pudimos subir tu avatar.');
              }
            }}
          />
          {avatarMessage ? <p className="mt-2 text-sm text-[var(--text-muted)]">{avatarMessage}</p> : null}
        </div>
      </GlassCard>

      <div className="grid grid-cols-2 gap-2">
        {quickLinks.map(({ to, label, icon: Icon }) => (
          <Link key={to} to={to}>
            <GlassCard className="premium-card flex h-full items-center gap-3 rounded-[24px] border border-white/55 px-4 py-4 transition-transform duration-200 active:scale-[0.99]">
              <div className="rounded-[16px] bg-[linear-gradient(135deg,rgba(156,112,255,0.16),rgba(255,173,128,0.18))] p-2.5 text-[var(--brand-deep)]">
                <Icon size={16} />
              </div>
              <span className="text-sm font-medium text-[var(--text-main)]">{label}</span>
            </GlassCard>
          </Link>
        ))}
      </div>

      <GlassCard className="premium-card rounded-[28px] border border-white/55 px-4 py-4">
        <form className="space-y-3" onSubmit={save}>
          <p className="text-sm font-semibold text-[var(--text-main)]">Editar perfil</p>
          <div className="grid gap-3">
            <Input
              label="Nombre visible"
              value={form.displayName}
              onChange={(event) => setForm((current) => ({ ...current, displayName: event.target.value }))}
            />
            <Input
              label="Pronombres"
              value={form.pronouns}
              onChange={(event) => setForm((current) => ({ ...current, pronouns: event.target.value }))}
            />
            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium text-[var(--text-soft)]">Bio</span>
              <textarea
                value={form.bio}
                onChange={(event) => setForm((current) => ({ ...current, bio: event.target.value }))}
                className="min-h-24 rounded-[22px] border border-white/70 bg-white/78 px-4 py-3 text-[15px] text-[var(--text-main)] outline-none"
              />
            </label>
          </div>
          <Button
            type="submit"
            fullWidth
            className="min-h-14 bg-[linear-gradient(135deg,#4f36ff,#ff8a61)] text-[15px] font-bold text-white shadow-[0_24px_44px_rgba(101,70,214,0.34)]"
          >
            Guardar perfil
          </Button>
          {message ? <p className="text-sm text-[var(--text-muted)]">{message}</p> : null}
        </form>
      </GlassCard>

      <button
        type="button"
        onClick={() => {
          logout();
          navigate('/login', { replace: true });
        }}
        className="flex w-full items-center justify-center gap-2 rounded-full bg-white/78 px-5 py-3 text-sm font-semibold text-[var(--text-main)] shadow-[0_16px_28px_rgba(110,77,175,0.1)]"
      >
        <LogOut size={16} />
        Cerrar sesion
      </button>
    </div>
  );
}
