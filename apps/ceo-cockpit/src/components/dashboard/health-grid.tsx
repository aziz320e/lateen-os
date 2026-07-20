import { Badge } from '@/components/ui/badge';
import { cn, healthStatusColor } from '@/lib/utils';
import type { ServiceHealth } from '@/types';

export function HealthGrid({ services }: { services: ServiceHealth[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {services.map((service) => (
        <div key={service.name} className="rounded-lg border bg-card/50 p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">{service.name}</p>
            <Badge className={cn(healthStatusColor(service.status))}>{service.status}</Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1 truncate">{service.url}</p>
          {service.detail ? <p className="text-xs text-muted-foreground mt-1">{service.detail}</p> : null}
          <Badge variant="outline" className="mt-2 text-xs">{service.category}</Badge>
        </div>
      ))}
    </div>
  );
}
