import { BookHeart, Feather, MoonStar, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { GlassCard } from '../components/ui/GlassCard';

export function WelcomeScreen() {
  return (
    <div className="safe-top flex min-h-svh flex-col justify-between py-6">
      <div className="space-y-6">
        <div className="book-shell relative overflow-hidden rounded-[44px] px-5 py-5 shadow-[0_38px_98px_rgba(101,69,168,0.26)] [animation:book-float_6.4s_ease-in-out_infinite]">
          <div className="absolute inset-y-5 left-1/2 w-px -translate-x-1/2 bg-[linear-gradient(180deg,rgba(112,51,255,0.02),rgba(112,51,255,0.32),rgba(112,51,255,0.04))]" />
          <div className="absolute -left-10 top-10 h-32 w-32 rounded-full bg-[rgba(255,162,92,0.34)] blur-3xl" />
          <div className="absolute -right-6 bottom-10 h-28 w-28 rounded-full bg-[rgba(76,191,255,0.28)] blur-3xl" />

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-[36px] bg-[linear-gradient(180deg,rgba(255,245,238,0.98),rgba(255,228,214,0.86))] p-5 shadow-[inset_-18px_0_36px_rgba(215,147,99,0.12)]">
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-[22px] bg-[var(--gradient-main)] text-white shadow-[0_22px_38px_rgba(112,51,255,0.32)]">
                <BookHeart size={24} />
              </div>
              <p className="mt-8 text-xs uppercase tracking-[0.24em] text-[var(--text-muted)]">Refugio emocional</p>
              <h1 className="mt-3 text-[38px] font-semibold leading-[0.98] tracking-[-0.07em] text-[var(--text-main)]">
                Un libro vivo para volver a ti.
              </h1>
              <p className="mt-4 text-[15px] leading-7 text-[var(--text-soft)]">
                Una entrada cálida, íntima y móvil para hablar con suavidad, respirar y guardar tus momentos con belleza.
              </p>
            </div>

            <div className="rounded-[36px] bg-[linear-gradient(180deg,rgba(242,229,255,0.98),rgba(221,242,255,0.9))] p-5 shadow-[inset_18px_0_36px_rgba(90,114,208,0.1)]">
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-white/78 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--brand-royal)] shadow-[0_12px_20px_rgba(112,70,184,0.1)]">
                  Premium calma
                </span>
                <Sparkles size={18} className="text-[var(--brand-deep)]" />
              </div>
              <div className="mt-8 space-y-3">
                {[
                  { icon: MoonStar, title: 'Check-ins suaves', text: 'Detecta tu energía sin frialdad ni ruido.' },
                  { icon: Feather, title: 'Chat aurora', text: 'Una conversación cálida con presencia visual.' },
                  { icon: Sparkles, title: 'Resumen y prácticas', text: 'Tu refugio crece con recordatorios y memoria.' },
                ].map(({ icon: Icon, title, text }) => (
                  <div key={title} className="rounded-[24px] bg-white/72 px-4 py-4 shadow-[0_18px_30px_rgba(109,74,176,0.12)]">
                    <div className="flex items-start gap-3">
                      <div className="rounded-[18px] bg-[linear-gradient(135deg,rgba(154,112,255,0.18),rgba(255,173,128,0.2))] p-3 text-[var(--brand-deep)]">
                        <Icon size={18} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[var(--text-main)]">{title}</p>
                        <p className="mt-1 text-sm leading-6 text-[var(--text-muted)]">{text}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <GlassCard className="premium-card rounded-[34px] px-5 py-5">
          <p className="text-sm leading-7 text-[var(--text-soft)]">
            Diseñado para sentirse como un refugio emocional premium: más color, más calidez y más presencia visual sin perder claridad.
          </p>
          <div className="mt-5 flex flex-col gap-3">
            <Link to="/register">
              <Button fullWidth>Comenzar mi refugio</Button>
            </Link>
            <Link to="/login">
              <Button variant="secondary" fullWidth>
                Entrar a mi libro
              </Button>
            </Link>
          </div>
        </GlassCard>
      </div>

      <p className="mt-8 text-center text-xs text-[var(--text-muted)]">
        Esta experiencia acompaña, pero no sustituye apoyo profesional en crisis.
      </p>
    </div>
  );
}
