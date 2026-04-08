import { useEffect, useState } from 'react';
import { LifeBuoy, Mail, MessageCircleQuestion } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { GlassCard } from '../components/ui/GlassCard';
import { ScreenHeader } from '../components/ui/ScreenHeader';
import { supportService, type SupportRequestItem } from '../services/support.service';

const faqs = [
  {
    question: 'Que puedo hacer aqui?',
    answer:
      'Puedes conversar con la IA, registrar como te sientes, revisar tu resumen semanal y ajustar tu espacio personal.',
  },
  {
    question: 'Esto reemplaza ayuda profesional?',
    answer:
      'No. MenteAmiga acompana, pero no reemplaza apoyo clinico o atencion de crisis.',
  },
  {
    question: 'Que pasa con mis datos?',
    answer:
      'Tu sesion y tus preferencias se guardan para sostener tu experiencia. Evita compartir datos sensibles si no deseas hacerlo.',
  },
];

export function SupportScreen() {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [requests, setRequests] = useState<SupportRequestItem[]>([]);
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState('');

  const load = async () => {
    try {
      const data = await supportService.getMine();
      setRequests(data);
      setError('');
    } catch {
      setError('No pudimos cargar tus solicitudes de soporte.');
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const submit = async () => {
    try {
      setError('');
      await supportService.create({ subject, message });
      setSubject('');
      setMessage('');
      setFeedback('Tu mensaje ya quedo enviado al equipo.');
      await load();
    } catch {
      setFeedback('No pudimos enviar tu mensaje por ahora.');
    }
  };

  return (
    <div className="space-y-4">
      <ScreenHeader
        title="Ayuda y soporte"
        subtitle="Un soporte claro, calido y mejor integrado con la nueva estetica."
        backTo="/profile"
      />

      <GlassCard className="aurora-panel premium-card rounded-[36px]">
        <div className="flex items-center gap-3">
          <div className="rounded-[22px] bg-[linear-gradient(135deg,rgba(156,112,255,0.16),rgba(255,173,128,0.18))] p-3 text-[var(--brand-deep)]">
            <LifeBuoy size={18} />
          </div>
          <div>
            <p className="text-sm font-semibold text-[var(--text-main)]">Necesitas ayuda con la app?</p>
            <p className="mt-1 text-sm leading-6 text-[var(--text-muted)]">Si algo no se ve bien o no responde como esperas, puedes escribirnos desde aqui.</p>
          </div>
        </div>
      </GlassCard>

      <GlassCard className="premium-card rounded-[32px] space-y-3">
        <p className="text-sm font-semibold text-[var(--text-main)]">Escribir a soporte</p>
        <input
          value={subject}
          onChange={(event) => setSubject(event.target.value)}
          placeholder="Asunto"
          className="w-full rounded-[24px] bg-white/74 px-4 py-3 text-sm outline-none"
        />
        <textarea
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="Cuentanos que paso"
          className="min-h-28 w-full rounded-[24px] bg-white/74 px-4 py-3 text-sm outline-none"
        />
        <Button fullWidth onClick={() => void submit()} disabled={!subject.trim() || !message.trim()}>
          Enviar mensaje
        </Button>
        {feedback ? <p className="text-sm text-[var(--text-muted)]">{feedback}</p> : null}
        {error ? <p className="text-sm text-rose-500">{error}</p> : null}
      </GlassCard>

      <div className="space-y-3">
        {faqs.map((faq) => (
          <GlassCard key={faq.question} className="premium-card rounded-[30px]">
            <div className="flex items-start gap-3">
              <MessageCircleQuestion size={16} className="mt-1 text-[var(--brand-deep)]" />
              <div>
                <p className="text-sm font-semibold text-[var(--text-main)]">{faq.question}</p>
                <p className="mt-2 text-sm leading-6 text-[var(--text-soft)]">{faq.answer}</p>
              </div>
            </div>
          </GlassCard>
        ))}
      </div>

      <GlassCard className="premium-card rounded-[32px]">
        <div className="flex items-start gap-3">
          <Mail size={16} className="mt-1 text-[var(--brand-deep)]" />
          <div>
            <p className="text-sm font-semibold text-[var(--text-main)]">Tus solicitudes</p>
            <div className="mt-3 space-y-3">
              {requests.length > 0 ? (
                requests.map((request) => (
                  <div key={request._id} className="rounded-[24px] bg-white/64 px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.34)]">
                    <p className="text-sm font-medium text-[var(--text-main)]">{request.subject}</p>
                    <p className="mt-1 text-xs text-[var(--text-muted)]">
                      {request.status} Â· {new Date(request.createdAt).toLocaleString()}
                    </p>
                    <p className="mt-2 text-sm text-[var(--text-soft)]">{request.message}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm leading-6 text-[var(--text-soft)]">
                  Aun no has enviado solicitudes. Si prefieres, tambien puedes escribir a <span className="font-semibold">soporte@menteamiga.app</span>.
                </p>
              )}
            </div>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
