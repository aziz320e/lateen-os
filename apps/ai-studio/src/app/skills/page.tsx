import { SectionPlaceholder } from '@/components/layout/section-placeholder';

export default function SkillsPage() {
  return (
    <SectionPlaceholder
      title="Skills"
      description="Attach reusable skill packages to workers — contracts only, execution in AI Runtime."
      items={['Skill catalog binding', 'Version pinning', 'Skill dependency graph']}
    />
  );
}
