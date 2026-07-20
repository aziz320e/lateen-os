import { SectionPlaceholder } from '@/components/layout/section-placeholder';

export default function SettingsPage() {
  return (
    <SectionPlaceholder
      title="Settings"
      description="Cloud platform configuration — regions, audit, API keys, and admin policies."
      items={['Regions: US, Europe, Middle East, Asia, Custom', 'Audit logs', 'API gateway bindings', 'Backup policies']}
    />
  );
}
