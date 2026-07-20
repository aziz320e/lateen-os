'use client';

import { StudioShell } from '@/components/layout/studio-shell';
import { ConditionEditor } from '@/components/conditions/condition-editor';

export default function ConditionsPage() {
  return (
    <StudioShell title="Condition Builder">
      <p className="mb-4 text-sm text-muted-foreground">Build conditional logic for workflow branching</p>
      <ConditionEditor value={'// Example condition\nreturn context.amount > 10000 && context.status === "pending";'} />
    </StudioShell>
  );
}
