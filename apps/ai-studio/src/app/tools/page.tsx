import { SectionPlaceholder } from '@/components/layout/section-placeholder';
import { WORKER_TOOLS } from '@/lib/types/studio';

export default function ToolsPage() {
  return (
    <SectionPlaceholder
      title="Tools"
      description="Configure tool permissions for workers — Business DNA, Search, Knowledge, Marketplace, Connectors, Files, Email, Workflow, Decision, Mission, Reports."
      items={[...WORKER_TOOLS]}
    />
  );
}
