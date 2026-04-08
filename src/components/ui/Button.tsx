import type { ButtonHTMLAttributes, PropsWithChildren } from 'react';
import { cn } from '../../utils/cn';

type ButtonProps = PropsWithChildren<
  ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: 'primary' | 'secondary' | 'ghost';
    fullWidth?: boolean;
  }
>;

export function Button({
  children,
  className,
  variant = 'primary',
  fullWidth,
  ...props
}: ButtonProps) {
  const variants = {
    primary:
      'bg-[var(--gradient-main)] text-white shadow-[0_24px_48px_rgba(124,82,232,0.34)]',
    secondary:
      'border border-white/70 bg-white/70 text-[var(--text-main)] shadow-[0_18px_28px_rgba(134,101,190,0.12)] backdrop-blur-xl',
    ghost: 'bg-white/20 text-[var(--text-soft)]',
  };

  return (
    <button
      className={cn(
        'inline-flex min-h-13 items-center justify-center rounded-full px-5 text-sm font-semibold tracking-[0.01em] transition duration-200 active:scale-[0.98] hover:translate-y-[-1px] disabled:cursor-not-allowed disabled:opacity-50',
        variants[variant],
        fullWidth && 'w-full',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
