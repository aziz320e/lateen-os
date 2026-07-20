'use client';

import { useQuery } from '@tanstack/react-query';
import { Header } from '@/components/layout/header';
import { RecommendationCard } from '@/components/recommendations/recommendation-card';
import { Skeleton } from '@/components/ui/skeleton';
import { fetchRecommendations } from '@/lib/api/client';

export default function RecommendationsPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['recommendations'],
    queryFn: () => fetchRecommendations(),
  });

  return (
    <div>
      <Header
        title="Recommendations"
        description="Manufacturable product opportunities — approve or reject for Decision Engine"
      />
      <div className="grid gap-4 p-8 xl:grid-cols-2">
        {isLoading ? <Skeleton className="h-64" /> : null}
        {error ? <p className="text-destructive">{(error as Error).message}</p> : null}
        {data?.map((rec) => <RecommendationCard key={rec.id} recommendation={rec} />)}
        {!isLoading && !data?.length ? (
          <p className="text-muted-foreground">No recommendations yet. Run a discovery to generate opportunities.</p>
        ) : null}
      </div>
    </div>
  );
}
