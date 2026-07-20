import type { MissionTypeCode, MissionTypeDefinition } from '../domain/types';

export const MISSION_TYPE_CATALOG: MissionTypeDefinition[] = [
  def('LAUNCH_PRODUCT', 'Launch Product', 'Start a product launch mission via AI Product Manager', 'ai-product-manager'),
  def('MARKET_RESEARCH', 'Market Research', 'Scheduled market research from discovery signals', 'product-discovery'),
  def('COMPETITOR_REVIEW', 'Competitor Review', 'Periodic competitor intelligence review', 'product-discovery'),
  def('PRICE_OPTIMIZATION', 'Price Optimization', 'Pricing review mission', 'ai-product-manager'),
  def('CUSTOMER_FOLLOW_UP', 'Customer Follow-up', 'Customer engagement follow-up mission', 'business-dna-service'),
  def('SALES_PIPELINE_REVIEW', 'Sales Pipeline Review', 'Sales pipeline analysis mission', 'business-dna-service'),
  def('PRODUCTION_OPTIMIZATION', 'Production Optimization', 'Production efficiency review', 'workflow-engine'),
  def('INVENTORY_REVIEW', 'Inventory Review', 'Inventory level review mission', 'business-dna-service'),
  def('EXECUTIVE_REPORT', 'Executive Report', 'Executive summary generation', 'ceo-cockpit'),
  def('FINANCIAL_REVIEW', 'Financial Review', 'Financial KPI review mission', 'business-dna-service'),
  def('COMPLIANCE_AUDIT', 'Compliance Audit', 'Policy compliance audit mission', 'decision-engine'),
];

function def(code: MissionTypeCode, name: string, description: string, targetService: string): MissionTypeDefinition {
  return { id: code.toLowerCase(), code, name, description, targetService };
}

export function getMissionType(code: MissionTypeCode): MissionTypeDefinition | undefined {
  return MISSION_TYPE_CATALOG.find((m) => m.code === code);
}
