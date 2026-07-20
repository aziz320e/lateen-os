import type { PortalDashboard, PortalNotification, Project, Quotation, Order, Invoice, PortalFile, PortalMessage } from '@/types';

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    credentials: 'include',
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Request failed: ${response.status}`);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export const fetchDashboard = () => apiFetch<PortalDashboard>('/api/dashboard');
export const fetchProjects = () => apiFetch<{ projects: Project[] }>('/api/projects');
export const fetchProject = (id: string) => apiFetch<{ project: Project }>(`/api/projects?id=${id}`);
export const fetchOrders = () => apiFetch<{ orders: Order[] }>('/api/orders');
export const fetchQuotations = () => apiFetch<{ quotations: Quotation[] }>('/api/quotations');
export const fetchInvoices = () => apiFetch<{ invoices: Invoice[] }>('/api/invoices');
export const fetchFiles = () => apiFetch<{ files: PortalFile[] }>('/api/files');
export const fetchMessages = () => apiFetch<{ messages: PortalMessage[] }>('/api/messages');
export const fetchNotifications = () => apiFetch<{ notifications: PortalNotification[] }>('/api/notifications');
export const fetchProfile = () => apiFetch<{ customer: Record<string, unknown>; user: Record<string, unknown> }>('/api/profile');
export const fetchProduction = () => apiFetch<{ production: import('@/types').ProductionView[] }>('/api/production');
export const fetchApprovals = () => apiFetch<{ approvals: import('@/types').PortalApproval[] }>('/api/approvals');

export function login(credentials: { username: string; password: string; rememberMe?: boolean }) {
  return apiFetch<{ user: Record<string, unknown> }>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  });
}

export function logout() {
  return apiFetch<void>('/api/auth/logout', { method: 'POST' });
}

export function approveQuotation(quotationId: string, action: 'approve' | 'reject') {
  return apiFetch<{ quotation: Quotation }>('/api/quotations', {
    method: 'POST',
    body: JSON.stringify({ quotationId, action }),
  });
}

export function askAssistant(message: string) {
  return apiFetch<{ reply: string; disclaimer: string }>('/api/assistant', {
    method: 'POST',
    body: JSON.stringify({ message }),
  });
}
