import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { GlassCard } from '../components/ui/GlassCard';
import { profileService } from '../services/profile.service';
import { useAuthStore } from '../store/auth.store';

const steps = [
  {
    title: 'Aqui puedes hablar sin juicio',
    text: 'Este espacio esta pensado para acompanar, no para exigirte. Puedes llegar como estes hoy.',
  },
  {
    title: 'Tu espacio es seguro',
    text: 'Tus conversaciones y preferencias se cuidan como parte de un refugio digital mas intimo y sereno.',
  },
  {
    title: 'Tu marcas el ritmo',
    text: 'Puedes conversar, respirar, volver mas tarde y adaptar la experiencia a tu sensibilidad.',
  },
];

export function OnboardingScreen() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const [current, setCurrent] = useState(0);
  const [saving, setSaving] = useState(false);
  const step = useMemo(() => steps[current], [current]);

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
        // La experiencia no debe romperse si el perfil aun no existe.
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
          <div className="inline-flex h-20 w-20 items-center justify-center rounded-[32px] bg-[linear-gradient(135deg,rgba(255,255,255,0.84),rgba(255,239,248,0.72))] text-3xl shadow-[0_24px_45px_rgba(125,98,200,0.18)]">
            {current === 0 ? '🌙' : current === 1 ? '🫶' : '✨'}
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-[var(--text-muted)]">Onboarding emocional</p>
            <h1 className="mt-3 text-[32px] font-semibold leading-[1.02] tracking-[-0.06em] text-[var(--text-main)]">
              {step.title}
            </h1>
            <p className="mt-3 text-[15px] leading-7 text-[var(--text-soft)]">{step.text}</p>
          </div>
        </div>

        <div className="mt-10 flex gap-3">
          {current > 0 ? (
            <Button variant="secondary" fullWidth onClick={() => setCurrent((value) => value - 1)}>
              Atras
            </Button>
          ) : null}
          {current < steps.length - 1 ? (
            <Button fullWidth onClick={() => setCurrent((value) => value + 1)}>
              Continuar
            </Button>
          ) : (
            <Button fullWidth disabled={saving} onClick={finish}>
              {saving ? 'Guardando...' : 'Entrar a mi espacio'}
            </Button>
          )}
        </div>
      </GlassCard>
    </div>
  );
}
