import type { Customer, Invoice, Order, Project, Quotation } from '@lateen-os/business-dna';
import { filterByCustomer, getAuthHeaders, requireCustomerId } from '@/lib/auth';
import { serverEnv } from '@/lib/env';

const baseUrl = serverEnv.NEXT_PUBLIC_LATEEN_BUSINESS_DNA_BASE_URL;

async function bdsFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: { ...(await getAuthHeaders()), ...init?.headers },
    cache: 'no-store',
  });
  if (!response.ok) throw new Error(`Business DNA API ${response.status}: ${path}`);
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

function orgPath(entity: string) {
  return `/api/v1/organizations/${serverEnv.LATEEN_ORG_ID}/${entity}`;
}

export async function listProjectsForCustomer(customerId?: string) {
  const id = customerId ?? (await requireCustomerId());
  const all = await bdsFetch<Project[]>(orgPath('projects')).catch(() => []);
  return filterByCustomer(all, id);
}

export async function getProjectForCustomer(projectId: string, customerId?: string) {
  const id = customerId ?? (await requireCustomerId());
  const project = await bdsFetch<Project>(`${orgPath('projects')}/${projectId}`);
  if (project.customerId !== id) throw new Error('Access denied');
  return project;
}

export async function listQuotationsForCustomer(customerId?: string) {
  const id = customerId ?? (await requireCustomerId());
  const all = await bdsFetch<Quotation[]>(orgPath('quotations')).catch(() => []);
  return filterByCustomer(all, id);
}

export async function getQuotationForCustomer(quotationId: string, customerId?: string) {
  const id = customerId ?? (await requireCustomerId());
  const quotation = await bdsFetch<Quotation>(`${orgPath('quotations')}/${quotationId}`);
  if (quotation.customerId !== id) throw new Error('Access denied');
  return quotation;
}

export async function listOrdersForCustomer(customerId?: string) {
  const id = customerId ?? (await requireCustomerId());
  const all = await bdsFetch<Order[]>(orgPath('orders')).catch(() => []);
  return filterByCustomer(all, id);
}

export async function getOrderForCustomer(orderId: string, customerId?: string) {
  const id = customerId ?? (await requireCustomerId());
  const order = await bdsFetch<Order>(`${orgPath('orders')}/${orderId}`);
  if (order.customerId !== id) throw new Error('Access denied');
  return order;
}

export async function listInvoicesForCustomer(customerId?: string) {
  const id = customerId ?? (await requireCustomerId());
  const all = await bdsFetch<Invoice[]>(orgPath('invoices')).catch(() => []);
  return filterByCustomer(all, id);
}

export async function getInvoiceForCustomer(invoiceId: string, customerId?: string) {
  const id = customerId ?? (await requireCustomerId());
  const invoice = await bdsFetch<Invoice>(`${orgPath('invoices')}/${invoiceId}`);
  if (invoice.customerId !== id) throw new Error('Access denied');
  return invoice;
}

export async function getCustomerProfile(customerId?: string) {
  const id = customerId ?? (await requireCustomerId());
  return bdsFetch<Customer>(`${orgPath('customers')}/${id}`);
}

export async function resolveCustomerIdByEmail(email: string): Promise<string | null> {
  const customers = await bdsFetch<Customer[]>(orgPath('customers')).catch(() => []);
  const match = customers.find((c) => c.email?.toLowerCase() === email.toLowerCase());
  return match?.id ?? null;
}

export async function listMachines() {
  return bdsFetch<Record<string, unknown>[]>(orgPath('machines')).catch(() => []);
}
