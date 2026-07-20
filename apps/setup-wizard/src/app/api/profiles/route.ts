import { NextResponse } from 'next/server';
import { fetchProfiles } from '@/lib/api/provisioning-server';

export async function GET() {
  try {
    const profiles = await fetchProfiles();
    return NextResponse.json(profiles);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 502 });
  }
}
