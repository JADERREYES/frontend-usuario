import { Info, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { GlassCard } from '../components/ui/GlassCard';
import { ScreenHeader } from '../components/ui/ScreenHeader';
import { useAuthStore } from '../store/auth.store';

export function PrivacySecurityScreen() {
  const navigate = useNavigate();
  const logout = useAuthStore((state) => state.logout);
  const sessionStartedAt = localStorage.getItem('user_session_started_at');

  return (
    <div className="space-y-4">
      <ScreenHeader
        title="Privacidad y seguridad"
        subtitle="Informacion clara sobre tu sesion con una presentacion mas premium y serena."
        backTo="/profile"
      />

      <GlassCard className="aurora-panel premium-card rounded-[36px]">
        <div className="flex items-center gap-3">
          <div className="rounded-[22px] bg-[linear-gradient(135deg,rgba(156,112,255,0.16),rgba(255,173,128,0.18))] p-3 text-[var(--brand-deep)]">
            <ShieldCheck size={18} />
          </div>
          <div>
            <p className="text-sm font-semibold text-[var(--text-main)]">Sesion actual</p>
            <p className="mt-1 text-sm leading-6 text-[var(--text-muted)]">
              {sessionStartedAt
                ? `Activa desde ${new Date(sessionStartedAt).toLocaleString()}`
                : 'Sesion iniciada en este dispositivo.'}
            </p>
          </div>
        </div>
      </GlassCard>

      <GlassCard className="premium-card rounded-[32px] space-y-3">
        <p className="text-sm font-semibold text-[var(--text-main)]">Buenas practicas</p>
        <ul className="space-y-2 text-sm leading-7 text-[var(--text-soft)]">
          <li>Usa una contrasena unica para tu cuenta.</li>
          <li>Cierra sesion si compartes este dispositivo.</li>
          <li>Evita guardar datos sensibles en mensajes si no te sientes comoda haciendolo.</li>
        </ul>
      </GlassCard>

      <GlassCard className="premium-card rounded-[32px] space-y-3">
        <div className="flex items-start gap-3">
          <Info size={16} className="mt-1 text-[var(--brand-deep)]" />
          <p className="text-sm leading-7 text-[var(--text-soft)]">
            El cierre global de sesiones aun no esta disponible. Mientras tanto, puedes cerrar esta sesion local de forma segura desde aqui.
          </p>
        </div>
        <Button
          fullWidth
          variant="secondary"
          onClick={() => {
            logout();
            navigate('/login', { replace: true });
          }}
        >
          Cerrar sesion en este dispositivo
        </Button>
      </GlassCard>
    </div>
  );
}
