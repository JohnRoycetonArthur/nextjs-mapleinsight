import type { Metadata } from 'next';
import { SimulatorResultsClient } from '@/components/simulator/results/SimulatorResultsClient';
import type { WageFact } from '@/lib/simulator/engines/salaryTypes';
import type { TaxBracketsData, PayrollParamsData } from '@/lib/simulator/engines/taxTypes';
import type { MBMThresholdEntry, RentBenchmarkEntry } from '@/lib/simulator/engines/colTypes';
import type { TaskDefinition, RoadmapRule, ContentItem } from '@/lib/simulator/engines/roadmapTypes';
import type { CCBParams } from '@/lib/simulator/engines/ccbTypes';

// Server-side JSON imports — serialized as props to the client component
import wageFactsRaw      from '@/data/simulator/wage_facts.json';
import taxBracketsRaw    from '@/data/simulator/tax_brackets.json';
import payrollParamsRaw  from '@/data/simulator/payroll_params.json';
import mbmThresholdsRaw  from '@/data/simulator/mbm_thresholds.json';
import rentBenchmarksRaw from '@/data/simulator/rent_benchmarks.json';
import roadmapTasksRaw   from '@/data/simulator/roadmap_tasks.json';
import roadmapRulesRaw   from '@/data/simulator/roadmap_rules.json';
import contentItemsRaw   from '@/data/simulator/content_items.json';
import ccbParamsRaw      from '@/data/simulator/ccb_params.json';

export const metadata: Metadata = {
  title: 'Your Financial Simulation Results | Maple Insight',
  description:
    'Your personalized income estimate, tax breakdown, cost-of-living analysis, and financial roadmap for life in Canada.',
};

export default function SimulatorResultsPage() {
  return (
    <SimulatorResultsClient
      wageFacts={wageFactsRaw.data as WageFact[]}
      taxBracketsData={taxBracketsRaw as unknown as TaxBracketsData}
      payrollParamsData={payrollParamsRaw.data as unknown as PayrollParamsData}
      mbmData={mbmThresholdsRaw.data as MBMThresholdEntry[]}
      rentData={rentBenchmarksRaw.data as RentBenchmarkEntry[]}
      taskDefs={roadmapTasksRaw.tasks as TaskDefinition[]}
      rules={roadmapRulesRaw.rules as RoadmapRule[]}
      contentItems={contentItemsRaw.items as ContentItem[]}
      ccbParams={ccbParamsRaw.data as CCBParams}
    />
  );
}
