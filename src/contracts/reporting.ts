export interface ReportSummary {
  id: string;
  title: string;
  description: string;
  module: string;
  status: 'published' | 'draft';
  updatedAt: string;
  frameworks?: string[];
  reportType?: string;
  coverage?: string;
  scope?: string;
  saved?: boolean;
}
export interface ReportDetail extends ReportSummary {
  owner: string;
  parameters: { name: string; value: string }[];
  controls: string[];
  lastRun: string | null;
}
export interface ReportRunResult { id: string; reportId: string; status: 'completed'; completedAt: string; rowCount: number; message: string }
