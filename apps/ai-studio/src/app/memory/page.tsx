import { SectionPlaceholder } from '@/components/layout/section-placeholder';

export default function MemoryPage() {
  return (
    <SectionPlaceholder
      title="Memory"
      description="Working Memory, Institutional Memory, Context Window, Knowledge Sources, Pinned Knowledge."
      items={['Working Memory', 'Institutional Memory', 'Context Window', 'Knowledge Sources', 'Pinned Knowledge']}
    />
  );
}
