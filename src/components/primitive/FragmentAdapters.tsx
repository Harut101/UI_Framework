import { Spinner as FluentSpinner, MessageBar, MessageBarBody, Button, TabList, Tab } from '@fluentui/react-components';
export function Spinner({ label = 'Loading…' }: { label?: string }) { return <div className="fragment-loading"><FluentSpinner size="small" label={label}/></div>; }
export function ErrorMessage({ text, onRetry }: { text: string; onRetry?: () => void }) { return <MessageBar intent="error"><MessageBarBody>{text}</MessageBarBody>{onRetry && <Button onClick={onRetry}>Retry content</Button>}</MessageBar>; }
export function WarningBanner({ text }: { text: string }) { return <MessageBar intent="warning"><MessageBarBody>{text}</MessageBarBody></MessageBar>; }
export function Tabs({ items, selectedId, onSelect }: { items: { id: string; label: string }[]; selectedId?: string; onSelect?: (event: { value: string }) => void }) {
  return <TabList selectedValue={selectedId} onTabSelect={(_, data) => onSelect?.({ value: String(data.value) })}>{items.map(item => <Tab key={item.id} value={item.id}>{item.label}</Tab>)}</TabList>;
}
