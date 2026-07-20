import { NextResponse } from 'next/server';
import { fetchExtension, fetchRatings, fetchReleases, fetchReviews } from '@/lib/api/marketplace-server';

export async function GET(_request: Request, context: { params: Promise<{ extensionId: string }> }) {
  const { extensionId } = await context.params;

  try {
    const [extension, releases, reviews, ratings] = await Promise.all([
      fetchExtension(extensionId),
      fetchReleases(extensionId),
      fetchReviews(extensionId),
      fetchRatings(extensionId),
    ]);
    return NextResponse.json({ extension, releases, reviews, ratings });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 502 });
  }
}
