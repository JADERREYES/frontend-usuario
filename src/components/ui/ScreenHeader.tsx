import { ChevronLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

type ScreenHeaderProps = {
  title: string;
  subtitle?: string;
  backTo?: string;
};

export function ScreenHeader({ title, subtitle, backTo }: ScreenHeaderProps) {
  return (
    <div className="flex items-start gap-3">
      {backTo ? (
        <Link
          to={backTo}
          className="mt-1 inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/72 text-[var(--text-soft)] shadow-[0_16px_30px_rgba(113,80,178,0.12)] backdrop-blur-xl"
        >
          <ChevronLeft size={18} />
        </Link>
      ) : null}
      <div className="min-w-0">
        <p className="text-xs uppercase tracking-[0.24em] text-[var(--text-muted)]">MenteAmiga AI</p>
        <h1 className="mt-2 text-[30px] font-semibold tracking-[-0.04em] text-[var(--text-main)]">{title}</h1>
        {subtitle ? <p className="mt-2 max-w-md text-sm leading-6 text-[var(--text-muted)]">{subtitle}</p> : null}
      </div>
    </div>
  );
}
