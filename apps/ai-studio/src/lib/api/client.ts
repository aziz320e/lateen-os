import type { DeploymentRecord, MarketplaceWorkerListing, PromptDesign, SandboxTestResult, WorkerAnalytics, WorkerDesign, WorkerTemplate } from '@/lib/types/studio';

export async function fetchWorkers(): Promise<WorkerDesign[]> {
  const res = await fetch('/api/workers');
  if (!res.ok) throw new Error('Failed to load workers');
  return res.json();
}

export async function fetchWorker(id: string): Promise<WorkerDesign> {
  const res = await fetch(`/api/workers/${id}`);
  if (!res.ok) throw new Error('Worker not found');
  return res.json();
}

export async function fetchTemplates(): Promise<WorkerTemplate[]> {
  const res = await fetch('/api/templates');
  if (!res.ok) throw new Error('Failed to load templates');
  return res.json();
}

export async function fetchDeployments(): Promise<DeploymentRecord[]> {
  const res = await fetch('/api/deployments');
  if (!res.ok) throw new Error('Failed to load deployments');
  return res.json();
}

export async function fetchAnalytics(): Promise<WorkerAnalytics[]> {
  const res = await fetch('/api/analytics');
  if (!res.ok) throw new Error('Failed to load analytics');
  return res.json();
}

export async function fetchMarketplace(): Promise<MarketplaceWorkerListing[]> {
  const res = await fetch('/api/marketplace');
  if (!res.ok) throw new Error('Failed to load marketplace');
  return res.json();
}

export async function fetchPrompt(workerId: string): Promise<PromptDesign> {
  const res = await fetch(`/api/workers/${workerId}/prompt`);
  if (!res.ok) throw new Error('Failed to load prompt');
  return res.json();
}

export async function runSandboxTest(workerId: string, message: string): Promise<SandboxTestResult> {
  const res = await fetch('/api/testing/sandbox', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ workerId, message }),
  });
  if (!res.ok) throw new Error('Sandbox test failed');
  return res.json();
}
