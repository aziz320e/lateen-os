import { NextResponse } from 'next/server';
import { fetchExtensions, searchExtensions } from '@/lib/api/marketplace-server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q');
  const category = searchParams.get('category') ?? undefined;

  try {
    if (q || category) {
      const result = await searchExtensions(q ?? '', category);
      return NextResponse.json(result);
    }
    const extensions = await fetchExtensions();
    return NextResponse.json(extensions);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 502 });
  }
}
