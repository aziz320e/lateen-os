import { NextResponse } from 'next/server';
import { startProvisioning } from '@/lib/api/provisioning-server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const job = await startProvisioning(body);
    return NextResponse.json(job, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 502 });
  }
}
