import { useEffect, useMemo, useState } from 'react';
import { Clock3, Heart, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { GlassCard } from '../components/ui/GlassCard';
import { chatService } from '../services/chat.service';
import type { ChatItem } from '../types/chat';

export function HistoryScreen() {
  const [query, setQuery] = useState('');
  const [items, setItems] = useState<ChatItem[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const data = await chatService.getChats();
        setItems(data);
      } catch {
        setError('No pudimos cargar tu historial por ahora.');
      }
    };

    void load();
  }, []);

  const filtered = useMemo(
    () => items.filter((item) => item.title.toLowerCase().includes(query.toLowerCase())),
    [items, query],
  );

  return (
    <div className="space-y-3">
      <GlassCard className="aurora-panel premium-card rounded-[30px] border border-white/55 px-5 py-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--text-muted)]">Conversaciones guardadas</p>
            <h2 className="mt-2 text-[24px] font-semibold tracking-[-0.05em] text-[var(--text-main)]">
              Retoma lo importante sin sentir una pantalla vacia.
            </h2>
            <p className="mt-2 text-sm leading-6 text-[var(--text-soft)]">
              Busca por tema, vuelve a una charla reciente o abre una conversación que te haya servido.
            </p>
          </div>
          <div className="rounded-[22px] bg-[linear-gradient(135deg,#6a4dff,#ff9a72)] p-3 text-white">
            <Clock3 size={18} />
          </div>
        </div>
      </GlassCard>

      <GlassCard className="premium-card flex items-center gap-3 rounded-[26px] border border-white/55 px-4 py-3">
        <Search size={16} className="text-[var(--text-muted)]" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar conversacion"
          className="w-full bg-transparent text-sm text-[var(--text-main)] outline-none"
        />
      </GlassCard>

      {error ? <p className="text-sm text-rose-500">{error}</p> : null}

      <div className="space-y-2">
        {filtered.map((chat, index) => (
          <Link key={chat._id ?? chat.id} to={`/chat?chatId=${chat._id ?? chat.id}`}>
            <GlassCard className="premium-card rounded-[26px] border border-white/55 px-4 py-4 transition-transform duration-200 active:scale-[0.99]">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[var(--text-main)]">{chat.title}</p>
                  <p className="mt-1 text-xs text-[var(--text-muted)]">
                    {chat.updatedAt ? `Actualizada ${new Date(chat.updatedAt).toLocaleDateString()}` : 'Conversacion guardada'}
                  </p>
                </div>
                <span className="rounded-full bg-white/78 px-2 py-1 text-[11px] text-[var(--text-soft)]">
                  #{index + 1}
                </span>
              </div>
            </GlassCard>
          </Link>
        ))}

        {filtered.length === 0 ? (
          <GlassCard className="premium-card rounded-[28px] border border-white/55 px-5 py-5">
            <div className="flex items-start gap-3">
              <div className="rounded-[18px] bg-[linear-gradient(135deg,rgba(104,77,255,0.16),rgba(255,160,109,0.18))] p-3 text-[var(--brand-deep)]">
                <Heart size={18} />
              </div>
              <div>
                <p className="text-sm font-semibold text-[var(--text-main)]">Tu historial aparecera aqui</p>
                <p className="mt-2 text-sm leading-6 text-[var(--text-soft)]">
                  Si todavia no hay muchas conversaciones, este espacio te ayudara a retomar temas que quieras seguir trabajando.
                </p>
              </div>
            </div>
          </GlassCard>
        ) : null}
      </div>
    </div>
  );
}
