import { BookHeart, Feather, MoonStar, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { useI18n } from '../i18n/I18nProvider';

export function WelcomeScreen() {
  const { t } = useI18n();

  const supportItems = [
    { icon: MoonStar, title: t.home.checkInTitle, text: t.landing.howItems[0] },
    { icon: Feather, title: t.home.talkNow, text: t.landing.howItems[1] },
    { icon: Sparkles, title: t.home.summary, text: t.landing.howItems[2] },
  ];

  return (
    <div className="safe-top flex min-h-svh flex-col justify-between py-6">
      <div className="space-y-6">
        <div className="book-shell relative overflow-hidden rounded-[44px] px-5 py-6 shadow-[0_38px_98px_rgba(101,69,168,0.24)] md:px-6">
          <div className="rounded-[36px] bg-[linear-gradient(180deg,rgba(255,245,238,0.98),rgba(255,228,214,0.86))] px-5 py-7 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.58),inset_-18px_0_36px_rgba(215,147,99,0.1)] md:px-8 md:py-9">
            <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-[22px] bg-[var(--gradient-main)] text-white shadow-[0_22px_38px_rgba(112,51,255,0.32)]">
              <BookHeart size={24} />
            </div>
            <h1 className="mx-auto mt-7 max-w-[13ch] text-[34px] font-semibold leading-[1.02] tracking-normal text-[var(--text-main)] md:max-w-none md:text-[48px]">
              {t.landing.title}
            </h1>
            <p className="mx-auto mt-6 max-w-sm text-[17px] font-medium leading-7 text-[var(--text-main)]">
              {t.landing.subtitle}
            </p>
            <p className="mx-auto mt-2 max-w-sm text-[15px] leading-6 text-[var(--text-soft)]">
              {t.landing.routineText}
            </p>
            <div className="mx-auto mt-8 max-w-sm space-y-4">
              <Link to="/register" className="block">
                <Button
                  fullWidth
                  className="min-h-15 rounded-[28px] bg-[linear-gradient(135deg,#5f2fff_0%,#ec6d56_62%,#ffb84d_100%)] px-7 py-4 text-base shadow-[0_26px_54px_rgba(236,109,86,0.36)]"
                >
                  {t.landing.primary}
                </Button>
              </Link>
              <p className="text-center text-sm text-[var(--text-soft)]">
                {t.landing.secondaryPrefix}{' '}
                <Link to="/login" className="font-semibold text-[var(--brand-royal)] underline decoration-[rgba(112,70,184,0.28)] underline-offset-4">
                  {t.landing.secondary}
                </Link>
              </p>
            </div>
          </div>
        </div>

        <section className="rounded-[32px] border border-white/60 bg-white/58 px-5 py-5 shadow-[0_22px_46px_rgba(101,69,168,0.12)] backdrop-blur-xl">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--brand-royal)]">
              {t.landing.routineTitle}
            </h2>
            <Sparkles size={17} className="shrink-0 text-[var(--brand-deep)]" />
          </div>
          <div className="mt-5 space-y-4">
            {supportItems.map(({ icon: Icon, title, text }) => (
              <div key={title} className="flex items-start gap-3">
                <div className="mt-0.5 rounded-[18px] bg-[linear-gradient(135deg,rgba(154,112,255,0.16),rgba(255,173,128,0.18))] p-2.5 text-[var(--brand-deep)]">
                  <Icon size={17} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[var(--text-main)]">{title}</p>
                  <p className="mt-1 text-sm leading-6 text-[var(--text-muted)]">{text}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <p className="mt-8 text-center text-xs text-[var(--text-muted)]">
        {t.landing.supportNote}
      </p>
    </div>
  );
}
