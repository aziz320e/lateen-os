-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "DiscoveryRun" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "currentStage" TEXT,
    "keywords" JSONB NOT NULL DEFAULT '[]',
    "startedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "stageResults" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DiscoveryRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Signal" (
    "id" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "signalType" TEXT NOT NULL,
    "source" TEXT,
    "data" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Signal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Opportunity" (
    "id" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Opportunity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CapabilityMatchRecord" (
    "id" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CapabilityMatchRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProfitEstimateRecord" (
    "id" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProfitEstimateRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecommendationRecord" (
    "id" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecommendationRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkflowExecution" (
    "id" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "stage" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    "input" JSONB,
    "output" JSONB,
    "errorMessage" TEXT,

    CONSTRAINT "WorkflowExecution_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DiscoveryRun_organizationId_idx" ON "DiscoveryRun"("organizationId");

-- CreateIndex
CREATE INDEX "DiscoveryRun_status_idx" ON "DiscoveryRun"("status");

-- CreateIndex
CREATE INDEX "Signal_runId_idx" ON "Signal"("runId");

-- CreateIndex
CREATE INDEX "Signal_organizationId_idx" ON "Signal"("organizationId");

-- CreateIndex
CREATE INDEX "Opportunity_runId_idx" ON "Opportunity"("runId");

-- CreateIndex
CREATE INDEX "CapabilityMatchRecord_runId_idx" ON "CapabilityMatchRecord"("runId");

-- CreateIndex
CREATE INDEX "ProfitEstimateRecord_runId_idx" ON "ProfitEstimateRecord"("runId");

-- CreateIndex
CREATE INDEX "RecommendationRecord_runId_idx" ON "RecommendationRecord"("runId");

-- CreateIndex
CREATE INDEX "RecommendationRecord_organizationId_idx" ON "RecommendationRecord"("organizationId");

-- CreateIndex
CREATE INDEX "WorkflowExecution_runId_idx" ON "WorkflowExecution"("runId");

-- CreateIndex
CREATE UNIQUE INDEX "WorkflowExecution_runId_stage_key" ON "WorkflowExecution"("runId", "stage");

-- AddForeignKey
ALTER TABLE "Signal" ADD CONSTRAINT "Signal_runId_fkey" FOREIGN KEY ("runId") REFERENCES "DiscoveryRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Opportunity" ADD CONSTRAINT "Opportunity_runId_fkey" FOREIGN KEY ("runId") REFERENCES "DiscoveryRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CapabilityMatchRecord" ADD CONSTRAINT "CapabilityMatchRecord_runId_fkey" FOREIGN KEY ("runId") REFERENCES "DiscoveryRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfitEstimateRecord" ADD CONSTRAINT "ProfitEstimateRecord_runId_fkey" FOREIGN KEY ("runId") REFERENCES "DiscoveryRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecommendationRecord" ADD CONSTRAINT "RecommendationRecord_runId_fkey" FOREIGN KEY ("runId") REFERENCES "DiscoveryRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowExecution" ADD CONSTRAINT "WorkflowExecution_runId_fkey" FOREIGN KEY ("runId") REFERENCES "DiscoveryRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;
