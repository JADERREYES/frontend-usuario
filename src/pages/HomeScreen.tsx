import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  HeartPulse,
  MessageCircleHeart,
  Sparkles,
  SunMedium,
  Waves,
} from 'lucide-react';
import { GlassCard } from '../components/ui/GlassCard';
import { profileService } from '../services/profile.service';
import { useAuthStore } from '../store/auth.store';
import type { WeeklySummary } from '../types/profile';

const emotions = [
  { mood: 'En calma', energy: 'steady', accent: 'from-[#6d5cff] to-[#51c3ff]' },
  { mood: 'Con carga', energy: 'low', accent: 'from-[#ff8e70] to-[#ffc05c]' },
  { mood: 'Bastante bien', energy: 'balanced', accent: 'from-[#3ea879] to-[#7ed7a2]' },
  { mood: 'Necesito pausa', energy: 'overwhelmed', accent: 'from-[#945dff] to-[#ff8a9a]' },
];

const quickLinks = [
  {
    to: '/chat',
    label: 'Hablar ahora',
    description: 'Ve directo al chat principal.',
    icon: MessageCircleHeart,
  },
  {
    to: '/weekly-summary',
    label: 'Ver resumen',
    description: 'Revisa tu lectura semanal.',
    icon: Sparkles,
  },
  {
    to: '/personalization',
    label: 'Ajustar estilo',
    description: 'Cambia colores y tono.',
    icon: Waves,
  },
];

export function HomeScreen() {
  const user = useAuthStore((state) => state.user);
  const [summary, setSummary] = useState<WeeklySummary | null>(null);
  const [savingMood, setSavingMood] = useState<string | null>(null);
  const [error, setError] = useState('');

  const loadSummary = async () => {
    try {
      const data = await profileService.getWeeklySummary();
      setSummary(data);
    } catch {
      setError('No pudimos cargar tu resumen por ahora.');
    }
  };

  useEffect(() => {
    void loadSummary();
  }, []);

  const saveCheckIn = async (mood: string, energy?: string) => {
    try {
      setSavingMood(mood);
      setError('');
      await profileService.createCheckIn({ mood, energy });
      await loadSummary();
    } catch {
      setError('No pudimos guardar tu check-in. Intenta nuevamente.');
    } finally {
      setSavingMood(null);
    }
  };

  const greetingName = useMemo(
    () => user?.name ?? user?.email?.split('@')[0] ?? 'tu',
    [user?.email, user?.name],
  );

  return (
    <div className="space-y-3 pb-2">
      <GlassCard className="aurora-panel premium-card rounded-[32px] border border-white/55 px-5 py-5 shadow-[0_28px_60px_rgba(98,62,171,0.18)]">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-[0.22em] text-[var(--text-muted)]">
              Hola, {greetingName}
            </p>
            <h2 className="mt-2 text-[26px] font-semibold leading-[1.02] tracking-[-0.06em] text-[var(--text-main)]">
              Un inicio mas claro, corto y util para hoy.
            </h2>
            <p className="mt-2 text-sm leading-6 text-[var(--text-soft)]">
              Registra como te sientes, entra al chat y revisa tu progreso sin perderte en bloques largos.
            </p>
          </div>
          <div className="rounded-[24px] bg-[linear-gradient(135deg,rgba(255,255,255,0.9),rgba(255,234,243,0.72))] p-3 text-[var(--brand-deep)] shadow-[0_18px_28px_rgba(112,74,181,0.14)]">
            <SunMedium size={20} />
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-[24px] bg-[linear-gradient(135deg,#6248ff,#44bfff)] px-4 py-4 text-white shadow-[0_18px_30px_rgba(90,84,208,0.22)]">
            <p className="text-[11px] uppercase tracking-[0.16em] text-white/70">Autocuidado</p>
            <p className="mt-1 text-2xl font-semibold tracking-[-0.04em]">
              {summary?.selfCareDays ?? 0}
            </p>
            <p className="mt-1 text-xs text-white/80">dias con registro</p>
          </div>
          <div className="rounded-[24px] bg-[linear-gradient(180deg,rgba(255,255,255,0.88),rgba(255,244,248,0.72))] px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.4)]">
            <p className="text-[11px] uppercase tracking-[0.16em] text-[var(--text-muted)]">Tono</p>
            <p className="mt-1 text-base font-semibold text-[var(--text-main)]">
              {summary?.dominantMood ?? 'Sin lectura aun'}
            </p>
            <p className="mt-1 text-xs leading-5 text-[var(--text-soft)]">
              {summary?.highlights?.[0] ?? 'Haz un check-in para activar tu lectura semanal.'}
            </p>
          </div>
        </div>
      </GlassCard>

      <GlassCard className="premium-card rounded-[30px] border border-white/55 px-4 py-4 shadow-[0_20px_40px_rgba(108,75,170,0.1)]">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-[var(--text-main)]">Check-in rapido</p>
            <p className="mt-1 text-xs leading-5 text-[var(--text-muted)]">
              Toca una opcion y guarda tu estado en segundos.
            </p>
          </div>
          <HeartPulse size={18} className="text-[var(--brand-deep)]" />
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {emotions.map((emotion) => (
            <button
              key={emotion.mood}
              type="button"
              onClick={() => void saveCheckIn(emotion.mood, emotion.energy)}
              disabled={savingMood === emotion.mood}
              className={`rounded-[22px] bg-gradient-to-br ${emotion.accent} px-3 py-3 text-left text-sm font-medium text-white shadow-[0_14px_22px_rgba(118,84,191,0.18)] transition active:scale-[0.98] disabled:opacity-60`}
            >
              {savingMood === emotion.mood ? 'Guardando...' : emotion.mood}
            </button>
          ))}
        </div>
      </GlassCard>

      <div className="grid grid-cols-1 gap-3">
        {quickLinks.map(({ to, label, description, icon: Icon }) => (
          <Link key={to} to={to}>
            <GlassCard className="premium-card flex items-center justify-between gap-3 rounded-[28px] border border-white/55 px-4 py-4 transition-transform duration-200 active:scale-[0.99]">
              <div className="flex min-w-0 items-center gap-3">
                <div className="rounded-[18px] bg-[linear-gradient(135deg,rgba(97,71,255,0.16),rgba(255,164,111,0.18))] p-3 text-[var(--brand-deep)]">
                  <Icon size={18} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[var(--text-main)]">{label}</p>
                  <p className="mt-1 truncate text-xs text-[var(--text-muted)]">{description}</p>
                </div>
              </div>
              <ArrowRight size={16} className="shrink-0 text-[var(--text-muted)]" />
            </GlassCard>
          </Link>
        ))}
      </div>

      {error ? <p className="px-1 text-sm text-rose-500">{error}</p> : null}
    </div>
  );
}
