import { SectionPlaceholder } from '@/components/layout/section-placeholder';

export default function MarketplacePage() {
  return (
    <SectionPlaceholder
      title="Marketplace"
      description="Marketplace extension management — orchestrated via Marketplace service (read-only binding)."
      items={['Installed extensions', 'Available extensions', 'Usage billing']}
    />
  );
}
