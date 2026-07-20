import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const body = (await request.json()) as { resource?: string; payload?: Record<string, unknown> };
  const payload = body.payload ?? {};
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!payload.name && !payload.title) errors.push('Name or title is required');
  if (!payload.code && body.resource !== 'organization') warnings.push('Business code is recommended');

  if (body.resource === 'machines' && !payload.status) {
    warnings.push('Machine status should be set (active/inactive/maintenance)');
  }

  if (body.resource === 'agents' && !payload.workforceType) {
    errors.push('AI agent requires workforceType');
  }

  return NextResponse.json({ valid: errors.length === 0, errors, warnings });
}
