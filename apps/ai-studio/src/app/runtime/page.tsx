import { SectionPlaceholder } from '@/components/layout/section-placeholder';

export default function RuntimePage() {
  return (
    <SectionPlaceholder
      title="Runtime"
      description="Runtime limits and observability contracts — AI execution remains in AI Runtime only."
      items={['Max tokens', 'Timeout', 'Concurrency limits', 'Runtime health (read-only)']}
    />
  );
}
