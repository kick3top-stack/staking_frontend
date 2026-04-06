import { ReactNode } from 'react';

interface BadgeProps {
  type?: 'apr' | 'penalty' | 'paused' | 'active' | 'matured' | 'default';
  children: ReactNode;
}

export function Badge({ type = 'default', children }: BadgeProps) {
  const variants = {
    apr: 'bg-success/10 text-success border border-success/20',
    penalty: 'bg-warning/10 text-warning border border-warning/20',
    paused: 'bg-error/10 text-error border border-error/20',
    active: 'bg-success/10 text-success border border-success/20',
    matured: 'bg-blue-500/10 text-blue-500 border border-blue-500/20',
    default: 'bg-surface text-muted-foreground border border-border'
  };

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${variants[type]}`}>
      {children}
    </span>
  );
}
