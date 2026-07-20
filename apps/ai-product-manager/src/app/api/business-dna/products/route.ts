import { NextResponse } from 'next/server';
import { listAgents, listMachines, listProducts } from '@/lib/api/business-dna-server';

export async function GET(request: Request) {
  const { pathname } = new URL(request.url);
  const resource = pathname.split('/').pop();

  try {
    if (resource === 'products') return NextResponse.json(await listProducts());
    if (resource === 'machines') return NextResponse.json(await listMachines());
    if (resource === 'agents') return NextResponse.json(await listAgents());
    return NextResponse.json({ error: 'Unknown resource' }, { status: 404 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Business DNA request failed' },
      { status: 502 },
    );
  }
}
