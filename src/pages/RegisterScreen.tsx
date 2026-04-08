import { useState, type FormEvent } from 'react';
import { HeartHandshake, Sparkles, Stars } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useAuthStore } from '../store/auth.store';

export function RegisterScreen() {
  const navigate = useNavigate();
  const register = useAuthStore((state) => state.register);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedName = name.trim();

    if (!accepted) {
      setError('Necesitamos tu aceptacion para crear tu espacio.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await register({ name: normalizedName, email: normalizedEmail, password });
      navigate('/onboarding', { replace: true });
    } catch {
      setError('No pudimos crear tu cuenta por ahora. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="safe-top flex min-h-svh flex-col justify-center py-8">
      <div className="relative mx-auto w-full max-w-md overflow-hidden rounded-[42px] border border-white/55 bg-[var(--gradient-book)] p-4 shadow-[0_50px_110px_rgba(90,52,166,0.34)] [animation:book-float_6.6s_ease-in-out_infinite]">
        <div className="absolute inset-y-4 left-1/2 w-px -translate-x-1/2 bg-[linear-gradient(180deg,rgba(138,92,214,0.04),rgba(138,92,214,0.42),rgba(138,92,214,0.04))]" />
        <div className="absolute -left-12 top-8 h-36 w-36 rounded-full bg-[rgba(255,151,122,0.38)] blur-3xl" />
        <div className="absolute -right-10 bottom-8 h-36 w-36 rounded-full bg-[rgba(90,197,255,0.32)] blur-3xl" />
        <div className="absolute left-12 top-1/2 h-24 w-24 -translate-y-1/2 rounded-full bg-[rgba(180,120,255,0.18)] blur-3xl" />

        <div className="grid gap-4">
          <div className="rounded-[34px] border border-white/55 bg-[linear-gradient(180deg,rgba(255,248,240,0.98),rgba(255,229,214,0.9))] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.58),0_22px_40px_rgba(153,93,63,0.14)]">
            <div className="flex items-center justify-between">
              <span className="rounded-full bg-white/82 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--brand-royal)] shadow-[0_10px_18px_rgba(133,87,207,0.12)]">
                Primer capitulo
              </span>
              <HeartHandshake size={18} className="text-[var(--brand-deep)]" />
            </div>
            <h1 className="mt-5 text-[34px] font-semibold leading-[1] tracking-[-0.07em] text-[var(--text-main)]">
              Crea un refugio emocional con identidad propia.
            </h1>
            <p className="mt-3 text-sm leading-6 text-[var(--text-soft)]">
              Tu cuenta abre un espacio vivo: chat, resumenes, recordatorios y una estetica que se siente como un libro intimo.
            </p>
            <div className="mt-5 flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-[var(--brand-royal)]">
              <Sparkles size={14} />
              amable, memorable y movil
            </div>
          </div>

          <form
            className="rounded-[34px] border border-white/55 bg-[linear-gradient(180deg,rgba(240,225,255,0.98),rgba(221,241,255,0.9))] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.6),0_22px_38px_rgba(96,73,169,0.16)]"
            onSubmit={handleSubmit}
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-[var(--text-main)]">Crear cuenta</p>
              <Stars size={16} className="text-[var(--brand-deep)]" />
            </div>
            <div className="mt-4 space-y-4">
              <Input label="Nombre" autoComplete="name" placeholder="Como quieres que te llamemos" value={name} onChange={(event) => setName(event.target.value)} required />
              <Input label="Correo" type="email" autoComplete="email" placeholder="tu@correo.com" value={email} onChange={(event) => setEmail(event.target.value)} required />
              <Input
                label="Contrasena"
                type="password"
                autoComplete="new-password"
                placeholder="Minimo 6 caracteres"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                minLength={6}
                required
              />

              <label className="flex items-start gap-3 rounded-[24px] border border-white/55 bg-white/72 px-4 py-4 text-sm leading-6 text-[var(--text-soft)] shadow-[0_14px_26px_rgba(126,84,198,0.08)]">
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4 rounded border-white/70"
                  checked={accepted}
                  onChange={(event) => setAccepted(event.target.checked)}
                />
                <span>Acepto los terminos, la politica de privacidad y el uso responsable de esta experiencia.</span>
              </label>

              {error ? <p className="text-sm text-rose-500">{error}</p> : null}
              <Button type="submit" fullWidth disabled={loading}>
                {loading ? 'Preparando tu refugio...' : 'Crear mi refugio'}
              </Button>
            </div>
          </form>
        </div>
      </div>

      <p className="mt-5 text-center text-sm text-[var(--text-muted)]">
        Ya tienes cuenta?{' '}
        <Link className="font-semibold text-[var(--text-main)]" to="/login">
          Inicia sesion
        </Link>
      </p>
    </div>
  );
}
