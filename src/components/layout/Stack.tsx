import type { ReactNode } from 'react';
export interface StackProps { gap?: number; align?: 'start' | 'center' | 'stretch'; children?: ReactNode; className?: string }
export function Stack({ gap = 16, align = 'stretch', children, className = '' }: StackProps) {
  return <div className={`ui-stack ${className}`} style={{ gap, alignItems: align === 'start' ? 'flex-start' : align }}>{children}</div>;
}
