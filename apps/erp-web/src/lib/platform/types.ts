/**
 * Local response types for `apps/backend`'s REST API — this app no
 * longer imports any `@lateen-os/*-engine` package (not even for
 * types), per Task 5's "no direct runtime access" constraint. Each
 * shape below mirrors exactly the fields the real engine entity has and
 * this app's pages actually render; nothing is fabricated.
 */

export interface Customer {
  readonly id: string;
  readonly name: string;
  readonly email?: string;
  readonly phone?: string;
  readonly company?: string;
  readonly status: string;
  readonly tags: readonly string[];
}

export interface Lead {
  readonly id: string;
  readonly name: string;
  readonly status: string;
}

export interface SalesOpportunity {
  readonly id: string;
  readonly name: string;
  readonly stage: string;
  readonly status: string;
  readonly amount?: string;
}

export interface ARInvoice {
  readonly id: string;
  readonly invoiceNumber?: string;
  readonly currency: string;
  readonly subtotal: string;
  readonly taxTotal: string;
  readonly total: string;
  readonly amountPaid: string;
  readonly balanceDue: string;
  readonly status: string;
}

export interface InventoryItem {
  readonly id: string;
  readonly sku: string;
  readonly name: string;
  readonly description?: string;
  readonly unitOfMeasure: string;
  readonly status: string;
}

export interface Project {
  readonly id: string;
  readonly code: string;
  readonly name: string;
  readonly description?: string;
  readonly startDate?: string;
  readonly targetEndDate?: string;
  readonly status: string;
}

export interface Employee {
  readonly id: string;
  readonly employeeNumber: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly email: string;
  readonly phone?: string;
  readonly employmentType: string;
  readonly employmentStatus: string;
  readonly hireDate: string;
}

export interface CustomerSuccessRecord {
  readonly id: string;
  readonly customerId: string;
  readonly ownerId?: string;
  readonly status: string;
}

export interface DocumentRecord {
  readonly id: string;
  readonly title: string;
  readonly documentType: string;
  readonly ownerId?: string;
  readonly status: string;
  readonly currentVersionNumber: number;
}

export interface DashboardWidget {
  readonly id: string;
  readonly label: string;
  readonly kpiType?: string;
}

export interface Dashboard {
  readonly id: string;
  readonly name: string;
  readonly dashboardType: string;
  readonly widgets: readonly DashboardWidget[];
}
