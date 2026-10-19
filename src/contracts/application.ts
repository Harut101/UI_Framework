export interface ApplicationNavigationItem {
  id: string;
  label: string;
  href?: string;
  icon?: string;
  depth?: number;
  disabled?: boolean;
  key?: string;
  children?: ApplicationNavigationItem[];
  expandable?: boolean;
  childrenLoading?: boolean;
  childrenError?: string | null;
}
export interface ApplicationUser {
  name: string;
  initials: string;
  role: string;
}
