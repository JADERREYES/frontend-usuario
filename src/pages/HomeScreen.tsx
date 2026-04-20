import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  HeartPulse,
  MessageCircleHeart,
  Sparkles,
  SunMedium,
} from 'lucide-react';
import { GlassCard } from '../components/ui/GlassCard';
import { useI18n } from '../i18n/I18nProvider';
import { profileService } from '../services/profile.service';
import { useAuthStore } from '../store/auth.store';
import type { WeeklySummary } from '../types/profile';

const emotionAccents = [
  'from-[#6d5cff] to-[#51c3ff]',
  'from-[#ff8e70] to-[#ffc05c]',
  'from-[#3ea879] to-[#7ed7a2]',
  'from-[#945dff] to-[#ff8a9a]',
  'from-[#596579] to-[#93a0b8]',
];

export function HomeScreen() {
  const { t } = useI18n();
  const user = useAuthStore((state) => state.user);
  const [summary, setSummary] = useState<WeeklySummary | null>(null);
  const [savingMood, setSavingMood] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [savedMessage, setSavedMessage] = useState('');

  const loadSummary = async () => {
    try {
      const data = await profileService.getWeeklySummary();
      setSummary(data);
    } catch {
      setError(t.home.summaryError);
    }
  };

  useEffect(() => {
    void loadSummary();
  }, []);

  const saveCheckIn = async (mood: string, energy?: string) => {
    try {
      setSavingMood(mood);
      setError('');
      setSavedMessage('');
      await profileService.createCheckIn({ mood, energy });
      await loadSummary();
      setSavedMessage(t.home.saved);
    } catch {
      setError(t.home.saveError);
    } finally {
      setSavingMood(null);
    }
  };

  const greetingName = useMemo(
    () => user?.name ?? user?.email?.split('@')[0] ?? 'tu',
    [user?.email, user?.name],
  );

  const hasCheckIns = (summary?.totalCheckIns ?? 0) > 0;
  const weeklyReading = summary?.dominantMood ?? t.home.noReading;
  const weeklyHint = summary?.highlights?.[0] ?? t.home.noReadingHint;

  return (
    <div className="space-y-5 pb-2">
      <div className="book-shell relative overflow-hidden rounded-[38px] px-4 py-4 shadow-[0_30px_72px_rgba(91,48,152,0.2)]">
        <div className="absolute inset-y-5 left-1/2 w-px -translate-x-1/2 bg-[linear-gradient(180deg,rgba(112,51,255,0.02),rgba(112,51,255,0.24),rgba(112,51,255,0.04))]" />
        <div className="relative space-y-3">
          <GlassCard className="aurora-panel rounded-[32px] border border-white/55 px-5 py-6 shadow-[0_24px_54px_rgba(98,62,171,0.16)]">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/80">
                  {t.home.hello}, {greetingName}
                </p>
                <h2 className="mt-3 text-[28px] font-semibold leading-[1.04] tracking-[-0.03em] text-white drop-shadow-sm">
                  {t.home.title}
                </h2>
                <p className="mt-3 max-w-sm text-sm leading-6 text-white/86">
                  {t.home.subtitle}
                </p>
              </div>
              <div className="rounded-[24px] bg-white/82 p-3 text-[var(--brand-deep)] shadow-[0_18px_28px_rgba(112,74,181,0.16)]">
                <SunMedium size={20} />
              </div>
            </div>

            <Link to="/chat" className="mt-5 flex items-center justify-between gap-3 rounded-[24px] bg-white/88 px-4 py-4 text-[var(--text-main)] shadow-[0_18px_32px_rgba(70,48,130,0.16)]">
              <div className="flex min-w-0 items-center gap-3">
                <div className="rounded-[18px] bg-[linear-gradient(135deg,rgba(97,71,255,0.18),rgba(255,164,111,0.22))] p-3 text-[var(--brand-deep)]">
                  <MessageCircleHeart size={19} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold">{t.home.talkNow}</p>
                  <p className="mt-1 text-xs leading-5 text-[var(--text-muted)]">{t.home.talkNowDesc}</p>
                </div>
              </div>
              <ArrowRight size={16} className="shrink-0 text-[var(--text-muted)]" />
            </Link>
          </GlassCard>
        </div>
      </div>

      <GlassCard className="premium-card rounded-[32px] border border-white/60 px-4 py-4 shadow-[0_26px_56px_rgba(108,75,170,0.16)]">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--brand-royal)]">
              Empieza por aqui
            </p>
            <p className="mt-2 text-lg font-semibold text-[var(--text-main)]">{t.home.checkInTitle}</p>
            <p className="mt-1 text-xs leading-5 text-[var(--text-muted)]">
              {t.home.recommendedText}
            </p>
          </div>
          <div className="rounded-[20px] bg-[linear-gradient(135deg,rgba(255,142,112,0.2),rgba(112,51,255,0.16))] p-3 text-[var(--brand-deep)]">
            <HeartPulse size={18} />
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2.5">
          {t.home.emotions.map((emotion, index) => (
            <button
              key={emotion.mood}
              type="button"
              onClick={() => void saveCheckIn(emotion.mood, emotion.energy)}
              disabled={savingMood === emotion.mood}
              className={`min-h-[92px] rounded-[24px] bg-gradient-to-br ${emotionAccents[index] ?? emotionAccents[0]} px-3 py-3 text-left text-sm font-medium text-white shadow-[0_16px_26px_rgba(118,84,191,0.2)] transition active:scale-[0.98] disabled:opacity-60`}
            >
              <span className="block">{savingMood === emotion.mood ? t.onboarding.saving : emotion.mood}</span>
              <span className="mt-1 block text-xs font-normal leading-4 text-white/84">{emotion.hint}</span>
            </button>
          ))}
        </div>
        {savedMessage ? (
          <p className="mt-4 rounded-[20px] border border-white/60 bg-white/76 px-4 py-3 text-sm leading-6 text-[var(--text-soft)]">
            {savedMessage}
          </p>
        ) : null}
      </GlassCard>

      <GlassCard className="premium-card rounded-[30px] border border-white/60 px-4 py-4 shadow-[0_22px_44px_rgba(108,75,170,0.12)]">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-[var(--text-main)]">{t.home.summary}</p>
            <p className="mt-1 text-xs leading-5 text-[var(--text-muted)]">
              {hasCheckIns ? t.home.summaryDesc : 'Cuando registres como llegas, aqui aparecera una lectura amable.'}
            </p>
          </div>
          <div className="rounded-[20px] bg-[linear-gradient(135deg,rgba(109,92,255,0.16),rgba(81,195,255,0.18))] p-3 text-[var(--brand-deep)]">
            <Sparkles size={18} />
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-[22px] bg-[linear-gradient(135deg,rgba(36,22,47,0.86),rgba(98,72,255,0.88))] px-4 py-4 text-white shadow-[0_16px_28px_rgba(65,45,130,0.2)]">
            <p className="text-[11px] uppercase tracking-[0.14em] text-white/70">Registros</p>
            <p className="mt-2 text-xl font-semibold tracking-[-0.02em]">
              {hasCheckIns ? summary?.selfCareDays : 'Sin prisa'}
            </p>
            <p className="mt-1 text-xs leading-5 text-white/78">
              {hasCheckIns ? t.home.selfCare : 'Tu primer check-in cuenta.'}
            </p>
          </div>
          <div className="rounded-[22px] bg-white/80 px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.46)]">
            <p className="text-[11px] uppercase tracking-[0.14em] text-[var(--text-muted)]">{t.home.tone}</p>
            <p className="mt-2 text-sm font-semibold text-[var(--text-main)]">{weeklyReading}</p>
            <p className="mt-1 text-xs leading-5 text-[var(--text-soft)]">{weeklyHint}</p>
          </div>
        </div>

        <Link to="/weekly-summary" className="mt-4 flex items-center justify-between rounded-[22px] bg-white/72 px-4 py-3 text-sm font-semibold text-[var(--brand-royal)]">
          <span>{t.home.summary}</span>
          <ArrowRight size={16} />
        </Link>
      </GlassCard>

      <div className="grid grid-cols-1 gap-3">
        <Link to="/personalization">
          <GlassCard className="premium-card relative overflow-hidden rounded-[28px] border border-white/60 px-4 py-4 transition-transform duration-200 active:scale-[0.99]">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[var(--text-main)]">{t.home.personalize}</p>
                <p className="mt-1 line-clamp-2 text-xs leading-5 text-[var(--text-muted)]">{t.home.personalizeDesc}</p>
              </div>
              <ArrowRight size={16} className="shrink-0 text-[var(--text-muted)]" />
            </div>
          </GlassCard>
        </Link>
      </div>

      {error ? <p className="px-1 text-sm text-rose-500">{error}</p> : null}
    </div>
  );
}
