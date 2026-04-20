import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { GlassCard } from '../components/ui/GlassCard';
import { useI18n } from '../i18n/I18nProvider';
import { profileService } from '../services/profile.service';
import { useAuthStore } from '../store/auth.store';

export function OnboardingScreen() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const user = useAuthStore((state) => state.user);
  const [current, setCurrent] = useState(0);
  const [saving, setSaving] = useState(false);
  const steps = t.onboarding.steps;
  const step = useMemo(() => steps[current], [current, steps]);

  const finish = async () => {
    localStorage.setItem('menteamiga_onboarding_seen', 'true');

    if (user) {
      try {
        setSaving(true);
        await profileService.upsertMe({
          displayName: user.name ?? user.email.split('@')[0],
          onboardingData: { completed: true, step: 3 },
        });
        await profileService.completeOnboarding();
      } catch {
        // The app should continue even if the profile endpoint is temporarily unavailable.
      } finally {
        setSaving(false);
      }
      navigate('/home', { replace: true });
      return;
    }

    navigate('/register', { replace: true });
  };

  return (
    <div className="safe-top flex min-h-svh flex-col justify-center py-8">
      <GlassCard className="aurora-panel premium-card mx-auto w-full max-w-md rounded-[42px] px-6 py-8">
        <div className="mb-6 flex gap-2">
          {steps.map((_, index) => (
            <span
              key={index}
              className={`h-2 flex-1 rounded-full ${index <= current ? 'bg-[var(--brand-deep)]' : 'bg-white/60'}`}
              style={index <= current ? { backgroundImage: 'var(--gradient-main)' } : undefined}
            />
          ))}
        </div>

        <div className="space-y-5">
          <div className="inline-flex h-20 w-20 items-center justify-center rounded-[32px] bg-[linear-gradient(135deg,rgba(255,255,255,0.84),rgba(255,239,248,0.72))] text-3xl font-semibold text-[var(--brand-deep)] shadow-[0_24px_45px_rgba(125,98,200,0.18)]">
            {current + 1}
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-[var(--text-muted)]">
              {t.onboarding.eyebrow}
            </p>
            <h1 className="mt-3 text-[32px] font-semibold leading-[1.02] tracking-[-0.06em] text-[var(--text-main)]">
              {step.title}
            </h1>
            <p className="mt-3 text-[15px] leading-7 text-[var(--text-soft)]">{step.text}</p>
            <p className="mt-4 rounded-[18px] bg-white/62 px-4 py-3 text-sm leading-6 text-[var(--text-muted)]">
              {t.onboarding.time}
            </p>
          </div>
        </div>

        <div className="mt-10 flex gap-3">
          {current > 0 ? (
            <Button variant="secondary" fullWidth onClick={() => setCurrent((value) => value - 1)}>
              {t.onboarding.previous}
            </Button>
          ) : null}
          {current < steps.length - 1 ? (
            <Button fullWidth onClick={() => setCurrent((value) => value + 1)}>
              {t.onboarding.next}
            </Button>
          ) : (
            <Button fullWidth disabled={saving} onClick={finish}>
              {saving ? t.onboarding.saving : t.onboarding.finish}
            </Button>
          )}
        </div>
      </GlassCard>
    </div>
  );
}
