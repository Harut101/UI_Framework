import type { NavigationItem } from "../../components/navigation/GenericNavigation";
import type { ListItem } from "../../components/navigation/GenericList";
import type { ReportSummary } from "../../components/reporting/ReportCard";
import type { UserSummary } from "../../components/users/UserCard";
export const navigationItems: NavigationItem[] = [
  {
    id: "overview",
    label: "Overview",
    description: "Your workspace at a glance",
    count: 8,
  },
  {
    id: "reports",
    label: "Reports",
    description: "Insights and forecasts",
    count: 6,
  },
  { id: "people", label: "People", description: "Meet your team", count: 4 },
];
export const listItems: ListItem[] = [
  {
    id: "revenue",
    title: "Revenue overview",
    description: "Monthly revenue and growth",
    meta: "Today",
  },
  {
    id: "pipeline",
    title: "Pipeline performance",
    description: "Opportunities and conversion",
    meta: "Yesterday",
  },
  {
    id: "campaign",
    title: "Campaign insights",
    description: "Channel engagement and reach",
    meta: "Oct 12",
  },
];
export const reportFixture: ReportSummary = {
  id: "report-1",
  title: "Revenue overview",
  description:
    "A clearer picture of monthly revenue, growth, and the trends behind the numbers.",
  module: "Finance",
  status: "published",
  updatedAt: "today",
};
export const userFixture: UserSummary = {
  id: "user-1",
  name: "Jamie Davis",
  role: "Finance lead",
  email: "jamie@acme.example",
  status: "active",
  initials: "JD",
};
