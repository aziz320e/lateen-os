import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    sources: ['knowledge-platform', 'institutional-memory', 'business-dna'],
    pinned: ['security-policy', 'onboarding-guide'],
    note: 'Knowledge binding contracts — served by Knowledge Platform',
  });
}
