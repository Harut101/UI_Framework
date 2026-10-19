import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
describe('architecture boundaries', () => {
  it('keeps the shared navigation free of domain filters, datasource names, and endpoints', () => {
    expect(readFileSync('src/components/navigation/GenericNavigation.tsx', 'utf8')).not.toMatch(/reports|users|department|filters\.|module|\/api\//i);
  });
  it('keeps reusable components free of runtime, schemas, Redux, and API access', () => {
    for (const name of readdirSync('src/components', { recursive: true, encoding: 'utf8' }).filter(name => /\.tsx$/.test(name))) {
      expect(readFileSync(join('src/components', name), 'utf8')).not.toMatch(/useSelector|useDispatch|react-redux|reduxjs|ActionEngine|DataSourceManager|\$state|\$data|fetch\(|runtime\//);
    }
  });
  it('keeps domain wiring out of runtime layers', () => {
    for (const name of readdirSync('src/runtime', { recursive: true, encoding: 'utf8' }).filter(name => /\.tsx?$/.test(name))) {
      expect(readFileSync(join('src/runtime', name), 'utf8')).not.toMatch(/selectModule|selectedReportId|\/api\/(reports|users)|report-list|user-list|selectDepartment|highlightedPerson|reporting\.catalog|users\.catalog/);
    }
  });
});
