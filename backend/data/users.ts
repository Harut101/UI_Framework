import type { UserSummary } from '../../src/contracts/users';
export interface DemoUser extends UserSummary { departmentId: string }
export const departments = [['engineering', 'Engineering'], ['finance', 'Finance'], ['sales', 'Sales'], ['operations', 'Operations']] as const;
type Seed = [string, string, string, string, UserSummary['status'], string];
const seeds: Seed[] = [
  ['ava-patel', 'Ava Patel', 'Senior platform engineer', 'engineering', 'active', 'London'],
  ['noah-kim', 'Noah Kim', 'Engineering manager', 'engineering', 'active', 'Seattle'],
  ['mia-chen', 'Mia Chen', 'Software engineer', 'engineering', 'disabled', 'Toronto'],
  ['ethan-reed', 'Ethan Reed', 'Site reliability engineer', 'engineering', 'invited', 'Austin'],
  ['olivia-martinez', 'Olivia Martinez', 'Financial controller', 'finance', 'active', 'New York'],
  ['liam-oconnor', 'Liam O’Connor', 'Senior financial analyst', 'finance', 'active', 'Dublin'],
  ['sofia-rossi', 'Sofia Rossi', 'Accounts payable specialist', 'finance', 'disabled', 'Milan'],
  ['lucas-silva', 'Lucas Silva', 'Enterprise account executive', 'sales', 'active', 'Lisbon'],
  ['emma-wilson', 'Emma Wilson', 'Sales development representative', 'sales', 'invited', 'Boston'],
  ['mateo-garcia', 'Mateo Garcia', 'Regional sales director', 'sales', 'active', 'Madrid'],
  ['amara-okafor', 'Amara Okafor', 'People operations lead', 'operations', 'active', 'Amsterdam'],
  ['daniel-brooks', 'Daniel Brooks', 'IT operations specialist', 'operations', 'disabled', 'Chicago'],
];
export const users: DemoUser[] = seeds.map(([id, name, role, departmentId, status, location]) => ({
  id, name, role, departmentId, department: departments.find(([key]) => key === departmentId)![1], status, location,
  email: id.replaceAll('-', '.') + '@example.com', initials: name.split(' ').map(part => part[0]).slice(0, 2).join(''),
}));
