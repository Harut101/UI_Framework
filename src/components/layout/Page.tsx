import type { ReactNode } from 'react';
export interface PageProps { children?: ReactNode; className?: string }
export function Page({ children, className = '' }: PageProps) {
  return <div className={`runtime-page ${className}`}>{children}</div>;
}
