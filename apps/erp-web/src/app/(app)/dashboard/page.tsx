import { BarChart3, Boxes, Briefcase, Receipt, TrendingUp, Users, UsersRound } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { StatCard } from '@/components/ui/stat-card';
import { analytics, crm, finance, hr, inventory, projects, sales } from '@/lib/platform';

/**
 * Every number on this page comes from a real runtime query, executed
 * fresh on each request — never sample or fabricated data. A fresh
 * in-memory engine with nothing created yet legitimately reports 0,
 * which is what will show here until something real is created through
 * one of the modules.
 */
export default async function DashboardPage() {
  const [
    crmSummary,
    salesSummary,
    financeSummary,
    inventorySummary,
    projectsSummary,
    hrSummary,
    analyticsSummary,
  ] = await Promise.all([
    crm.getCrmSummary(),
    sales.getSalesSummary(),
    finance.getFinanceSummary(),
    inventory.getInventorySummary(),
    projects.getProjectsSummary(),
    hr.getHrSummary(),
    analytics.getAnalyticsSummary(),
  ]);

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Live data from Lateen OS's real business engines."
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <StatCard label="CRM Customers" value={crmSummary.customerCount} icon={Users} href="/crm" />
        <StatCard label="CRM Leads" value={crmSummary.leadCount} icon={Users} href="/crm" />
        <StatCard
          label="Sales Opportunities"
          value={salesSummary.opportunityCount}
          icon={TrendingUp}
          href="/sales"
        />
        <StatCard
          label="Sales Quotes"
          value={salesSummary.quoteCount}
          icon={TrendingUp}
          href="/sales"
        />
        <StatCard
          label="Finance Accounts"
          value={financeSummary.accountCount}
          icon={Receipt}
          href="/finance"
        />
        <StatCard
          label="Finance Invoices"
          value={financeSummary.invoiceCount}
          icon={Receipt}
          href="/finance"
        />
        <StatCard
          label="Inventory Items"
          value={inventorySummary.itemCount}
          icon={Boxes}
          href="/inventory"
        />
        <StatCard
          label="Warehouses"
          value={inventorySummary.warehouseCount}
          icon={Boxes}
          href="/inventory"
        />
        <StatCard
          label="Projects"
          value={projectsSummary.projectCount}
          icon={Briefcase}
          href="/projects"
        />
        <StatCard
          label="Project Tasks"
          value={projectsSummary.taskCount}
          icon={Briefcase}
          href="/projects"
        />
        <StatCard label="Employees" value={hrSummary.employeeCount} icon={UsersRound} href="/hr" />
        <StatCard
          label="Departments"
          value={hrSummary.departmentCount}
          icon={UsersRound}
          href="/hr"
        />
        <StatCard
          label="Dashboards"
          value={analyticsSummary.dashboardCount}
          icon={BarChart3}
          href="/analytics"
        />
        <StatCard
          label="KPIs Tracked"
          value={analyticsSummary.kpiCount}
          icon={BarChart3}
          href="/analytics"
        />
      </div>
    </div>
  );
}
