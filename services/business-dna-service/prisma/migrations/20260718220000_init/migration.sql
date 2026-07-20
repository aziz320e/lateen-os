-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "legalName" TEXT NOT NULL,
    "registrationNumber" TEXT NOT NULL,
    "taxId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "defaultCurrency" TEXT NOT NULL,
    "defaultLocale" TEXT NOT NULL,
    "timezone" TEXT NOT NULL,
    "foundedAt" DATE,
    "operatingModel" TEXT NOT NULL,
    "proactiveAiEnabled" BOOLEAN NOT NULL DEFAULT true,
    "aiCouncilPolicyId" TEXT,
    "defaultAiSupervisorId" TEXT,
    "aiDecisionThreshold" TEXT,
    "registeredAgentCount" INTEGER,
    "industryVerticals" JSONB NOT NULL DEFAULT '[]',
    "productionModel" TEXT NOT NULL,
    "serviceCoverage" TEXT NOT NULL,
    "defaultPaymentTerms" TEXT,
    "defaultSlaTier" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Branch" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "address" JSONB,
    "phone" TEXT,
    "email" TEXT,
    "currency" TEXT,
    "timezone" TEXT,
    "managerId" TEXT,
    "openedAt" DATE,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Branch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Department" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "branchId" TEXT,
    "parentDepartmentId" TEXT,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL,
    "headId" TEXT,
    "costCenter" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Department_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Employee" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "branchId" TEXT,
    "departmentId" TEXT,
    "employeeNumber" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "jobTitle" TEXT,
    "employmentType" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "managerId" TEXT,
    "hiredAt" DATE,
    "terminatedAt" DATE,
    "identityId" TEXT,
    "roleIds" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Employee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Role" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "parentRoleId" TEXT,
    "departmentId" TEXT,
    "permissionIds" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Permission" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "resource" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "policyId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Permission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "segment" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "data" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Supplier" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "data" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Supplier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "unitOfMeasure" TEXT NOT NULL,
    "productionType" TEXT NOT NULL,
    "data" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Service" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "pricingModel" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "data" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Service_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Machine" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "ownerDepartmentId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "data" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Machine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "projectType" TEXT NOT NULL,
    "deliveryModel" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "data" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Quotation" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "subtotal" TEXT NOT NULL,
    "discount" TEXT,
    "tax" TEXT,
    "total" TEXT NOT NULL,
    "lineItems" JSONB NOT NULL DEFAULT '[]',
    "data" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Quotation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "subtotal" TEXT NOT NULL,
    "discount" TEXT,
    "tax" TEXT,
    "total" TEXT NOT NULL,
    "lineItems" JSONB NOT NULL DEFAULT '[]',
    "data" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "subtotal" TEXT NOT NULL,
    "discount" TEXT,
    "tax" TEXT,
    "total" TEXT NOT NULL,
    "amountDue" TEXT NOT NULL,
    "lineItems" JSONB NOT NULL DEFAULT '[]',
    "data" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Workflow" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "stages" JSONB NOT NULL DEFAULT '[]',
    "data" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Workflow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Policy" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "data" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Policy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Kpi" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "frequency" TEXT NOT NULL,
    "data" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Kpi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Asset" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "data" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Asset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Agent" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "workforceType" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "proactiveEnabled" BOOLEAN NOT NULL DEFAULT true,
    "reactiveEnabled" BOOLEAN NOT NULL DEFAULT true,
    "data" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Agent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Organization_code_key" ON "Organization"("code");

-- CreateIndex
CREATE INDEX "Branch_organizationId_idx" ON "Branch"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "Branch_organizationId_code_key" ON "Branch"("organizationId", "code");

-- CreateIndex
CREATE INDEX "Department_organizationId_idx" ON "Department"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "Department_organizationId_code_key" ON "Department"("organizationId", "code");

-- CreateIndex
CREATE INDEX "Employee_organizationId_idx" ON "Employee"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "Employee_organizationId_employeeNumber_key" ON "Employee"("organizationId", "employeeNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Employee_organizationId_email_key" ON "Employee"("organizationId", "email");

-- CreateIndex
CREATE INDEX "Role_organizationId_idx" ON "Role"("organizationId");

-- CreateIndex
CREATE INDEX "Role_organizationId_type_idx" ON "Role"("organizationId", "type");

-- CreateIndex
CREATE INDEX "Role_organizationId_status_idx" ON "Role"("organizationId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Role_organizationId_code_key" ON "Role"("organizationId", "code");

-- CreateIndex
CREATE INDEX "Permission_organizationId_idx" ON "Permission"("organizationId");

-- CreateIndex
CREATE INDEX "Permission_organizationId_resource_idx" ON "Permission"("organizationId", "resource");

-- CreateIndex
CREATE INDEX "Permission_organizationId_action_idx" ON "Permission"("organizationId", "action");

-- CreateIndex
CREATE INDEX "Permission_organizationId_status_idx" ON "Permission"("organizationId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Permission_organizationId_code_key" ON "Permission"("organizationId", "code");

-- CreateIndex
CREATE INDEX "Customer_organizationId_idx" ON "Customer"("organizationId");

-- CreateIndex
CREATE INDEX "Customer_organizationId_status_idx" ON "Customer"("organizationId", "status");

-- CreateIndex
CREATE INDEX "Customer_organizationId_segment_idx" ON "Customer"("organizationId", "segment");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_organizationId_code_key" ON "Customer"("organizationId", "code");

-- CreateIndex
CREATE INDEX "Supplier_organizationId_idx" ON "Supplier"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "Supplier_organizationId_code_key" ON "Supplier"("organizationId", "code");

-- CreateIndex
CREATE INDEX "Product_organizationId_idx" ON "Product"("organizationId");

-- CreateIndex
CREATE INDEX "Product_organizationId_category_idx" ON "Product"("organizationId", "category");

-- CreateIndex
CREATE INDEX "Product_organizationId_status_idx" ON "Product"("organizationId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Product_organizationId_code_key" ON "Product"("organizationId", "code");

-- CreateIndex
CREATE INDEX "Service_organizationId_idx" ON "Service"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "Service_organizationId_code_key" ON "Service"("organizationId", "code");

-- CreateIndex
CREATE INDEX "Machine_organizationId_idx" ON "Machine"("organizationId");

-- CreateIndex
CREATE INDEX "Machine_organizationId_branchId_idx" ON "Machine"("organizationId", "branchId");

-- CreateIndex
CREATE INDEX "Machine_organizationId_status_idx" ON "Machine"("organizationId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Machine_organizationId_code_key" ON "Machine"("organizationId", "code");

-- CreateIndex
CREATE INDEX "Project_organizationId_idx" ON "Project"("organizationId");

-- CreateIndex
CREATE INDEX "Project_organizationId_status_idx" ON "Project"("organizationId", "status");

-- CreateIndex
CREATE INDEX "Project_organizationId_projectType_idx" ON "Project"("organizationId", "projectType");

-- CreateIndex
CREATE UNIQUE INDEX "Project_organizationId_code_key" ON "Project"("organizationId", "code");

-- CreateIndex
CREATE INDEX "Quotation_organizationId_idx" ON "Quotation"("organizationId");

-- CreateIndex
CREATE INDEX "Quotation_organizationId_customerId_idx" ON "Quotation"("organizationId", "customerId");

-- CreateIndex
CREATE INDEX "Quotation_organizationId_status_idx" ON "Quotation"("organizationId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Quotation_organizationId_number_key" ON "Quotation"("organizationId", "number");

-- CreateIndex
CREATE INDEX "Order_organizationId_idx" ON "Order"("organizationId");

-- CreateIndex
CREATE INDEX "Order_organizationId_customerId_idx" ON "Order"("organizationId", "customerId");

-- CreateIndex
CREATE INDEX "Order_organizationId_status_idx" ON "Order"("organizationId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Order_organizationId_number_key" ON "Order"("organizationId", "number");

-- CreateIndex
CREATE INDEX "Invoice_organizationId_idx" ON "Invoice"("organizationId");

-- CreateIndex
CREATE INDEX "Invoice_organizationId_status_idx" ON "Invoice"("organizationId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_organizationId_number_key" ON "Invoice"("organizationId", "number");

-- CreateIndex
CREATE INDEX "Workflow_organizationId_idx" ON "Workflow"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "Workflow_organizationId_code_version_key" ON "Workflow"("organizationId", "code", "version");

-- CreateIndex
CREATE INDEX "Policy_organizationId_idx" ON "Policy"("organizationId");

-- CreateIndex
CREATE INDEX "Policy_organizationId_type_idx" ON "Policy"("organizationId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "Policy_organizationId_code_key" ON "Policy"("organizationId", "code");

-- CreateIndex
CREATE INDEX "Kpi_organizationId_idx" ON "Kpi"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "Kpi_organizationId_code_key" ON "Kpi"("organizationId", "code");

-- CreateIndex
CREATE INDEX "Asset_organizationId_idx" ON "Asset"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "Asset_organizationId_code_key" ON "Asset"("organizationId", "code");

-- CreateIndex
CREATE INDEX "Agent_organizationId_idx" ON "Agent"("organizationId");

-- CreateIndex
CREATE INDEX "Agent_organizationId_workforceType_idx" ON "Agent"("organizationId", "workforceType");

-- CreateIndex
CREATE UNIQUE INDEX "Agent_organizationId_code_key" ON "Agent"("organizationId", "code");

-- AddForeignKey
ALTER TABLE "Branch" ADD CONSTRAINT "Branch_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Department" ADD CONSTRAINT "Department_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Role" ADD CONSTRAINT "Role_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Permission" ADD CONSTRAINT "Permission_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Supplier" ADD CONSTRAINT "Supplier_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Service" ADD CONSTRAINT "Service_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Machine" ADD CONSTRAINT "Machine_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quotation" ADD CONSTRAINT "Quotation_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Workflow" ADD CONSTRAINT "Workflow_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Policy" ADD CONSTRAINT "Policy_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Kpi" ADD CONSTRAINT "Kpi_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Asset" ADD CONSTRAINT "Asset_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Agent" ADD CONSTRAINT "Agent_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
