import { StudioShell } from '@/components/layout/studio-shell';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function SectionPlaceholder({
  title,
  description,
  items,
}: {
  title: string;
  description: string;
  items?: readonly string[];
}) {
  return (
    <StudioShell title={title}>
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        {items && items.length > 0 && (
          <CardContent>
            <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
              {items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </CardContent>
        )}
      </Card>
    </StudioShell>
  );
}
