import { useEffect, useState } from 'react';
import { BellRing, Pencil, Plus, Trash2 } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { GlassCard } from '../components/ui/GlassCard';
import { ScreenHeader } from '../components/ui/ScreenHeader';
import { remindersService } from '../services/reminders.service';
import type { ReminderItem } from '../types/reminder';

const initialForm: Omit<ReminderItem, '_id' | 'createdAt'> = {
  title: '',
  description: '',
  frequency: 'daily',
  time: '08:00',
  enabled: true,
  tone: 'gentle',
};

export function RemindersScreen() {
  const [items, setItems] = useState<ReminderItem[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(initialForm);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const load = async () => {
    try {
      const data = await remindersService.getAll();
      setItems(data);
      setError('');
    } catch {
      setError('No pudimos cargar tus recordatorios.');
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const submit = async () => {
    try {
      setError('');
      if (editingId) {
        await remindersService.update(editingId, form);
        setMessage('Recordatorio actualizado.');
      } else {
        await remindersService.create(form);
        setMessage('Recordatorio creado.');
      }
      setForm(initialForm);
      setEditingId(null);
      await load();
    } catch {
      setMessage('No pudimos guardar el recordatorio.');
    }
  };

  return (
    <div className="space-y-4">
      <ScreenHeader
        title="Recordatorios suaves"
        subtitle="Recordatorios bonitos, claros y editables para sostener tu ritmo emocional."
        backTo="/profile"
      />

      <GlassCard className="premium-card rounded-[34px] space-y-4">
        <div className="flex items-center gap-3">
          <div className="rounded-[22px] bg-[linear-gradient(135deg,rgba(156,112,255,0.16),rgba(255,173,128,0.18))] p-3 text-[var(--brand-deep)]">
            <Plus size={18} />
          </div>
          <p className="text-sm font-semibold text-[var(--text-main)]">
            {editingId ? 'Editar recordatorio' : 'Nuevo recordatorio'}
          </p>
        </div>
        <input
          value={form.title}
          onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
          placeholder="Titulo"
          className="w-full rounded-[24px] bg-white/74 px-4 py-3 text-sm outline-none"
        />
        <input
          value={form.description}
          onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
          placeholder="Descripcion breve"
          className="w-full rounded-[24px] bg-white/74 px-4 py-3 text-sm outline-none"
        />
        <div className="grid grid-cols-2 gap-3">
          <select
            value={form.frequency}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                frequency: event.target.value as ReminderItem['frequency'],
              }))
            }
            className="rounded-[24px] bg-white/74 px-4 py-3 text-sm outline-none"
          >
            <option value="daily">Diario</option>
            <option value="weekly">Semanal</option>
            <option value="custom">Personalizado</option>
          </select>
          <input
            type="time"
            value={form.time}
            onChange={(event) => setForm((current) => ({ ...current, time: event.target.value }))}
            className="rounded-[24px] bg-white/74 px-4 py-3 text-sm outline-none"
          />
        </div>
        <label className="flex items-center justify-between rounded-[24px] bg-white/68 px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.34)]">
          <span className="text-sm text-[var(--text-main)]">Activo</span>
          <input
            type="checkbox"
            checked={form.enabled}
            onChange={(event) => setForm((current) => ({ ...current, enabled: event.target.checked }))}
          />
        </label>
        <Button fullWidth onClick={() => void submit()}>
          {editingId ? 'Guardar cambios' : 'Crear recordatorio'}
        </Button>
        {message ? <p className="text-sm text-[var(--text-muted)]">{message}</p> : null}
        {error ? <p className="text-sm text-rose-500">{error}</p> : null}
      </GlassCard>

      <div className="space-y-3">
        {items.map((item) => (
          <GlassCard key={item._id} className="premium-card rounded-[30px] space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-[var(--text-main)]">{item.title}</p>
                <p className="mt-1 text-sm text-[var(--text-muted)]">
                  {item.time} Â· {item.frequency} Â· {item.enabled ? 'activo' : 'pausado'}
                </p>
              </div>
              <BellRing size={18} className="text-[var(--brand-deep)]" />
            </div>
            {item.description ? <p className="text-sm text-[var(--text-soft)]">{item.description}</p> : null}
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  setEditingId(item._id);
                  setForm({
                    title: item.title,
                    description: item.description ?? '',
                    frequency: item.frequency ?? 'daily',
                    time: item.time,
                    enabled: item.enabled,
                    tone: item.tone ?? 'gentle',
                  });
                }}
                className="inline-flex items-center gap-2 rounded-full bg-white/72 px-4 py-2 text-sm text-[var(--text-main)]"
              >
                <Pencil size={14} />
                Editar
              </button>
              <button
                type="button"
                onClick={async () => {
                  try {
                    await remindersService.update(item._id, { enabled: !item.enabled });
                    await load();
                  } catch {
                    setError('No pudimos actualizar este recordatorio.');
                  }
                }}
                className="rounded-full bg-white/72 px-4 py-2 text-sm text-[var(--text-main)]"
              >
                {item.enabled ? 'Desactivar' : 'Activar'}
              </button>
              <button
                type="button"
                onClick={async () => {
                  try {
                    await remindersService.remove(item._id);
                    await load();
                  } catch {
                    setError('No pudimos eliminar este recordatorio.');
                  }
                }}
                className="inline-flex items-center gap-2 rounded-full bg-white/72 px-4 py-2 text-sm text-rose-500"
              >
                <Trash2 size={14} />
                Eliminar
              </button>
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}
