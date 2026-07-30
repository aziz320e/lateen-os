-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "mirror_organizations" (
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
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "mirroredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mirror_organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mirror_business_profiles" (
    "organizationId" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "legalEntity" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "mirroredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mirror_business_profiles_pkey" PRIMARY KEY ("organizationId")
);

-- CreateTable
CREATE TABLE "mirror_products" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "productionType" TEXT NOT NULL,
    "unitOfMeasure" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "basePrice" TEXT,
    "costPrice" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "mirroredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mirror_products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mirror_employees" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "employeeNumber" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "employmentType" TEXT NOT NULL,
    "employmentStatus" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "mirroredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mirror_employees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mirror_customers" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "company" TEXT,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "mirroredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mirror_customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mirror_warehouses" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "mirroredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mirror_warehouses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mirror_accounts" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "accountType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "mirroredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mirror_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mirror_projects" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "customerId" TEXT,
    "status" TEXT NOT NULL,
    "startDate" DATE,
    "targetEndDate" DATE,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "mirroredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mirror_projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth_users" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "auth_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth_roles" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "auth_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth_permissions" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "auth_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth_permission_groups" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "auth_permission_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth_permission_group_permissions" (
    "permissionGroupId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,

    CONSTRAINT "auth_permission_group_permissions_pkey" PRIMARY KEY ("permissionGroupId","permissionId")
);

-- CreateTable
CREATE TABLE "auth_role_permission_groups" (
    "roleId" TEXT NOT NULL,
    "permissionGroupId" TEXT NOT NULL,

    CONSTRAINT "auth_role_permission_groups_pkey" PRIMARY KEY ("roleId","permissionGroupId")
);

-- CreateTable
CREATE TABLE "auth_role_assignments" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "auth_role_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth_sessions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "userAgent" TEXT,
    "ipAddress" TEXT,

    CONSTRAINT "auth_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth_refresh_tokens" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "replacedByTokenId" TEXT,

    CONSTRAINT "auth_refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "mirror_organizations_code_key" ON "mirror_organizations"("code");

-- CreateIndex
CREATE UNIQUE INDEX "mirror_products_organizationId_code_key" ON "mirror_products"("organizationId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "mirror_employees_organizationId_employeeNumber_key" ON "mirror_employees"("organizationId", "employeeNumber");

-- CreateIndex
CREATE UNIQUE INDEX "mirror_warehouses_organizationId_code_key" ON "mirror_warehouses"("organizationId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "mirror_accounts_organizationId_code_key" ON "mirror_accounts"("organizationId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "mirror_projects_organizationId_code_key" ON "mirror_projects"("organizationId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "auth_users_organizationId_email_key" ON "auth_users"("organizationId", "email");

-- CreateIndex
CREATE UNIQUE INDEX "auth_roles_organizationId_name_key" ON "auth_roles"("organizationId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "auth_permissions_code_key" ON "auth_permissions"("code");

-- CreateIndex
CREATE UNIQUE INDEX "auth_permission_groups_name_key" ON "auth_permission_groups"("name");

-- CreateIndex
CREATE UNIQUE INDEX "auth_role_assignments_userId_roleId_key" ON "auth_role_assignments"("userId", "roleId");

-- CreateIndex
CREATE UNIQUE INDEX "auth_refresh_tokens_tokenHash_key" ON "auth_refresh_tokens"("tokenHash");

-- AddForeignKey
ALTER TABLE "mirror_business_profiles" ADD CONSTRAINT "mirror_business_profiles_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "mirror_organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mirror_products" ADD CONSTRAINT "mirror_products_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "mirror_organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mirror_employees" ADD CONSTRAINT "mirror_employees_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "mirror_organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mirror_customers" ADD CONSTRAINT "mirror_customers_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "mirror_organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mirror_warehouses" ADD CONSTRAINT "mirror_warehouses_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "mirror_organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mirror_accounts" ADD CONSTRAINT "mirror_accounts_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "mirror_organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mirror_projects" ADD CONSTRAINT "mirror_projects_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "mirror_organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth_users" ADD CONSTRAINT "auth_users_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "mirror_organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth_roles" ADD CONSTRAINT "auth_roles_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "mirror_organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth_permission_group_permissions" ADD CONSTRAINT "auth_permission_group_permissions_permissionGroupId_fkey" FOREIGN KEY ("permissionGroupId") REFERENCES "auth_permission_groups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth_permission_group_permissions" ADD CONSTRAINT "auth_permission_group_permissions_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "auth_permissions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth_role_permission_groups" ADD CONSTRAINT "auth_role_permission_groups_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "auth_roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth_role_permission_groups" ADD CONSTRAINT "auth_role_permission_groups_permissionGroupId_fkey" FOREIGN KEY ("permissionGroupId") REFERENCES "auth_permission_groups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth_role_assignments" ADD CONSTRAINT "auth_role_assignments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "auth_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth_role_assignments" ADD CONSTRAINT "auth_role_assignments_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "auth_roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth_sessions" ADD CONSTRAINT "auth_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "auth_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth_refresh_tokens" ADD CONSTRAINT "auth_refresh_tokens_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "auth_sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

