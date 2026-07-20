import { SectionPlaceholder } from '@/components/layout/section-placeholder';

export default function GoalsPage() {
  return (
    <SectionPlaceholder
      title="Goals"
      description="Define worker goals and success criteria — orchestrated by AI Workforce missions."
      items={['Primary goal', 'Success metrics', 'Goal hierarchy']}
    />
  );
}
