import { DataTreeRuntime } from '../runtime/data-tree/DataTreeRuntime';
import { registerSchemaOutlet } from '../runtime/schema/SchemaOutlet';
import { Spinner, ErrorMessage, WarningBanner, Tabs } from './primitive/FragmentAdapters';
import { NavigationGroup, NavigationGroupContent, NavigationItem } from './navigation/NavigationGroup';
import { ComponentRegistry } from '../runtime/rendering/ComponentRegistry';
import { Button } from './primitive/Button';
import { TextInput } from './primitive/TextInput';
import { SearchInput } from './primitive/SearchInput';
import { Select } from './primitive/Select';
import { Switch } from './primitive/Switch';
import { Checkbox } from './primitive/Checkbox';
import { Text } from './primitive/Text';
import { Title } from './primitive/Title';
import { Card } from './layout/Card';
import { Stack } from './layout/Stack';
import { Row } from './layout/Row';
import { Page } from './layout/Page';
import { PageHeader } from './layout/PageHeader';
import { SplitLayout } from './layout/SplitLayout';
import { SidePanel } from './layout/SidePanel';
import { GenericNavigation } from './navigation/GenericNavigation';
import { GenericList } from './navigation/GenericList';
import { ReportCard } from './reporting/ReportCard';
import { UserCard } from './users/UserCard';
import { ApplicationShell } from './application/ApplicationShell';
import { ApplicationHeader } from './application/ApplicationHeader';
import { PrimaryNavigation } from './application/PrimaryNavigation';
import { CatalogLayout } from './layout/CatalogLayout';
import { SuggestionCallout } from './layout/SuggestionCallout';
import { ReportList } from './reporting/ReportList';
import { ReportDetails } from './reporting/ReportDetails';
import { UserList } from './users/UserList';
export const sharedComponents = {
  button: Button, 'text-input': TextInput, 'search-input': SearchInput, select: Select,
  switch: Switch, checkbox: Checkbox, text: Text, title: Title, card: Card, stack: Stack,
  row: Row, page: Page, 'page-header': PageHeader, 'split-layout': SplitLayout, 'side-panel': SidePanel,
  'generic-navigation': GenericNavigation, 'generic-list': GenericList, 'report-card': ReportCard, 'user-card': UserCard,
};
export type ComponentSchemaType = keyof typeof sharedComponents;
export function createComponentRegistry() {
  return registerSchemaOutlet(new ComponentRegistry())
    .register('data-tree', DataTreeRuntime).register('spinner', Spinner).register('error-message', ErrorMessage)
    .register('warning-banner', WarningBanner).register('tabs', Tabs)
    .register('navigation-group', NavigationGroup).register('navigation-group-content', NavigationGroupContent).register('navigation-item', NavigationItem)
    .register('button', sharedComponents.button).register('text-input', sharedComponents['text-input'])
    .register('search-input', sharedComponents['search-input']).register('select', sharedComponents.select)
    .register('switch', sharedComponents.switch).register('checkbox', sharedComponents.checkbox)
    .register('text', sharedComponents.text).register('title', sharedComponents.title)
    .register('card', sharedComponents.card).register('stack', sharedComponents.stack)
    .register('row', sharedComponents.row).register('page', sharedComponents.page)
    .register('page-header', sharedComponents['page-header']).register('split-layout', sharedComponents['split-layout'])
    .register('side-panel', sharedComponents['side-panel']).register('generic-navigation', sharedComponents['generic-navigation'])
    .register('generic-list', sharedComponents['generic-list']).register('report-card', sharedComponents['report-card'])
    .register('user-card', sharedComponents['user-card']);
}
export function registerApplicationComponents(registry: ComponentRegistry) {
  return registry.register('application-shell', ApplicationShell).register('application-header', ApplicationHeader)
    .register('primary-navigation', PrimaryNavigation).register('catalog-layout', CatalogLayout)
    .register('suggestion-callout', SuggestionCallout).register('report-list', ReportList).register('report-details', ReportDetails).register('user-list', UserList);
}

