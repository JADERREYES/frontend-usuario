import type { InputHTMLAttributes } from 'react';
import { cn } from '../../utils/cn';

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  hint?: string;
  error?: string;
};

export function Input({ label, hint, error, className, ...props }: InputProps) {
  return (
    <label className="flex flex-col gap-2.5">
      {label ? <span className="text-sm font-medium tracking-[0.01em] text-[var(--text-soft)]">{label}</span> : null}
      <input
        className={cn(
          'min-h-14 rounded-[26px] border border-white/70 bg-white/72 px-4 text-[15px] text-[var(--text-main)] outline-none backdrop-blur-xl transition placeholder:text-[var(--text-muted)] focus:border-[rgba(128,82,232,0.4)] focus:bg-white focus:shadow-[0_16px_30px_rgba(128,82,232,0.14)]',
          className,
        )}
        {...props}
      />
      {error ? <span className="text-xs text-rose-500">{error}</span> : null}
      {!error && hint ? <span className="text-xs text-[var(--text-muted)]">{hint}</span> : null}
    </label>
  );
}
