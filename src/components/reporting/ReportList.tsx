import {Button,Spinner,Skeleton,SkeletonItem} from '@fluentui/react-components';
import type { ReportSummary } from '../../contracts/reporting';
import type { ValueChangeCallback } from '../types';
import { ReportCard } from './ReportCard';
export interface ReportListProps {
  items: ReportSummary[]; loading?: boolean; error?: string | null; selectedId?: string | null;
  onOpen: ValueChangeCallback<string>; onRetry?: () => void;
}
export function ReportList({ items, loading = false, error, selectedId, onOpen, onRetry }: ReportListProps) {
  return <section className="report-list" aria-label="Reports" aria-busy={loading}>{error && <div className="report-list-error" role="alert"><p>{error}</p><Button onClick={onRetry}>Retry reports</Button></div>}{loading && <Spinner size="small" label="Loading reports…"/>}{!loading && !error && !items.length && <div className="report-empty"><h3>No reports found</h3><p>Try another search or select a different category.</p></div>}{items.map(report => <ReportCard key={report.id} report={report} selected={selectedId === report.id} openLabel="View details" onOpen={onOpen}/>)}{!items.length && loading && <Skeleton className="report-skeleton" aria-label="Loading report cards"><SkeletonItem/><SkeletonItem/><SkeletonItem/></Skeleton>}</section>;
}
