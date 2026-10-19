import type { ReportDetail } from '../../src/contracts/reporting';

export const modules = [
  ['threat-detection', 'Threat Detection'], ['change-monitoring', 'Change Monitoring'],
  ['forest-recovery', 'Forest Recovery'], ['microsoft-365', 'Microsoft 365'],
  ['active-directory', 'Active Directory'], ['configuration', 'Configuration'],
] as const;
export const frameworks = [['nist', 'NIST 800-53'], ['cis', 'CIS Controls v8'], ['soc2', 'SOC 2']] as const;
export const reportTypes = [['audit', 'Audit evidence'], ['activity', 'Activity summary'], ['coverage', 'Coverage snapshot']] as const;
type Seed = [string, string, string, string, string, string[], string, string];
const seeds: Seed[] = [
  ['privileged-access', 'Privileged access review', 'Every account with elevated AD/Entra roles, when access was granted, and by whom. Use to certify least-privilege access.', 'active-directory', 'audit', ['NIST AC-6', 'SOC 2 CC6.3'], 'Active Directory · Microsoft 365', 'Covers directory roles only'],
  ['gpo-changes', 'GPO change summary', 'All Group Policy Object changes in the selected window, grouped by policy and who made the change.', 'change-monitoring', 'activity', ['NIST CM-3'], 'Change Monitoring', 'Shows what changed, not intent'],
  ['threat-coverage', 'Threat detection coverage', 'Which threat rules are enabled across monitored domains and tenants, with detection counts for the period.', 'threat-detection', 'coverage', ['NIST SI-4', 'CIS 8.2'], 'Threat Detection', 'Reflects enabled rules at run time'],
  ['access-certification', 'Quarterly access certification', 'A sign-off ready package: current access by role, prior certification status, and outstanding exceptions.', 'active-directory', 'audit', ['SOC 2 CC6.1', 'NIST AC-2'], 'Active Directory · Configuration', 'Requires prior certification data to show change deltas'],
  ['inactive-accounts', 'Inactive account inventory', 'Identify dormant user and service accounts, last sign-in dates, and accounts ready for review.', 'active-directory', 'audit', ['CIS 5.3', 'NIST AC-2'], 'Active Directory', 'Based on replicated last sign-in data'],
  ['mailbox-permissions', 'Mailbox permission changes', 'Review delegated mailbox access, Send As grants, and permission changes across your organization.', 'microsoft-365', 'activity', ['SOC 2 CC6.3', 'NIST AC-6'], 'Microsoft 365 · Exchange Online', 'Shared mailboxes and user mailboxes'],
  ['recovery-readiness', 'Forest recovery readiness', 'Validate backup coverage and recovery dependencies before your next business continuity exercise.', 'forest-recovery', 'coverage', ['NIST CP-9', 'SOC 2 A1.2'], 'Forest Recovery', 'Readiness checks do not perform recovery'],
  ['configuration-drift', 'Configuration drift assessment', 'Compare your directory configuration to approved baselines and highlight policy exceptions.', 'configuration', 'coverage', ['NIST CM-6', 'CIS 4.1'], 'Configuration', 'Uses the latest approved baseline'],
  ['risky-signins', 'Risky sign-in activity', 'Investigate anomalous sign-ins, affected identities, and the corresponding response actions.', 'threat-detection', 'activity', ['NIST SI-4', 'CIS 8.5'], 'Threat Detection · Microsoft 365', 'Monitored tenants only'],
  ['group-membership', 'Sensitive group membership changes', 'Track additions and removals in privileged groups with actor, timestamp, and change source.', 'change-monitoring', 'activity', ['NIST AC-2', 'SOC 2 CC6.2'], 'Change Monitoring · Active Directory', 'Configured sensitive groups only'],
  ['license-utilization', 'Microsoft 365 license utilization', 'Understand assigned, available, and unused licenses to support your next renewal review.', 'microsoft-365', 'coverage', ['SOC 2 CC4.1'], 'Microsoft 365', 'License state at the time of collection'],
  ['password-policy', 'Password policy compliance', 'Find accounts and domains that fall outside your password and lockout policy baseline.', 'configuration', 'audit', ['NIST IA-5', 'CIS 5.2'], 'Configuration · Active Directory', 'Password content is never collected'],
  ['backup-history', 'Backup integrity history', 'Review completed forest backups, verification results, and any protection gaps.', 'forest-recovery', 'activity', ['NIST CP-9', 'SOC 2 A1.2'], 'Forest Recovery', 'Retained backup history only'],
  ['external-sharing', 'External sharing exposure', 'Review external guests, shared resources, and access that may need recertification.', 'microsoft-365', 'audit', ['NIST AC-20', 'SOC 2 CC6.7'], 'Microsoft 365 · SharePoint', 'Connected sites and guest identities'],
  ['service-accounts', 'Service account ownership', 'Find service accounts without an assigned owner and review their effective permissions.', 'active-directory', 'audit', ['NIST AC-2', 'CIS 5.5'], 'Active Directory', 'Ownership is based on maintained metadata'],
  ['alert-response', 'Security alert response summary', 'Follow the lifecycle of triggered alerts from first detection through acknowledgment and resolution.', 'threat-detection', 'activity', ['NIST IR-4', 'CIS 17.4'], 'Threat Detection', 'Configured alert retention window'],
  ['baseline-exceptions', 'Baseline exception register', 'Document approved configuration exceptions, owners, justification, and upcoming expiry dates.', 'configuration', 'audit', ['NIST CM-6', 'SOC 2 CC8.1'], 'Configuration', 'Approved exceptions only'],
  ['recovery-exercise', 'Recovery exercise evidence', 'Capture the outcomes and timing of your latest forest recovery rehearsal for audit review.', 'forest-recovery', 'audit', ['NIST CP-4', 'SOC 2 A1.3'], 'Forest Recovery', 'Completed rehearsal environments only'],
  ['object-lifecycle', 'Directory object lifecycle', 'See accounts created, modified, disabled, and removed during the reporting window.', 'change-monitoring', 'activity', ['NIST AU-12', 'CIS 8.2'], 'Change Monitoring', 'Collected directory changes only'],
  ['conditional-access', 'Conditional access coverage', 'Identify identities excluded from access policies and review enforcement across the tenant.', 'microsoft-365', 'coverage', ['NIST AC-3', 'SOC 2 CC6.1'], 'Microsoft 365 · Entra ID', 'Evaluates policy configuration, not individual sign-ins'],
  ['domain-health', 'Domain protection overview', 'A consolidated view of monitored domains, coverage gaps, and protection status.', 'threat-detection', 'coverage', ['NIST SI-4', 'CIS 13.1'], 'Threat Detection · Active Directory', 'Connected domains only'],
  ['delegated-access', 'Delegated administration review', 'Understand who can administer organizational units and where delegated access has changed.', 'active-directory', 'audit', ['NIST AC-6', 'SOC 2 CC6.3'], 'Active Directory', 'Effective permissions may include inherited grants'],
  ['policy-changes', 'Security policy change evidence', 'An audit trail of security policy modifications with actors, timestamps, and affected objects.', 'change-monitoring', 'audit', ['NIST CM-3', 'SOC 2 CC8.1'], 'Change Monitoring · Configuration', 'Collected changes within the selected period'],
  ['tenant-baseline', 'Tenant baseline comparison', 'Compare connected tenants with your standard settings and identify inconsistencies.', 'configuration', 'coverage', ['CIS 4.1', 'NIST CM-6'], 'Configuration · Microsoft 365', 'Supported baseline settings only'],
];
export interface SeededReport extends ReportDetail { moduleId: string; typeId: string; frameworkIds: string[]; updated: boolean; custom: boolean }
export const reports: SeededReport[] = seeds.map(([id, title, description, moduleId, typeId, tags, coverage, scope], index) => ({
  id, title, description, moduleId, typeId, frameworkIds: [...new Set(tags.map(tag => tag.startsWith('NIST') ? 'nist' : tag.startsWith('CIS') ? 'cis' : 'soc2'))],
  module: modules.find(([key]) => key === moduleId)![1], reportType: reportTypes.find(([key]) => key === typeId)![1],
  frameworks: tags, coverage, scope, status: index === 16 ? 'draft' : 'published', updatedAt: `2026-10-${String(14 - index % 6).padStart(2, '0')}`,
  owner: index % 3 === 0 ? 'Identity Operations' : index % 3 === 1 ? 'Security Operations' : 'Compliance Team',
  parameters: [{ name: 'Reporting window', value: 'Last 30 days' }, { name: 'Environment', value: 'All connected domains and tenants' }],
  controls: tags, lastRun: null, saved: index % 4 === 0, updated: index % 3 === 0, custom: index === 6 || index === 16 || index === 23,
}));
