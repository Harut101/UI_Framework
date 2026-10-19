import { defineCatalogEntry as entry } from './types';
import type { CatalogEntry } from './types';
import type { ActionDefinition } from '../../runtime/actions/types';
import { reportFixture, userFixture } from './fixtures';
const children = { type: 'ReactNode', description: 'Content inside the layout; use schema children to compose nodes.' };
const className = { type: 'string', description: 'Optional additional CSS class.' };
const disabled = { type: 'boolean', description: 'Disables interaction.', defaultValue: 'false' };
const checked = { type: 'boolean', description: 'Controlled checked state.', required: true };
const changeText = { signature: '(event: { value: string }) => void', description: 'Emits the new value; the parent owns state.', required: true };
const changeBoolean = { signature: '(event: { value: boolean }) => void', description: 'Emits the next checked state; the parent owns state.' };
const selectCallback = { signature: '(event: { value: string }) => void', description: 'Emits the selected item ID.' };
function setAction(target: string): ActionDefinition { return { type: 'state.set', target, value: '$event.value' }; }
export const catalogEntries: CatalogEntry[] = [
  entry({ name: 'Button', type: 'button', category: 'Primitives', description: 'A clear call to action with primary, secondary, and ghost variants.',
    props: { label: { type: 'string', description: 'Visible button label.', required: true }, disabled, variant: { type: "'primary' | 'secondary' | 'ghost'", description: 'Visual emphasis.', defaultValue: "'primary'" } },
    callbacks: { onClick: { signature: '() => void', description: 'Called when an enabled button is activated.' } },
    reactExample: `import { useState } from 'react';
import { Button } from './components/primitive/Button';
export function Example() {
  const [count, setCount] = useState(0);
  return <Button label={\`Clicked \${count} times\`}
    onClick={() => setCount(count + 1)} />;
}`,
    schema: { id: 'save-button', type: 'button', props: { label: 'Save changes' }, handlers: { onClick: { action: 'saveChanges' } } }, actions: { saveChanges: { type: 'notification.show', message: 'Changes saved.', tone: 'success' } },
  }),
  entry({ name: 'TextInput', type: 'text-input', category: 'Primitives', description: 'A labeled, controlled text field that emits ordinary change callbacks.',
    props: { label: { type: 'string', description: 'Accessible visible field label.', required: true }, value: { type: 'string', description: 'Controlled input value.', required: true }, placeholder: { type: 'string', description: 'Hint shown when empty.' }, disabled }, callbacks: { onChange: changeText },
    reactExample: `import { useState } from 'react';
import { TextInput } from './components/primitive/TextInput';
export function Example() {
  const [value, setValue] = useState('Acme workspace');
  return <TextInput label="Workspace name" value={value}
    onChange={({ value }) => setValue(value)} />;
}`,
    schema: { id: 'workspace-name', type: 'text-input', props: { label: 'Workspace name', placeholder: 'Enter a name' }, bindings: { value: { source: '$state.workspaceName', default: '' } }, handlers: { onChange: { action: 'setWorkspaceName' } } }, actions: { setWorkspaceName: setAction('workspaceName') },
  }),
  entry({ name: 'SearchInput', type: 'search-input', category: 'Primitives', description: 'A controlled search field with a clear button and an optional Enter callback.',
    props: { value: { type: 'string', description: 'Controlled search query.', required: true }, label: { type: 'string', description: 'Accessible visible field label.', defaultValue: "'Search'" }, placeholder: { type: 'string', description: 'Hint shown when empty.', defaultValue: "'Search…'" }, disabled },
    callbacks: { onChange: changeText, onSearch: { signature: '(event: { value: string }) => void', description: 'Optional callback when Enter is pressed; does not perform requests.' } },
    reactExample: `import { useState } from 'react';
import { SearchInput } from './components/primitive/SearchInput';
export function Example() {
  const [value, setValue] = useState('');
  return <SearchInput value={value} placeholder="Search reports…"
    onChange={({ value }) => setValue(value)}
    onSearch={({ value }) => console.log('Search:', value)} />;
}`,
    schema: { id: 'search', type: 'search-input', props: { placeholder: 'Search reports…' }, bindings: { value: { source: '$state.query', default: '' } }, handlers: { onChange: { action: 'setQuery' }, onSearch: { action: 'searchRequested' } } }, actions: { setQuery: setAction('query'), searchRequested: { type: 'notification.show', message: '$event.value' } },
  }),
  entry({ name: 'Select', type: 'select', category: 'Primitives', description: 'An accessible dropdown driven by an array of value/label options.',
    props: { label: { type: 'string', description: 'Accessible visible field label.', required: true }, options: { type: 'SelectOption[]', description: 'Array of { value, label, disabled? }.', required: true }, value: { type: 'string', description: 'Selected option value.', required: true }, disabled }, callbacks: { onChange: changeText },
    reactExample: `import { useState } from 'react';
import { Select } from './components/primitive/Select';
export function Example() {
  const [value, setValue] = useState('finance');
  const options = [{ value: 'finance', label: 'Finance' },
    { value: 'sales', label: 'Sales' }];
  return <Select label="Module" options={options} value={value}
    onChange={({ value }) => setValue(value)} />;
}`,
    schema: { id: 'module-select', type: 'select', props: { label: 'Module', options: [{ value: 'finance', label: 'Finance' }, { value: 'sales', label: 'Sales' }] }, bindings: { value: { source: '$state.module', default: 'finance' } }, handlers: { onChange: { action: 'setModule' } } }, actions: { setModule: setAction('module') },
  }),
  entry({ name: 'Switch', type: 'switch', category: 'Primitives', description: 'A controlled on/off setting with native keyboard and screen-reader support.',
    props: { label: { type: 'string', description: 'Accessible setting label.', required: true }, checked, disabled }, callbacks: { onChange: changeBoolean },
    reactExample: `import { useState } from 'react';
import { Switch } from './components/primitive/Switch';
export function Example() {
  const [checked, setChecked] = useState(true);
  return <Switch label="Email notifications" checked={checked}
    onChange={({ value }) => setChecked(value)} />;
}`,
    schema: { id: 'notifications', type: 'switch', props: { label: 'Email notifications' }, bindings: { checked: { source: '$state.notificationsEnabled', default: false } }, handlers: { onChange: { action: 'setNotifications' } } }, actions: { setNotifications: setAction('notificationsEnabled') },
  }),
  entry({ name: 'Checkbox', type: 'checkbox', category: 'Primitives', description: 'A controlled checkbox for an explicit choice or preference.',
    props: { label: { type: 'string', description: 'Accessible option label.', required: true }, checked, disabled }, callbacks: { onChange: changeBoolean },
    reactExample: `import { useState } from 'react';
import { Checkbox } from './components/primitive/Checkbox';
export function Example() {
  const [checked, setChecked] = useState(false);
  return <Checkbox label="Include archived records" checked={checked}
    onChange={({ value }) => setChecked(value)} />;
}`,
    schema: { id: 'archived', type: 'checkbox', props: { label: 'Include archived records' }, bindings: { checked: { source: '$state.includeArchived', default: false } }, handlers: { onChange: { action: 'setArchived' } } }, actions: { setArchived: setAction('includeArchived') },
  }),
  entry({ name: 'Text', type: 'text', category: 'Primitives', description: 'Simple paragraph content supplied as a static or reactive value.',
    props: { value: { type: 'string', description: 'Text content to render.', required: true }, className }, callbacks: {},
    reactExample: `import { Text } from './components/primitive/Text';
export function Example() {
  return <Text value="Your workspace is ready." />;
}`,
    schema: { id: 'status-text', type: 'text', bindings: { value: { source: '$state.message', default: 'Your workspace is ready.' } } }, actions: {},
  }),
  entry({ name: 'Title', type: 'title', category: 'Primitives', description: 'A semantic heading with a selectable level and optional supporting text.',
    props: { value: { type: 'string', description: 'Heading text.', required: true }, level: { type: '1 | 2 | 3 | 4', description: 'Semantic heading level.', defaultValue: '2' }, subtitle: { type: 'string', description: 'Supporting paragraph below the heading.' } }, callbacks: {},
    reactExample: `import { Title } from './components/primitive/Title';
export function Example() {
  return <Title value="Workspace overview" level={2}
    subtitle="Everything you need to move work forward." />;
}`,
    schema: { id: 'title', type: 'title', props: { value: 'Workspace overview', level: 2, subtitle: 'Everything you need to move work forward.' } }, actions: {},
  }),
  entry({ name: 'Card', type: 'card', category: 'Layout', description: 'A reusable content surface with optional title, description, and children.',
    props: { title: { type: 'string', description: 'Optional card heading.' }, description: { type: 'string', description: 'Supporting text below the heading.' }, children, className }, callbacks: {},
    reactExample: `import { Card } from './components/layout/Card';
import { Text } from './components/primitive/Text';
export function Example() {
  return <Card title="Team activity" description="A little context, at a glance.">
    <Text value="Your workspace is up to date." />
  </Card>;
}`,
    schema: { id: 'activity-card', type: 'card', props: { title: 'Team activity', description: 'A little context, at a glance.' }, children: [{ id: 'card-text', type: 'text', props: { value: 'Your workspace is up to date.' } }] }, actions: {},
  }),
  entry({ name: 'Stack', type: 'stack', category: 'Layout', description: 'Vertical composition with consistent spacing and alignment.',
    props: { gap: { type: 'number', description: 'Space between children in CSS pixels.', defaultValue: '16' }, align: { type: "'start' | 'center' | 'stretch'", description: 'Cross-axis child alignment.', defaultValue: "'stretch'" }, children, className }, callbacks: {},
    reactExample: `import { Stack } from './components/layout/Stack';
import { Text } from './components/primitive/Text';
export function Example() {
  return <Stack gap={16}><Text value="First item" />
    <Text value="Second item" /></Stack>;
}`,
    schema: { id: 'stack', type: 'stack', props: { gap: 16 }, children: [{ id: 'first', type: 'text', props: { value: 'First item' } }, { id: 'second', type: 'text', props: { value: 'Second item' } }] }, actions: {},
  }),
  entry({ name: 'Row', type: 'row', category: 'Layout', description: 'Horizontal composition with wrapping, spacing, alignment, and justification.',
    props: { gap: { type: 'number', description: 'Space between children in CSS pixels.', defaultValue: '16' }, align: { type: "'start' | 'center' | 'stretch'", description: 'Cross-axis child alignment.', defaultValue: "'center'" }, justify: { type: "'start' | 'center' | 'between'", description: 'Main-axis distribution.', defaultValue: "'start'" }, wrap: { type: 'boolean', description: 'Allow children to wrap.', defaultValue: 'true' }, children, className }, callbacks: {},
    reactExample: `import { Row } from './components/layout/Row';
import { Button } from './components/primitive/Button';
export function Example() {
  return <Row gap={12} wrap>
    <Button label="Cancel" variant="secondary" onClick={() => {}} />
    <Button label="Save changes" onClick={() => {}} />
  </Row>;
}`,
    schema: { id: 'actions-row', type: 'row', props: { gap: 12, wrap: true }, children: [{ id: 'cancel', type: 'button', props: { label: 'Cancel', variant: 'secondary' }, handlers: { onClick: { action: 'cancel' } } }, { id: 'save', type: 'button', props: { label: 'Save changes' }, handlers: { onClick: { action: 'save' } } }] }, actions: { cancel: { type: 'notification.show', message: 'Cancelled.' }, save: { type: 'notification.show', message: 'Saved.', tone: 'success' } },
  }),
  entry({ name: 'Page', type: 'page', category: 'Layout', description: 'The root content container for a view; it composes child components without owning state.',
    props: { children, className }, callbacks: {},
    reactExample: `import { Page } from './components/layout/Page';
import { PageHeader } from './components/layout/PageHeader';
import { Text } from './components/primitive/Text';
export function Example() {
  return <Page><PageHeader title="Workspace" />
    <Text value="A place for your team’s work." /></Page>;
}`,
    schema: { id: 'page', type: 'page', children: [{ id: 'header', type: 'page-header', props: { title: 'Workspace' } }, { id: 'body', type: 'text', props: { value: 'A place for your team’s work.' } }] }, actions: {},
  }),
  entry({ name: 'PageHeader', type: 'page-header', category: 'Layout', description: 'A page introduction with title, description, eyebrow, and an action slot.',
    props: { title: { type: 'string', description: 'Primary page heading.', required: true }, description: { type: 'string', description: 'Supporting page description.' }, eyebrow: { type: 'string', description: 'Small context label above the title.' }, children }, callbacks: {},
    reactExample: `import { PageHeader } from './components/layout/PageHeader';
import { Button } from './components/primitive/Button';
export function Example() {
  return <PageHeader title="Reports" eyebrow="Workspace"
    description="A clearer picture of your business.">
    <Button label="Create report" onClick={() => {}} />
  </PageHeader>;
}`,
    schema: { id: 'page-header', type: 'page-header', props: { title: 'Reports', eyebrow: 'Workspace', description: 'A clearer picture of your business.' }, children: [{ id: 'create', type: 'button', props: { label: 'Create report' }, handlers: { onClick: { action: 'createReport' } } }] }, actions: { createReport: { type: 'notification.show', message: 'Create report requested.' } },
  }),
  entry({ name: 'SplitLayout', type: 'split-layout', category: 'Layout', description: 'Responsive two-column composition with selectable width proportions.',
    props: { ratio: { type: "'balanced' | 'wide-left' | 'wide-right'", description: 'Relative widths of the two columns.', defaultValue: "'balanced'" }, gap: { type: 'number', description: 'Space between columns in CSS pixels.', defaultValue: '20' }, children }, callbacks: {},
    reactExample: `import { SplitLayout } from './components/layout/SplitLayout';
import { Card } from './components/layout/Card';
export function Example() {
  return <SplitLayout ratio="wide-left" gap={20}>
    <Card title="Main content" /><Card title="Details" />
  </SplitLayout>;
}`,
    schema: { id: 'split', type: 'split-layout', props: { ratio: 'wide-left', gap: 20 }, children: [{ id: 'main-card', type: 'card', props: { title: 'Main content' } }, { id: 'details-card', type: 'card', props: { title: 'Details' } }] }, actions: {},
  }),
  entry({ name: 'SidePanel', type: 'side-panel', category: 'Layout', description: 'A controlled detail drawer with optional wide layout that requests closing through an ordinary callback.',
    props: { title: { type: 'string', description: 'Panel heading and accessible label.', required: true }, description: { type: 'string', description: 'Supporting panel description.' }, size: { type: 'medium | wide', description: 'Optional width for one detail view or parallel content.', defaultValue: 'medium' }, open: { type: 'boolean', description: 'Whether to render the panel.', defaultValue: 'true' }, children }, callbacks: { onClose: { signature: '() => void', description: 'Optional close request; the parent controls open state.' } },
    reactExample: `import { useState } from 'react';
import { SidePanel } from './components/layout/SidePanel';
import { Text } from './components/primitive/Text';
export function Example() {
  const [open, setOpen] = useState(true);
  return <SidePanel title="Record details" open={open}
    onClose={() => setOpen(false)}>
    <Text value="A little more detail about this record." />
  </SidePanel>;
}`,
    schema: { id: 'details-panel', type: 'side-panel', props: { title: 'Record details' }, visibility: '$state.showDetails', handlers: { onClose: { action: 'closeDetails' } }, children: [{ id: 'details-text', type: 'text', props: { value: 'A little more detail about this record.' } }] }, actions: { closeDetails: { type: 'state.set', target: 'showDetails', value: false } },
  }),
  entry({ name: 'GenericNavigation', type: 'generic-navigation', category: 'Navigation & data', description: 'Selection-driven navigation without knowledge of routes, APIs, or destination behavior.',
    props: { items: { type: 'NavigationItem[]', description: 'Array of { id, label, description?, count?, disabled? }.', required: true }, selectedId: { type: 'string | null', description: 'ID to mark as selected.' }, loading: { type: 'boolean', description: 'Displays loading feedback and disables selection.', defaultValue: 'false' }, orientation: { type: "'vertical' | 'horizontal'", description: 'Navigation arrangement.', defaultValue: "'vertical'" }, label: { type: 'string', description: 'Accessible navigation label.', defaultValue: "'Navigation'" } }, callbacks: { onSelect: selectCallback },
    reactExample: `import { useState } from 'react';
import { GenericNavigation } from './components/navigation/GenericNavigation';
export function Example() {
  const [selectedId, setSelectedId] = useState('overview');
  const items = [{ id: 'overview', label: 'Overview' },
    { id: 'reports', label: 'Reports' }];
  return <GenericNavigation items={items} selectedId={selectedId}
    loading={false} onSelect={({ value }) => setSelectedId(value)} />;
}`,
    schema: { id: 'navigation', type: 'generic-navigation', bindings: { items: { source: '$data.navigation.data.items', default: [] }, selectedId: '$state.selectedId', loading: '$data.navigation.loading' }, handlers: { onSelect: { action: 'selectItem' } } }, actions: { selectItem: setAction('selectedId') },
  }),
  entry({ name: 'GenericList', type: 'generic-list', category: 'Navigation & data', description: 'A domain-neutral list with optional selection, loading feedback, and an empty state.',
    props: { items: { type: 'ListItem[]', description: 'Array of { id, title, description?, meta?, disabled? }.', required: true }, selectedId: { type: 'string | null', description: 'ID to mark as selected.' }, loading: { type: 'boolean', description: 'Displays loading feedback and disables selection.', defaultValue: 'false' }, emptyMessage: { type: 'string', description: 'Copy shown when empty and not loading.', defaultValue: "'No items to display.'" }, label: { type: 'string', description: 'Accessible list label.', defaultValue: "'Items'" } }, callbacks: { onSelect: { ...selectCallback, description: 'Optional selection callback; without it, rows are static.' } },
    reactExample: `import { useState } from 'react';
import { GenericList } from './components/navigation/GenericList';
export function Example() {
  const [selectedId, setSelectedId] = useState('revenue');
  const items = [{ id: 'revenue', title: 'Revenue overview' },
    { id: 'pipeline', title: 'Pipeline performance' }];
  return <GenericList items={items} selectedId={selectedId}
    onSelect={({ value }) => setSelectedId(value)} />;
}`,
    schema: { id: 'records', type: 'generic-list', bindings: { items: { source: '$data.records.data.items', default: [] }, selectedId: '$state.selectedId', loading: '$data.records.loading' }, handlers: { onSelect: { action: 'selectRecord' } } }, actions: { selectRecord: setAction('selectedId') },
  }),
  entry({ name: 'ReportCard', type: 'report-card', category: 'Reporting', description: 'A presentational report summary with status, module, updated label, and an optional open callback.',
    props: { report: { type: 'ReportSummary', description: 'Object with id, title, description, module, status (published/draft), and updatedAt.', required: true }, selected: { type: 'boolean', description: 'Highlights the card.', defaultValue: 'false' }, openLabel: { type: 'string', description: 'Label for the open callback button.', defaultValue: 'Open report' } }, callbacks: { onOpen: { signature: '(event: { value: string }) => void', description: 'Optional open request containing the report ID.' } },
    reactExample: `import { ReportCard } from './components/reporting/ReportCard';
const report = ${JSON.stringify(reportFixture, null, 2)} as const;
export function Example() {
  return <ReportCard report={report}
    onOpen={({ value }) => console.log('Open:', value)} />;
}`,
    schema: { id: 'report-card', type: 'report-card', props: { report: { ...reportFixture } }, handlers: { onOpen: { action: 'openReport' } } }, actions: { openReport: setAction('selectedReportId') },
  }),
  entry({ name: 'UserCard', type: 'user-card', category: 'Users', description: 'A presentational profile summary with optional selection and message callbacks.',
    props: { user: { type: 'UserSummary', description: 'Object with id, name, role, email, status (active/invited/disabled), and optional initials.', required: true }, selected: { type: 'boolean', description: 'Highlights the card.', defaultValue: 'false' } }, callbacks: { onSelect: { signature: '(event: { value: string }) => void', description: 'Optional profile request containing the user ID.' }, onMessage: { signature: '(event: { value: string }) => void', description: 'Optional message intent containing the user ID; does not send a message.' } },
    reactExample: `import { UserCard } from './components/users/UserCard';
const user = ${JSON.stringify(userFixture, null, 2)} as const;
export function Example() {
  return <UserCard user={user}
    onSelect={({ value }) => console.log('Select:', value)}
    onMessage={({ value }) => console.log('Message:', value)} />;
}`,
    schema: { id: 'user-card', type: 'user-card', props: { user: { ...userFixture } }, handlers: { onSelect: { action: 'selectUser' }, onMessage: { action: 'messageUser' } } }, actions: { selectUser: setAction('selectedUserId'), messageUser: { type: 'notification.show', message: 'Message requested.' } },
  }),
];


