import { SectionPlaceholder } from '@/components/layout/section-placeholder';

export default function PermissionsPage() {
  return (
    <SectionPlaceholder
      title="Permissions"
      description="Tool and connector permission matrix — enforced at runtime by AI Workforce and Decision Engine."
      items={['Tool permissions', 'Connector permissions', 'Tenant scoping', 'Role-based access']}
    />
  );
}
