import type { ReactNode } from 'react';
import { Button, Spinner, Text } from '@fluentui/react-components';
import { Icon } from '../icons';
import type { ApplicationNavigationItem } from '../../contracts/application';

export interface PrimaryNavigationProps {
  children?: ReactNode;
  caption?: string;
  footerText?: string;
  items: ApplicationNavigationItem[];
  selectedId?: string;
  selectedHref?: string;
  expandedIds?: string[];
  loading?: boolean;
  error?: string | null;
  onSelect: (event: { value: string; href: string }) => void;
  onExpandedChange?: (event: { value: string[] }) => void;
  onRetry?: () => void;
  onRetryChildren?: (event: { value: string }) => void;
}
/** Controlled presentation only: navigation and expansion are independent callbacks. */
export function PrimaryNavigation({
  children, caption, footerText, items, selectedId, selectedHref, expandedIds = [],
  loading = false, error, onSelect, onExpandedChange, onRetry, onRetryChildren,
}: PrimaryNavigationProps) {
  const render = (nodes: ApplicationNavigationItem[], depth = 0): ReactNode => nodes.map(item => {
    const key = item.key ?? item.id;
    const expandable = item.expandable ?? Boolean(item.children?.length);
    const expanded = expandedIds.includes(key);
    const selected = selectedHref ? item.href === selectedHref : item.id === selectedId;
    const toggle = () => onExpandedChange?.({
      value: expanded ? expandedIds.filter(id => id !== key) : [...expandedIds, key],
    });
    const separateExpansion = expandable && Boolean(item.href);
    const selection = <Button
      appearance="subtle" disabled={item.disabled || (!item.href && !expandable)}
      style={{ paddingInlineStart: 15 + 16 * (item.depth ?? depth) }}
      className={'application-nav-link' + (selected ? ' selected' : '')}
      aria-current={selected ? 'page' : undefined}
      aria-expanded={expandable && !item.href ? expanded : undefined}
      icon={<Icon name={item.icon ?? 'folder'}/>}
      onClick={() => { if (item.href) onSelect({ value: item.id, href: item.href }); else if (expandable) toggle(); }}
    ><span>{item.label}</span>{expandable && !item.href && <Icon name="chevron" size={14}/>}</Button>;
    return <div className="application-nav-node" key={key}>
      {separateExpansion ? <div className="application-nav-row">
        {selection}
        <Button appearance="subtle" className="application-nav-expand"
          aria-label={(expanded ? 'Collapse ' : 'Expand ') + item.label}
          aria-expanded={expanded} disabled={item.disabled}
          icon={<Icon name="chevron" size={14}/>} onClick={toggle}/>
      </div> : selection}
      {expandable && expanded && <div className="application-nav-children">
        {render(item.children ?? [], depth + 1)}
        {item.childrenLoading && <Spinner size="tiny" label={'Loading ' + item.label + '…'}/>}
        {item.childrenError && <div role="alert"><Text block>Unable to load {item.label}</Text><Button appearance="subtle" onClick={() => onRetryChildren?.({ value: key })}>Retry {item.label}</Button></div>}
        {!item.childrenLoading && !item.childrenError && !item.children?.length && <Text className="application-nav-empty">No items</Text>}
      </div>}
    </div>;
  });
  return <nav className="application-navigation" aria-label="Primary navigation" aria-busy={loading}>
    {caption && <Text block as="p" className="application-nav-caption">{caption}</Text>}
    {loading && <Spinner size="tiny" label="Loading navigation…"/>}
    {error && <div role="alert"><Text block as="p">{error}</Text><Button appearance="subtle" onClick={onRetry}>Retry navigation</Button></div>}
    {render(items)}{children}
    {footerText && <div className="application-nav-footer">{footerText}</div>}
  </nav>;
}
