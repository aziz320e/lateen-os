import type { Invoice, Order, Project, Quotation } from '@lateen-os/business-dna';
import type {
  ActivityItem,
  DeliveryItem,
  PortalApproval,
  PortalDashboard,
  PortalFile,
  PortalMessage,
  PortalNotification,
  ProductionView,
} from '@/types';

const PRODUCTION_STAGES = ['Design', 'Prepress', 'Manufacturing', 'Quality', 'Shipping'] as const;

export function buildDashboard(
  projects: Project[],
  quotations: Quotation[],
  orders: Order[],
  invoices: Invoice[],
): PortalDashboard {
  const openProjects = projects.filter((p) => !['completed', 'cancelled', 'archived'].includes(p.status)).length;
  const pendingQuotations = quotations.filter((q) => q.status === 'sent').length;
  const runningOrders = orders.filter((o) => !['fulfilled', 'partially_fulfilled', 'cancelled', 'archived'].includes(o.status)).length;
  const invoicesDue = invoices.filter((i) => !['paid', 'void', 'archived'].includes(i.status)).length;

  const recentActivity: ActivityItem[] = [
    ...projects.slice(0, 3).map((p) => ({
      id: `act-proj-${p.id}`,
      type: 'project',
      title: `Project ${p.name} — ${p.status}`,
      timestamp: p.updatedAt ?? p.createdAt ?? new Date().toISOString(),
    })),
    ...orders.slice(0, 3).map((o) => ({
      id: `act-ord-${o.id}`,
      type: 'order',
      title: `Order ${o.number} — ${o.status}`,
      timestamp: o.updatedAt ?? o.createdAt ?? new Date().toISOString(),
    })),
  ].sort((a, b) => b.timestamp.localeCompare(a.timestamp)).slice(0, 8);

  const notifications = buildNotifications(projects, quotations, orders, invoices);
  const upcomingDeliveries: DeliveryItem[] = orders
    .filter((o) => o.deliveryDate)
    .map((o) => ({
      id: o.id,
      orderNumber: o.number,
      estimatedDate: o.deliveryDate!,
      status: o.status,
    }))
    .slice(0, 5);

  const productionStatus =
    runningOrders > 0 ? `${runningOrders} orders in production` : 'No active production';

  return {
    openProjects,
    pendingQuotations,
    runningOrders,
    invoicesDue,
    productionStatus,
    recentActivity,
    notifications,
    upcomingDeliveries,
  };
}

export function buildNotifications(
  projects: Project[],
  quotations: Quotation[],
  orders: Order[],
  invoices: Invoice[],
): PortalNotification[] {
  const items: PortalNotification[] = [];

  for (const q of quotations.filter((x) => x.status === 'sent')) {
    items.push({
      id: `notif-q-${q.id}`,
      type: 'quotation',
      title: 'Quotation awaiting approval',
      message: `Quotation ${q.number} is ready for your review`,
      timestamp: q.sentAt ?? q.updatedAt ?? new Date().toISOString(),
      read: false,
    });
  }

  for (const i of invoices.filter((x) => x.status !== 'paid')) {
    items.push({
      id: `notif-i-${i.id}`,
      type: 'invoice',
      title: 'Invoice issued',
      message: `Invoice ${i.number} — ${i.amountDue ?? i.total} due`,
      timestamp: i.issueDate ?? i.updatedAt ?? new Date().toISOString(),
      read: false,
    });
  }

  for (const o of orders.filter((x) => x.status === 'in_progress' || x.status === 'confirmed')) {
    items.push({
      id: `notif-o-${o.id}`,
      type: 'production',
      title: 'Production update',
      message: `Order ${o.number} is ${o.status.replace(/_/g, ' ')}`,
      timestamp: o.updatedAt ?? new Date().toISOString(),
      read: true,
    });
  }

  for (const p of projects.filter((x) => x.status === 'production' || x.status === 'installation')) {
    items.push({
      id: `notif-p-${p.id}`,
      type: 'project',
      title: 'Project update',
      message: `${p.name} is in ${p.status}`,
      timestamp: p.updatedAt ?? new Date().toISOString(),
      read: true,
    });
  }

  return items.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
}

export function buildFiles(
  projects: Project[],
  quotations: Quotation[],
  invoices: Invoice[],
): PortalFile[] {
  const files: PortalFile[] = [];

  for (const q of quotations) {
    files.push({
      id: `file-q-${q.id}`,
      name: `Quotation-${q.number}.pdf`,
      category: 'document',
      uploadedAt: q.sentAt ?? q.createdAt ?? new Date().toISOString(),
      version: 1,
      sizeLabel: '245 KB',
    });
  }

  for (const i of invoices) {
    files.push({
      id: `file-i-${i.id}`,
      name: `Invoice-${i.number}.pdf`,
      category: 'invoice',
      uploadedAt: i.issueDate ?? i.createdAt ?? new Date().toISOString(),
      version: 1,
      sizeLabel: '180 KB',
    });
  }

  for (const p of projects) {
    files.push({
      id: `file-p-${p.id}`,
      name: `${p.code}-contract.pdf`,
      category: 'contract',
      projectId: p.id,
      uploadedAt: p.createdAt ?? new Date().toISOString(),
      version: 1,
      sizeLabel: '512 KB',
    });
  }

  return files.sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));
}

export function buildMessages(projects: Project[]): PortalMessage[] {
  return projects.slice(0, 10).map((p, index) => ({
    id: `msg-${p.id}`,
    subject: `Project discussion: ${p.name}`,
    projectId: p.id,
    preview: `Latest update on ${p.name} — status ${p.status}`,
    timestamp: p.updatedAt ?? p.createdAt ?? new Date().toISOString(),
    unread: index < 2,
    attachments: index % 3,
  }));
}

export function buildApprovals(quotations: Quotation[]): PortalApproval[] {
  return quotations
    .filter((q) => ['sent', 'accepted', 'rejected'].includes(q.status))
    .map((q) => ({
      id: q.id,
      type: 'quotation' as const,
      title: `Quotation ${q.number}`,
      status: q.status === 'sent' ? 'pending' : q.status === 'accepted' ? 'approved' : 'rejected',
      submittedAt: q.sentAt ?? q.createdAt ?? new Date().toISOString(),
      comments: q.notes,
    }));
}

export function buildProductionViews(orders: Order[]): ProductionView[] {
  return orders.map((order, index) => {
    const stageIndex = index % PRODUCTION_STAGES.length;
    const stages = PRODUCTION_STAGES.map((name, i) => ({
      name,
      status: i < stageIndex ? ('completed' as const) : i === stageIndex ? ('running' as const) : ('pending' as const),
      estimatedCompletion: order.deliveryDate,
    }));

    return {
      orderId: order.id,
      orderNumber: order.number,
      currentStage: PRODUCTION_STAGES[stageIndex]!,
      stages,
      machineStatus: index % 2 === 0 ? 'operational' : 'scheduled maintenance',
      estimatedCompletion: order.deliveryDate ?? 'TBD',
      qualityCheckpoints: [
        { name: 'Material inspection', passed: stageIndex > 0 },
        { name: 'Dimensional check', passed: stageIndex > 2 },
        { name: 'Final QA', passed: stageIndex > 3 },
      ],
    };
  });
}

export function buildAssistantReply(
  question: string,
  projects: Project[],
  quotations: Quotation[],
  orders: Order[],
): string {
  const lower = question.toLowerCase();
  if (lower.includes('project')) {
    if (projects.length === 0) return 'You have no projects on record yet.';
    return `You have ${projects.length} project(s). Active: ${projects.filter((p) => !['completed', 'cancelled'].includes(p.status)).map((p) => p.name).join(', ') || 'none'}.`;
  }
  if (lower.includes('order') || lower.includes('production')) {
    if (orders.length === 0) return 'No orders found for your account.';
    return `You have ${orders.length} order(s). Latest status: ${orders[0]?.status ?? 'unknown'}.`;
  }
  if (lower.includes('quotation') || lower.includes('quote')) {
    const pending = quotations.filter((q) => q.status === 'sent');
    return pending.length
      ? `You have ${pending.length} quotation(s) awaiting approval.`
      : 'No pending quotations at this time.';
  }
  if (lower.includes('invoice') || lower.includes('payment')) {
    const due = quotations.length; // simplified
    void due;
    const unpaid = orders.length;
    void unpaid;
    return 'Check the Invoices section for payment status and downloadable invoices.';
  }
  return 'I can help with your projects, orders, quotations, and invoices. I only use your account data — internal company information is never shared.';
}
