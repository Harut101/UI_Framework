export interface UserSummary {
  id: string;
  name: string;
  role: string;
  email: string;
  status: 'active' | 'invited' | 'disabled';
  initials?: string;
  department?: string;
  location?: string;
}
