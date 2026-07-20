import { NextResponse } from 'next/server';
import {
  fetchEntityCounts,
  getOrganization,
  listBranches,
  listDepartments,
  listEmployees,
  listMachines,
} from '@/lib/api/business-dna-server';

export async function GET() {
  try {
    const [organization, counts, departments, employees, machines, branches] = await Promise.all([
      getOrganization().catch(() => null),
      fetchEntityCounts(),
      listDepartments(),
      listEmployees(),
      listMachines(),
      listBranches(),
    ]);
    return NextResponse.json({ organization, counts, departments, employees, machines, branches });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Organization failed' }, { status: 502 });
  }
}
