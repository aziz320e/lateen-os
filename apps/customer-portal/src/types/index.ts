import type { Customer, Invoice, Order, Project, Quotation } from '@lateen-os/business-dna';

export interface PortalUser {
  id: string;
  email: string;
  username: string;
  displayName: string | null;
  organizationId: string;
  customerId: string;
  roles: string[];
}

export interface PortalDashboard {
  openProjects: number;
  pendingQuotations: number;
  runningOrders: number;
  invoicesDue: number;
  productionStatus: string;
  recentActivity: ActivityItem[];
  notifications: PortalNotification[];
  upcomingDeliveries: DeliveryItem[];
}

export interface ActivityItem {
  id: string;
  type: string;
  title: string;
  timestamp: string;
}

export interface PortalNotification {
  id: string;
  type: 'project' | 'production' | 'quotation' | 'invoice' | 'delivery' | 'ai';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}

export interface DeliveryItem {
  id: string;
  orderNumber: string;
  estimatedDate: string;
  status: string;
}

export interface PortalFile {
  id: string;
  name: string;
  category: 'contract' | 'design' | 'proof' | 'invoice' | 'document';
  projectId?: string;
  uploadedAt: string;
  version: number;
  sizeLabel: string;
}

export interface PortalMessage {
  id: string;
  subject: string;
  projectId?: string;
  preview: string;
  timestamp: string;
  unread: boolean;
  attachments: number;
}

export interface PortalApproval {
  id: string;
  type: 'quotation' | 'design' | 'change_order';
  title: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
  comments?: string;
}

export interface ProductionStage {
  name: string;
  status: 'pending' | 'running' | 'completed';
  estimatedCompletion?: string;
}

export interface ProductionView {
  orderId: string;
  orderNumber: string;
  currentStage: string;
  stages: ProductionStage[];
  machineStatus: string;
  estimatedCompletion: string;
  qualityCheckpoints: { name: string; passed: boolean }[];
}

export interface AssistantMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface CustomerProfile {
  customer: Customer;
  user: PortalUser;
}

export type { Project, Quotation, Order, Invoice };
