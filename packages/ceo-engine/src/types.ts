export type AgentId = 'seo' | 'marketing' | 'sales' | 'product' | 'operations' | 'finance';

export type MissionPriority = 'low' | 'medium' | 'high' | 'critical';
export type MissionStatus = 'pending' | 'running' | 'completed' | 'failed';

export interface Mission {
  id: string;
  organizationId: string;
  title: string;
  description: string;
  priority: MissionPriority;
  assignedTo?: AgentId;
  status: MissionStatus;
  /** Set when {@link MissionStatus} transitions to "failed". */
  failureReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AgentTask {
  agent: AgentId;
  missionId: string;
  instruction: string;
}

export interface AgentResult {
  missionId: string;
  success: boolean;
  message: string;
}
