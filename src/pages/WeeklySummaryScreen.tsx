import { useEffect, useState } from 'react';
import { Award, CalendarHeart, SmilePlus } from 'lucide-react';
import { GlassCard } from '../components/ui/GlassCard';
import { ScreenHeader } from '../components/ui/ScreenHeader';
import { profileService } from '../services/profile.service';
import type { WeeklySummary } from '../types/profile';

export function WeeklySummaryScreen() {
  const [summary, setSummary] = useState<WeeklySummary | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const data = await profileService.getWeeklySummary();
        setSummary(data);
        setError('');
      } catch {
        setError('No pudimos cargar tu resumen semanal.');
      }
    };

    void load();
  }, []);

  return (
    <div className="space-y-4">
      <ScreenHeader
        title="Resumen semanal"
        subtitle="Una lectura emocional con mas presencia visual, color y claridad."
        backTo="/home"
      />

      <GlassCard className="aurora-panel premium-card rounded-[36px]">
        <p className="text-sm font-semibold text-[var(--text-main)]">Tu semana, en un tono amable</p>
        <p className="mt-3 text-sm leading-7 text-[var(--text-muted)]">
          {summary?.highlights?.[0] ?? 'Aun no hay suficientes registros para construir tu resumen.'}
        </p>
      </GlassCard>

      {error ? <p className="text-sm text-rose-500">{error}</p> : null}

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { icon: SmilePlus, value: summary?.dominantMood ?? 'Sin datos', label: 'Emocion mas frecuente' },
          { icon: CalendarHeart, value: summary?.selfCareDays ?? 0, label: 'Dias de autocuidado' },
          { icon: Award, value: summary?.totalCheckIns ?? 0, label: 'Registros totales' },
        ].map(({ icon: Icon, value, label }) => (
          <GlassCard key={label} className="premium-card rounded-[30px] text-center">
            <Icon className="mx-auto text-[var(--brand-deep)]" size={20} />
            <p className="mt-3 text-sm font-semibold text-[var(--text-main)]">{value}</p>
            <p className="mt-1 text-xs text-[var(--text-muted)]">{label}</p>
          </GlassCard>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <GlassCard className="premium-card rounded-[30px]">
          <p className="text-xs uppercase tracking-[0.16em] text-[var(--text-muted)]">Conversaciones activas</p>
          <p className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-[var(--text-main)]">{summary?.conversationsThisWeek ?? 0}</p>
          <p className="mt-2 text-sm text-[var(--text-soft)]">Conversaciones abiertas o retomadas durante los ultimos siete dias.</p>
        </GlassCard>
        <GlassCard className="premium-card rounded-[30px]">
          <p className="text-xs uppercase tracking-[0.16em] text-[var(--text-muted)]">Recordatorios activos</p>
          <p className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-[var(--text-main)]">{summary?.activeReminders ?? 0}</p>
          <p className="mt-2 text-sm text-[var(--text-soft)]">Pequenos anclajes que siguen acompanandote hoy.</p>
        </GlassCard>
      </div>

      <GlassCard className="premium-card rounded-[32px]">
        <p className="text-sm font-semibold text-[var(--text-main)]">Momentos recientes</p>
        <div className="mt-4 space-y-3">
          {summary?.recentCheckIns?.length ? (
            summary.recentCheckIns.map((entry, index) => (
              <div key={`${entry.createdAt}-${index}`} className="rounded-[24px] bg-white/62 px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.34)]">
                <p className="text-sm font-medium text-[var(--text-main)]">{entry.mood}</p>
                <p className="mt-1 text-xs text-[var(--text-muted)]">
                  {entry.energy ?? 'steady'} Â· {new Date(entry.createdAt).toLocaleString()}
                </p>
                {entry.note ? <p className="mt-2 text-sm text-[var(--text-soft)]">{entry.note}</p> : null}
              </div>
            ))
          ) : (
            <p className="text-sm text-[var(--text-muted)]">Todavia no hay check-ins recientes.</p>
          )}
        </div>
      </GlassCard>
    </div>
  );
}
