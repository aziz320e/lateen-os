import { notFound } from 'next/navigation';
import { EntityPage } from '@/components/entities/entity-page';
import { getEntityDefinition } from '@/lib/entities';

export default async function EntityRoutePage({ params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  const definition = getEntityDefinition(key);
  if (!definition || definition.key === 'organization') notFound();
  return <EntityPage definition={definition} />;
}
