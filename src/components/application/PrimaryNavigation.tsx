import type { ReactNode } from 'react';
import { Button, Spinner, Text } from '@fluentui/react-components';
import { Icon } from '../icons';
import type { ApplicationNavigationItem } from '../../contracts/application';
export interface PrimaryNavigationProps {
  children?: ReactNode;
  items: ApplicationNavigationItem[];
  selectedId?: string;
  expandedIds?: string[];
  loading?: boolean;
  error?: string | null;
  onSelect: (event: { value: string; href: string }) => void;
  onExpandedChange?: (event: { value: string[] }) => void;
  onRetry?: () => void;
  onRetryChildren?: (event: { value: string }) => void;
}
/** Controlled presentation only: receives already-loaded/merged link props. */
export function PrimaryNavigation({ children, items, selectedId, expandedIds = [], loading = false, error, onSelect, onExpandedChange, onRetry, onRetryChildren }: PrimaryNavigationProps) {
  const render = (nodes: ApplicationNavigationItem[], depth = 0): ReactNode => nodes.map(item => {
    const key = item.key ?? item.id;
    const expandable = item.expandable ?? Boolean(item.children?.length);
    const expanded = expandedIds.includes(key);
    return <div className="application-nav-node" key={key}>
      <Button appearance="subtle" disabled={item.disabled || (!item.href && !expandable)}
        style={{ paddingInlineStart: 15 + 16 * (item.depth ?? depth) }}
        className={item.id === selectedId ? 'selected' : ''} aria-current={item.id === selectedId ? 'page' : undefined}
        aria-expanded={expandable ? expanded : undefined} icon={<Icon name={item.icon ?? 'folder'}/>}
        onClick={() => {
          if (expandable) onExpandedChange?.({ value: expanded ? expandedIds.filter(id => id !== key) : [...expandedIds, key] });
          else if (item.href) onSelect({ value: item.id, href: item.href });
        }}><span>{item.label}</span>{expandable && <Icon name="chevron" size={14}/>}</Button>
      {expandable && expanded && <div className="application-nav-children">
        {render(item.children ?? [], depth + 1)}
        {item.childrenLoading && <Spinner size="tiny" label={`Loading ${item.label}…`}/>}
        {item.childrenError && <div role="alert"><Text block>Unable to load {item.label}</Text><Button appearance="subtle" onClick={() => onRetryChildren?.({ value: key })}>Retry {item.label}</Button></div>}
        {!item.childrenLoading && !item.childrenError && !item.children?.length && <Text className="application-nav-empty">No items</Text>}
      </div>}
    </div>;
  });
  return <nav className="application-navigation" aria-label="Primary navigation" aria-busy={loading}>
    <Text block as="p" className="application-nav-caption">GUARDIAN WORKSPACE</Text>
    {loading && <Spinner size="tiny" label="Loading navigation…"/>}
    {error && <div role="alert"><Text block as="p">{error}</Text><Button appearance="subtle" onClick={onRetry}>Retry navigation</Button></div>}
    {render(items)}{children}<div className="application-nav-footer"><Icon name="success" size={14}/>Connected demo workspace</div>
  </nav>;
}
