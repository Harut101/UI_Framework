import type { ReactNode } from 'react';
export interface RowProps { gap?: number; align?: 'start' | 'center' | 'stretch'; justify?: 'start' | 'center' | 'between'; wrap?: boolean; children?: ReactNode; className?: string }
export function Row({ gap = 16, align = 'center', justify = 'start', wrap = true, children, className = '' }: RowProps) {
  return <div className={`ui-row ${className}`} style={{ gap, alignItems: align === 'start' ? 'flex-start' : align, justifyContent: justify === 'between' ? 'space-between' : justify === 'start' ? 'flex-start' : 'center', flexWrap: wrap ? 'wrap' : 'nowrap' }}>{children}</div>;
}
