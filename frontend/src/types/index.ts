export type Stage =
  | 'Lead'
  | 'Discovery'
  | 'Qualified'
  | 'Proposal'
  | 'Negotiation'
  | 'Closed Won'
  | 'Closed Lost';

export interface Company {
  id: string;
  name: string;
  industry: string;
  website?: string;
  size: string;
  location: string;
  contacts?: Contact[];
}

export interface Contact {
  id: string;
  company_id: string;
  name: string;
  role: string;
  email?: string;
  phone?: string;
}

export interface Deal {
  id: string;
  company_id: string;
  name: string;
  stage: Stage;
  value: number;
  currency: string;
  probability: number;
  expected_close_date?: string;
  owner_id?: string;
  status: string;
  created_at: string;
  updated_at: string;
  company?: Company;
  health_score?: number;
  next_action?: string;
  interactions?: Interaction[];
  tasks?: Task[];
}

export interface Interaction {
  id: string;
  deal_id: string;
  type: string;
  title: string;
  content: string;
  participants: string;
  outcome?: string;
  next_steps?: string;
  occurred_at: string;
  created_at: string;
}

export interface Task {
  id: string;
  deal_id: string;
  title: string;
  description?: string;
  due_date?: string;
  status: string;
  priority: string;
}

export interface MemoryItem {
  id: string;
  deal_id: string;
  company_id?: string;
  memory_type: string;
  fact: string;
  importance: 'low' | 'medium' | 'high' | 'critical';
  source_interaction_id?: string;
  source_title?: string;
  timestamp: string;
  confidence: number;
  tags: string[];
}

export interface MemorySourceRef {
  memory_type: string;
  fact: string;
  source_interaction?: string;
  occurred_at?: string;
}

export interface MeetingBriefResponse {
  deal_id: string;
  company_name: string;
  deal_value_formatted: string;
  stage: string;
  customer_snapshot: Record<string, any>;
  what_they_care_about: string[];
  previous_objections: string[];
  competitors: string[];
  unresolved_commitments: string[];
  recommended_talking_points: string[];
  risks: string[];
  suggested_next_step: string;
  why_explanation: string;
  memory_sources: MemorySourceRef[];
}

export interface FollowUpResponse {
  subject: string;
  body: string;
  addressed_points: string[];
  commitments_included: string[];
  memory_references_used: string[];
}

export interface ObjectionDetail {
  category: string;
  severity: string;
  frequency: number;
  first_detected?: string;
  last_detected?: string;
  related_interactions: string[];
  sales_response_used: string;
  resolution_status: string;
  ai_recommendation: string;
  why_explanation: string;
}

export interface HealthFactor {
  name: string;
  status: 'positive' | 'warning' | 'negative';
  weight: number;
  details: string;
}

export interface DealHealthResponse {
  deal_id: string;
  score: number;
  status_label: string;
  summary: string;
  factors: HealthFactor[];
  why_explanation: string;
}

export interface MemoryComparisonResponse {
  query: string;
  deal_id: string;
  deal_name: string;
  without_memory_response: string;
  with_memory_response: string;
  key_memory_differentiators: string[];
  retrieved_memory_count: number;
  memory_highlights: MemorySourceRef[];
}

export interface MemoryGrowthDataPoint {
  interaction: string;
  interactions_count: number;
  facts_known: number;
  objections_tracked: number;
  strategic_depth_score: number;
}

export type UserRole = 'sales_rep' | 'sales_manager' | 'admin';

export interface Organization {
  id: string;
  name: string;
  created_at?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  organization_id?: string;
  organization_name?: string;
  is_active?: boolean;
  created_at?: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
  organization?: Organization;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  confirm_password?: string;
  company_name: string;
  role?: UserRole | string;
}

export interface LoginPayload {
  email: string;
  password: string;
}
