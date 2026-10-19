import type { ReactNode } from 'react';
import { Button } from '@fluentui/react-components';
import { Icon } from '../icons';
export function NavigationGroup({ label, icon = 'folder', expanded = false, onExpandedChange, children }: { id?: string; label: string; icon?: string; expanded?: boolean; onExpandedChange: (event: { value: boolean }) => void; children?: ReactNode }) {
  return <div className="navigation-group"><Button appearance="subtle" icon={<Icon name={icon}/>} aria-expanded={expanded} onClick={() => onExpandedChange({ value: !expanded })}>{label}<Icon name="chevron"/></Button>{expanded && children}</div>;
}
export function NavigationGroupContent({ children }: { children?: ReactNode }) { return <div className="navigation-group-content">{children}</div>; }
export function NavigationItem({ label, icon = 'folder', onClick }: { id?: string; label: string; icon?: string; onClick?: () => void }) { return <Button appearance="subtle" icon={<Icon name={icon}/>} onClick={onClick}>{label}</Button>; }
