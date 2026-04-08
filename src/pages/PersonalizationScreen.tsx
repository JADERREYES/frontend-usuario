import { useEffect, useMemo, useState } from 'react';
import { BrushCleaning, Check, SlidersHorizontal } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { GlassCard } from '../components/ui/GlassCard';
import { ScreenHeader } from '../components/ui/ScreenHeader';
import { profileService } from '../services/profile.service';
import type { UserPreferences } from '../types/profile';

const palettes = [
  { id: 'aurora', label: 'Aurora', vibe: 'Brillante y emocional', colors: ['#6a4dff', '#ff8d68', '#4cc4ff'] },
  { id: 'sand', label: 'Sand', vibe: 'Neutro y elegante', colors: ['#2d3748', '#b8865a', '#f0d3a5'] },
  { id: 'forest', label: 'Forest', vibe: 'Sereno y profundo', colors: ['#245548', '#4d9f74', '#d7c68d'] },
  { id: 'ember', label: 'Ember', vibe: 'Calido con contraste', colors: ['#5d2f8d', '#d95959', '#f6b94b'] },
];

const backgrounds = ['mist', 'studio', 'nightfall', 'paper'];
const bubbleStyles = ['soft', 'clean', 'bold'];
const intensities = ['gentle', 'balanced', 'uplifting'];

export function PersonalizationScreen() {
  const [preferences, setPreferences] = useState<UserPreferences>({
    theme: 'light',
    language: 'es',
    notifications: true,
    palette: 'aurora',
    backgroundStyle: 'mist',
    bubbleStyle: 'soft',
    motivationalIntensity: 'balanced',
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const profile = await profileService.getMe();
        if (profile?.preferences) {
          setPreferences((current) => ({ ...current, ...profile.preferences }));
        }
      } catch {
        setError('No pudimos cargar tu configuracion actual.');
      }
    };

    void load();
  }, []);

  const save = async () => {
    try {
      setSaving(true);
      setMessage('');
      setError('');
      await profileService.upsertMe({ preferences });
      setMessage('Tu rincon personal ya quedo guardado.');
    } catch {
      setError('No pudimos guardar tus cambios por ahora.');
    } finally {
      setSaving(false);
    }
  };

  const activePalette = useMemo(
    () => palettes.find((palette) => palette.id === preferences.palette) ?? palettes[0],
    [preferences.palette],
  );

  return (
    <div className="space-y-3">
      <ScreenHeader
        title="Tu rincon personal"
        subtitle="Ajusta atmosfera, contraste y tono sin perder tiempo ni altura vertical."
        backTo="/profile"
      />

      <GlassCard className="premium-card rounded-[30px] border border-white/55 px-4 py-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-[var(--text-main)]">Paleta activa</p>
            <p className="mt-1 text-xs text-[var(--text-muted)]">{activePalette.vibe}</p>
          </div>
          <BrushCleaning size={18} className="text-[var(--brand-deep)]" />
        </div>
        <div className="mt-3 flex gap-2">
          {activePalette.colors.map((color) => (
            <span key={color} className="h-10 flex-1 rounded-[18px] shadow-[inset_0_1px_0_rgba(255,255,255,0.22)]" style={{ backgroundColor: color }} />
          ))}
        </div>
      </GlassCard>

      <div className="grid grid-cols-2 gap-3">
        {palettes.map((palette) => {
          const active = preferences.palette === palette.id;
          return (
            <button
              key={palette.id}
              type="button"
              onClick={() => setPreferences((current) => ({ ...current, palette: palette.id }))}
              className={`premium-card rounded-[26px] border px-3 py-3 text-left transition ${active ? 'border-[rgba(102,76,214,0.4)] shadow-[0_18px_32px_rgba(101,76,196,0.18)]' : 'border-white/55'}`}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-[var(--text-main)]">{palette.label}</p>
                {active ? <Check size={16} className="text-[var(--brand-deep)]" /> : null}
              </div>
              <p className="mt-1 text-[11px] leading-5 text-[var(--text-muted)]">{palette.vibe}</p>
              <div className="mt-3 flex gap-2">
                {palette.colors.map((color) => (
                  <span key={color} className="h-8 flex-1 rounded-[14px]" style={{ backgroundColor: color }} />
                ))}
              </div>
            </button>
          );
        })}
      </div>

      <GlassCard className="premium-card rounded-[30px] border border-white/55 px-4 py-4">
        <div className="flex items-center gap-2">
          <SlidersHorizontal size={16} className="text-[var(--brand-deep)]" />
          <p className="text-sm font-semibold text-[var(--text-main)]">Ajustes de experiencia</p>
        </div>

        <div className="mt-4 space-y-4">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-[var(--text-muted)]">Fondo</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {backgrounds.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setPreferences((current) => ({ ...current, backgroundStyle: option }))}
                  className={`rounded-full px-3 py-2 text-xs ${preferences.backgroundStyle === option ? 'bg-[var(--gradient-cool)] text-white' : 'bg-white/80 text-[var(--text-soft)]'}`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-[var(--text-muted)]">Burbujas</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {bubbleStyles.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setPreferences((current) => ({ ...current, bubbleStyle: option }))}
                  className={`rounded-full px-3 py-2 text-xs ${preferences.bubbleStyle === option ? 'bg-[var(--gradient-cool)] text-white' : 'bg-white/80 text-[var(--text-soft)]'}`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-[var(--text-muted)]">Intensidad</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {intensities.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setPreferences((current) => ({ ...current, motivationalIntensity: option }))}
                  className={`rounded-full px-3 py-2 text-xs ${preferences.motivationalIntensity === option ? 'bg-[var(--gradient-cool)] text-white' : 'bg-white/80 text-[var(--text-soft)]'}`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          <label className="flex items-center justify-between rounded-[20px] bg-white/74 px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.34)]">
            <span className="text-sm text-[var(--text-main)]">Recordatorios activos</span>
            <input
              type="checkbox"
              checked={preferences.notifications ?? true}
              onChange={(event) => setPreferences((current) => ({ ...current, notifications: event.target.checked }))}
            />
          </label>
        </div>

        <div className="mt-4 space-y-2">
          <Button fullWidth onClick={() => void save()} disabled={saving}>
            {saving ? 'Guardando...' : 'Guardar estilo'}
          </Button>
          {message ? <p className="text-sm text-[var(--text-muted)]">{message}</p> : null}
          {error ? <p className="text-sm text-rose-500">{error}</p> : null}
        </div>
      </GlassCard>
    </div>
  );
}
