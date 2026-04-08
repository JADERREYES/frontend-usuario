import { useState } from 'react';
import { BookOpenText, Sparkles } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import heroBook from '../assets/login-book-hero.png';
import { useAuthStore } from '../store/auth.store';

export function LoginScreen() {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');

    try {
      setLoading(true);
      await login({
        email: email.trim().toLowerCase(),
        password,
      });

      const onboardingSeen = localStorage.getItem('menteamiga_onboarding_seen');
      navigate(onboardingSeen ? '/home' : '/onboarding', { replace: true });
    } catch (requestError: any) {
      setError(requestError?.response?.data?.message || 'No pudimos iniciar sesion. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,#cab7ff_0%,#ffd2be_44%,#c7e5ff_100%)] px-4 py-8">
      <div className="mx-auto w-full max-w-md">
        <div className="relative">
          <div className="pointer-events-none absolute -left-8 top-8 h-28 w-28 rounded-full bg-[rgba(255,157,117,0.34)] blur-3xl" />
          <div className="pointer-events-none absolute -right-6 top-16 h-28 w-28 rounded-full bg-[rgba(93,197,255,0.3)] blur-3xl" />

          <div className="relative overflow-hidden rounded-[42px] border border-white/55 bg-[linear-gradient(180deg,rgba(255,255,255,0.22),rgba(255,255,255,0.08))] shadow-[0_38px_98px_rgba(101,69,168,0.3)]">
            <div className="absolute left-1/2 top-[8%] h-[74%] w-px -translate-x-1/2 bg-[linear-gradient(180deg,rgba(120,70,214,0.03),rgba(120,70,214,0.24),rgba(120,70,214,0.02))]" />
            <div className="absolute inset-x-0 top-0 h-32 bg-[linear-gradient(180deg,rgba(255,255,255,0.18),rgba(255,255,255,0))]" />
            <img
              src={heroBook}
              alt="Portada tipo libro de MenteAmiga"
              className="h-auto w-full object-cover [animation:book-float_6s_ease-in-out_infinite]"
            />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.1),transparent_34%),linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.14))]" />

            <div className="absolute left-5 top-5 rounded-full border border-white/50 bg-white/72 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--brand-royal)] shadow-[0_14px_24px_rgba(112,70,184,0.12)]">
              Libro refugio
            </div>
          </div>

          <div className="relative z-10 -mt-14 px-3">
            <form
              onSubmit={handleSubmit}
              className="rounded-[34px] border border-white/60 bg-[linear-gradient(180deg,rgba(255,255,255,0.88),rgba(255,241,248,0.76))] p-5 shadow-[0_32px_76px_rgba(103,71,170,0.22),inset_0_1px_0_rgba(255,255,255,0.58)] backdrop-blur-2xl"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--brand-royal)]">
                    Entrar a tu espacio
                  </p>
                  <h1 className="mt-2 text-[30px] font-semibold leading-[1.02] tracking-[-0.06em] text-[var(--text-main)]">
                    Abre el libro y vuelve a ti.
                  </h1>
                  <p className="mt-2 text-sm leading-6 text-[var(--text-soft)]">
                    Un acceso mas claro y mas premium, conectado con tu refugio visual desde el primer segundo.
                  </p>
                </div>
                <div className="rounded-[22px] bg-[linear-gradient(135deg,rgba(132,81,255,0.16),rgba(255,163,123,0.22))] p-3 text-[var(--brand-deep)]">
                  <BookOpenText size={20} />
                </div>
              </div>

              <div className="mt-5 space-y-3">
                <label className="block">
                  <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                    Correo
                  </span>
                  <input
                    type="email"
                    placeholder="tu@correo.com"
                    autoComplete="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="h-12 w-full rounded-[22px] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(255,245,250,0.84))] px-4 text-sm text-[var(--text-main)] outline-none shadow-[0_12px_24px_rgba(112,70,184,0.08)] placeholder:text-[var(--text-muted)]"
                    required
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                    Contrasena
                  </span>
                  <input
                    type="password"
                    placeholder="Tu clave segura"
                    autoComplete="current-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="h-12 w-full rounded-[22px] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(255,245,250,0.84))] px-4 text-sm text-[var(--text-main)] outline-none shadow-[0_12px_24px_rgba(112,70,184,0.08)] placeholder:text-[var(--text-muted)]"
                    required
                  />
                </label>
              </div>

              {error ? (
                <p className="mt-4 rounded-[20px] border border-rose-200/70 bg-white/80 px-4 py-3 text-sm text-rose-600 shadow-[0_10px_18px_rgba(114,77,177,0.06)]">
                  {error}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={loading}
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[linear-gradient(135deg,#7c49ff_0%,#ff8e6e_56%,#ffc15f_100%)] px-5 py-3.5 text-sm font-semibold text-white shadow-[0_20px_42px_rgba(255,138,109,0.38)] transition hover:scale-[1.01] disabled:opacity-60"
              >
                <Sparkles size={16} />
                {loading ? 'Entrando...' : 'Entrar a mi espacio'}
              </button>
            </form>
          </div>
        </div>

        <div className="mt-6 text-center text-sm text-[var(--text-soft)]">
          Aun no tienes cuenta?{' '}
          <Link to="/register" className="font-semibold text-[var(--brand-royal)]">
            Crear una
          </Link>
        </div>
      </div>
    </div>
  );
}
