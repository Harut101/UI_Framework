import applicationJson from './application/reporting.json';
import catalogJson from './views/reporting.catalog.json';
import usersJson from './views/users.catalog.json';
import { createComponentRegistry, registerApplicationComponents } from '../components/registry';
import { registerRouteOutlet } from '../runtime/routing/RouteOutlet';
import { validateApplicationDefinition, validateViewDefinition } from '../runtime/shared/validation';
import type { ApplicationDefinition } from '../runtime/application/types';
const registry = registerRouteOutlet(registerApplicationComponents(createComponentRegistry()));
const catalog: unknown = catalogJson;
validateViewDefinition(catalog, registry);
export const reportingCatalogDefinition = catalog;
const users: unknown = usersJson;
validateViewDefinition(users, registry);
export const usersCatalogDefinition = users;
export const reportingApplicationDefinition: ApplicationDefinition = {
  ...(applicationJson as ApplicationDefinition), views: { [catalog.id]: catalog, [users.id]: users },
};
validateApplicationDefinition(reportingApplicationDefinition, registry);
