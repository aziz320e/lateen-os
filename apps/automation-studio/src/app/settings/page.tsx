import { SectionPlaceholder } from '@/components/layout/section-placeholder';

export default function SettingsPage() {
  return (
    <SectionPlaceholder
      title="Settings"
      description="Automation Studio configuration — tenant scoping, default policies, and integration bindings."
      items={['Organization settings', 'Default retry policy', 'Notification preferences', 'API gateway bindings']}
    />
  );
}
