import { Router } from 'express';
import { departments, users } from '../data/users';
export const usersRoutes = Router();
usersRoutes.get('/users', async (request, response) => {
  await new Promise(resolve => setTimeout(resolve, 140));
  const query = (key: string) => typeof request.query[key] === 'string' ? String(request.query[key]).trim() : '';
  const search = query('search').toLowerCase();
  const items = users.filter(user =>
    (!query('department') || user.departmentId === query('department')) &&
    (!query('status') || user.status === query('status')) &&
    (!search || [user.name, user.email, user.role, user.department, user.location].join(' ').toLowerCase().includes(search)),
  );
  const departmentItems = departments.map(([id, label]) => ({ id, label, count: users.filter(user => user.departmentId === id).length }));
  const statusItems = [['active', 'Active users'], ['invited', 'Invited users'], ['disabled', 'Disabled users']].map(([id, label]) => ({ id, label, count: users.filter(user => user.status === id).length }));
  response.json({ items, total: items.length, subtitle: `${items.length} user${items.length === 1 ? '' : 's'} · browse by department, account status, or keyword`,
    departments: [{ id: '', label: 'All users', count: users.length }, ...departmentItems],
    statuses: [{ id: '', label: 'All statuses', count: users.length }, ...statusItems],
    departmentOptions: [{ value: '', label: 'All departments' }, ...departmentItems.map(({ id, label }) => ({ value: id, label }))],
    statusOptions: [{ value: '', label: 'All statuses' }, ...statusItems.map(({ id, label }) => ({ value: id, label }))],
  });
});
