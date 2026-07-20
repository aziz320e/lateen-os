import { serverEnv } from '@/lib/env';

const baseUrl = serverEnv.NEXT_PUBLIC_LATEEN_CEO_COCKPIT_BASE_URL;

export async function fetchExecutiveDashboard() {
  try {
    const response = await fetch(`${baseUrl}/api/dashboard`, { cache: 'no-store' });
    if (!response.ok) return null;
    return response.json();
  } catch {
    return null;
  }
}

export async function fetchPlatformHealth() {
  try {
    const response = await fetch(`${baseUrl}/api/platform/health`, { cache: 'no-store' });
    if (!response.ok) return null;
    return response.json();
  } catch {
    return null;
  }
}

export async function fetchCockpitMemory() {
  try {
    const response = await fetch(`${baseUrl}/api/memory`, { cache: 'no-store' });
    if (!response.ok) return [];
    return response.json();
  } catch {
    return [];
  }
}
