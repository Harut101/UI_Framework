import type { ReactNode } from 'react';
export interface CatalogLayoutProps { children?: ReactNode }
export function CatalogLayout({ children }: CatalogLayoutProps) { return <div className="catalog-layout">{children}</div>; }
