export interface EntityDefinition {
  readonly key: string;
  readonly label: string;
  readonly path: string;
  readonly listable: boolean;
  readonly description: string;
  readonly nameField: string;
  readonly createFields: readonly { key: string; label: string; required?: boolean }[];
}

export const ENTITY_DEFINITIONS: EntityDefinition[] = [
  { key: 'organization', label: 'Organization', path: 'organizations', listable: false, description: 'Canonical organization record', nameField: 'name', createFields: [{ key: 'name', label: 'Name', required: true }, { key: 'code', label: 'Code', required: true }] },
  { key: 'branches', label: 'Branches', path: 'branches', listable: true, description: 'Physical locations', nameField: 'name', createFields: [{ key: 'name', label: 'Name', required: true }, { key: 'code', label: 'Code', required: true }] },
  { key: 'departments', label: 'Departments', path: 'departments', listable: true, description: 'Organizational units', nameField: 'name', createFields: [{ key: 'name', label: 'Name', required: true }, { key: 'code', label: 'Code', required: true }] },
  { key: 'employees', label: 'Employees', path: 'employees', listable: false, description: 'Workforce members', nameField: 'name', createFields: [{ key: 'name', label: 'Name', required: true }, { key: 'code', label: 'Code', required: true }] },
  { key: 'roles', label: 'Roles', path: 'roles', listable: false, description: 'Access roles', nameField: 'name', createFields: [{ key: 'name', label: 'Name', required: true }, { key: 'code', label: 'Code', required: true }] },
  { key: 'permissions', label: 'Permissions', path: 'permissions', listable: false, description: 'Fine-grained permissions', nameField: 'name', createFields: [{ key: 'name', label: 'Name', required: true }, { key: 'code', label: 'Code', required: true }] },
  { key: 'customers', label: 'Customers', path: 'customers', listable: true, description: 'Customer accounts', nameField: 'name', createFields: [{ key: 'name', label: 'Name', required: true }, { key: 'code', label: 'Code', required: true }] },
  { key: 'suppliers', label: 'Suppliers', path: 'suppliers', listable: false, description: 'Supplier accounts', nameField: 'name', createFields: [{ key: 'name', label: 'Name', required: true }, { key: 'code', label: 'Code', required: true }] },
  { key: 'products', label: 'Products', path: 'products', listable: true, description: 'Product catalog', nameField: 'name', createFields: [{ key: 'name', label: 'Name', required: true }, { key: 'code', label: 'Code', required: true }] },
  { key: 'services', label: 'Services', path: 'services', listable: false, description: 'Service offerings', nameField: 'name', createFields: [{ key: 'name', label: 'Name', required: true }, { key: 'code', label: 'Code', required: true }] },
  { key: 'machines', label: 'Machines', path: 'machines', listable: true, description: 'Production equipment', nameField: 'name', createFields: [{ key: 'name', label: 'Name', required: true }, { key: 'code', label: 'Code', required: true }] },
  { key: 'projects', label: 'Projects', path: 'projects', listable: true, description: 'Initiatives and deliveries', nameField: 'name', createFields: [{ key: 'name', label: 'Name', required: true }, { key: 'code', label: 'Code', required: true }] },
  { key: 'policies', label: 'Policies', path: 'policies', listable: false, description: 'Governance policies', nameField: 'name', createFields: [{ key: 'name', label: 'Name', required: true }, { key: 'code', label: 'Code', required: true }] },
  { key: 'workflows', label: 'Workflows', path: 'workflows', listable: false, description: 'Business process definitions', nameField: 'name', createFields: [{ key: 'name', label: 'Name', required: true }, { key: 'code', label: 'Code', required: true }] },
  { key: 'kpis', label: 'KPIs', path: 'kpis', listable: false, description: 'Key performance indicators', nameField: 'name', createFields: [{ key: 'name', label: 'Name', required: true }, { key: 'code', label: 'Code', required: true }] },
  { key: 'assets', label: 'Assets', path: 'assets', listable: false, description: 'Physical and digital assets', nameField: 'name', createFields: [{ key: 'name', label: 'Name', required: true }, { key: 'code', label: 'Code', required: true }] },
  { key: 'agents', label: 'AI Workforce', path: 'agents', listable: true, description: 'AI agents registered in Business DNA', nameField: 'name', createFields: [{ key: 'name', label: 'Name', required: true }, { key: 'code', label: 'Code', required: true }, { key: 'workforceType', label: 'Workforce Type' }] },
];

export function getEntityDefinition(key: string): EntityDefinition | undefined {
  return ENTITY_DEFINITIONS.find((e) => e.key === key);
}

export const EDITOR_ROUTES = [
  { href: '/editors/org-chart', label: 'Organization Chart' },
  { href: '/editors/capability-graph', label: 'Capability Graph' },
  { href: '/editors/workflow-designer', label: 'Workflow Designer' },
  { href: '/editors/machine-layout', label: 'Machine Layout' },
  { href: '/editors/department-hierarchy', label: 'Department Hierarchy' },
  { href: '/editors/ai-workforce', label: 'AI Workforce Hierarchy' },
] as const;
