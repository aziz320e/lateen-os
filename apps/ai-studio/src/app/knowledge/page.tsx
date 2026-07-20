import { SectionPlaceholder } from '@/components/layout/section-placeholder';

export default function KnowledgePage() {
  return (
    <SectionPlaceholder
      title="Knowledge"
      description="Bind knowledge sources from Enterprise Knowledge Platform — no ingestion in Studio."
      items={['Knowledge Platform sources', 'Pinned documents', 'Domain graph links', 'Embedding policy (contract)']}
    />
  );
}
