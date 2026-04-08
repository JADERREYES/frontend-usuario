import type { HTMLAttributes, PropsWithChildren } from 'react';
import { cn } from '../../utils/cn';

export function GlassCard({
  children,
  className,
  ...props
}: PropsWithChildren<HTMLAttributes<HTMLDivElement>>) {
  return (
    <div className={cn('glass-card rounded-[var(--radius-xl)] p-5 text-left', className)} {...props}>
      {children}
    </div>
  );
}
