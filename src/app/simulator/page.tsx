import type { Metadata } from 'next';
import { SimulatorHero }   from '@/components/simulator/SimulatorHero';
import { SimulatorWizard } from '@/components/simulator/SimulatorWizard';

export const metadata: Metadata = {
  title: 'Canada Financial Simulator',
  description:
    'Get a personalized estimate of your income, taxes, cost of living, and financial roadmap in Canada — powered by official Canadian data.',
};

export default function SimulatorPage() {
  return (
    <>
      <SimulatorHero />
      <SimulatorWizard />
    </>
  );
}
