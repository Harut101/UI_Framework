import {Button,Spinner} from '@fluentui/react-components';
import type { UserSummary } from '../../contracts/users';
import { UserCard } from './UserCard';
export interface UserSelection { value: string; user: UserSummary }
export interface UserListProps {
  items: UserSummary[]; loading?: boolean; error?: string | null; selectedId?: string | null;
  onSelect?: (event: UserSelection) => void; onRetry?: () => void;
}
export function UserList({ items, loading = false, error, selectedId, onSelect, onRetry }: UserListProps) {
  return <section className="user-list" aria-label="Users" aria-busy={loading}>{error && <div className="report-list-error" role="alert"><p>{error}</p><Button onClick={onRetry}>Retry users</Button></div>}{loading && <Spinner size="small" label="Loading users…"/>}{!loading && !error && !items.length && <div className="report-empty"><h3>No users found</h3><p>Try another search or department.</p></div>}<div className="user-card-grid">{items.map(user => <UserCard key={user.id} user={user} selected={selectedId === user.id} onSelect={onSelect ? () => onSelect({ value: user.id, user }) : undefined}/>)}</div></section>;
}
