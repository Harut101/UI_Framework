import type { ReactNode } from 'react';
export interface SplitLayoutProps { ratio?: 'balanced' | 'wide-left' | 'wide-right'; gap?: number; children?: ReactNode }
export function SplitLayout({ ratio = 'balanced', gap = 20, children }: SplitLayoutProps) {
  return <div className={`ui-split-layout ${ratio}`} style={{ gap }}>{children}</div>;
}
