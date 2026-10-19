import type { ReactNode } from 'react';
export interface ApplicationShellProps { children?: ReactNode; navigationCollapsed?: boolean }
export function ApplicationShell({ children, navigationCollapsed = false }: ApplicationShellProps) {
  return <div className={`application-shell ${navigationCollapsed ? 'navigation-collapsed' : ''}`}>{children}</div>;
}
