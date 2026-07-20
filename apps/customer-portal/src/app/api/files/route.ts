import { NextResponse } from 'next/server';
import {
  listInvoicesForCustomer,
  listProjectsForCustomer,
  listQuotationsForCustomer,
} from '@/lib/api/business-dna-server';
import { buildFiles } from '@/lib/api/portal-mappers';
import { PortalAuthError, requireCustomerId } from '@/lib/auth';

const uploads = new Map<string, { name: string; category: string; uploadedAt: string }>();

export async function GET() {
  try {
    const [projects, quotations, invoices] = await Promise.all([
      listProjectsForCustomer(),
      listQuotationsForCustomer(),
      listInvoicesForCustomer(),
    ]);
    const files = buildFiles(projects, quotations, invoices);
    for (const [id, meta] of uploads) {
      files.unshift({
        id,
        name: meta.name,
        category: meta.category as 'document',
        uploadedAt: meta.uploadedAt,
        version: 1,
        sizeLabel: '120 KB',
      });
    }
    return NextResponse.json({ files });
  } catch (error) {
    const status = error instanceof PortalAuthError ? error.status : 502;
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Files failed' }, { status });
  }
}

export async function POST(request: Request) {
  try {
    await requireCustomerId();
    const form = await request.formData();
    const file = form.get('file');
    const name = file instanceof File ? file.name : 'upload.pdf';
    const id = `upload-${Date.now()}`;
    uploads.set(id, { name, category: 'document', uploadedAt: new Date().toISOString() });
    return NextResponse.json({ id, name }, { status: 201 });
  } catch (error) {
    const status = error instanceof PortalAuthError ? error.status : 502;
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Upload failed' }, { status });
  }
}
