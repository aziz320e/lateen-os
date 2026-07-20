'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { ArrowLeft, Download, Star } from 'lucide-react';
import { AppShell } from '@/components/layout/app-shell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { fetchExtension, fetchRatings, fetchReleases, fetchReviews, installExtension } from '@/lib/api/client';
import { formatDate } from '@/lib/utils';

export default function ExtensionDetailPage({ params }: { params: Promise<{ extensionId: string }> }) {
  const extensionId = React.use(params).extensionId;

  const extensionQuery = useQuery({
    queryKey: ['extension', extensionId],
    queryFn: () => fetchExtension(extensionId),
  });

  const releasesQuery = useQuery({
    queryKey: ['releases', extensionId],
    queryFn: () => fetchReleases(extensionId),
  });

  const reviewsQuery = useQuery({
    queryKey: ['reviews', extensionId],
    queryFn: () => fetchReviews(extensionId),
  });

  const ratingsQuery = useQuery({
    queryKey: ['ratings', extensionId],
    queryFn: () => fetchRatings(extensionId),
  });

  const extension = extensionQuery.data;
  const releases = releasesQuery.data ?? [];
  const reviews = reviewsQuery.data ?? [];
  const ratings = ratingsQuery.data;

  async function handleInstall() {
    await installExtension(extensionId);
    alert('Install request submitted');
  }

  if (extensionQuery.isLoading) {
    return (
      <AppShell>
        <div className="p-8 text-muted-foreground">Loading extension...</div>
      </AppShell>
    );
  }

  if (!extension) {
    return (
      <AppShell>
        <div className="p-8 text-destructive">Extension not found</div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl space-y-8 px-6 py-8">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Back to marketplace
        </Link>

        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge>{extension.category}</Badge>
              <Badge>{extension.extensionType}</Badge>
              <Badge>{extension.distribution}</Badge>
            </div>
            <h1 className="text-3xl font-bold">{extension.manifest.displayName}</h1>
            <p className="max-w-2xl text-muted-foreground">{extension.manifest.description}</p>
            {ratings && ratings.totalReviews > 0 && (
              <div className="flex items-center gap-2 text-sm">
                <Star className="h-4 w-4 fill-primary text-primary" />
                <span>{ratings.averageRating.toFixed(1)}</span>
                <span className="text-muted-foreground">({ratings.totalReviews} reviews)</span>
              </div>
            )}
          </div>
          <Button onClick={handleInstall} className="gap-2">
            <Download className="h-4 w-4" />
            Install
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Versions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {releases.map((release) => (
                <div key={release.id} className="rounded border p-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">v{release.version}</span>
                    <Badge>{release.channel}</Badge>
                  </div>
                  {release.releaseNotes && (
                    <p className="mt-1 text-muted-foreground">{release.releaseNotes}</p>
                  )}
                  <p className="mt-1 text-xs text-muted-foreground">{formatDate(release.publishedAt)}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Permissions & Dependencies</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div>
                <p className="mb-2 font-medium">Permissions</p>
                <div className="flex flex-wrap gap-2">
                  {extension.manifest.permissions.length === 0 ? (
                    <span className="text-muted-foreground">None required</span>
                  ) : (
                    extension.manifest.permissions.map((p) => <Badge key={p}>{p}</Badge>)
                  )}
                </div>
              </div>
              <div>
                <p className="mb-2 font-medium">Dependencies</p>
                {extension.manifest.dependencies.length === 0 ? (
                  <span className="text-muted-foreground">None</span>
                ) : (
                  extension.manifest.dependencies.map((d) => (
                    <div key={d.id} className="text-muted-foreground">
                      {d.id} @ {d.version}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Reviews</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {reviews.length === 0 ? (
              <p className="text-sm text-muted-foreground">No reviews yet</p>
            ) : (
              reviews.map((review) => (
                <div key={review.id} className="border-b pb-4 last:border-0">
                  <div className="flex items-center gap-2 text-sm">
                    <Star className="h-3 w-3 fill-primary text-primary" />
                    <span>{review.rating}/5</span>
                    {review.verifiedInstall && <Badge>Verified install</Badge>}
                  </div>
                  {review.comment && <p className="mt-1 text-sm text-muted-foreground">{review.comment}</p>}
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
