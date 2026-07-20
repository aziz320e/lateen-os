export function Header({ title, description }: { title: string; description?: string }) {
  return (
    <div className="border-b bg-card/30 px-8 py-6">
      <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
      {description ? <p className="text-sm text-muted-foreground mt-1">{description}</p> : null}
    </div>
  );
}
