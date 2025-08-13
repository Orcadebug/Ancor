// Database model types for TypeScript

export interface User {
  id: string;
  email: string;
  password_hash: string;
  first_name: string;
  last_name: string;
  company?: string;
  role: 'user' | 'admin';
  email_verified: boolean;
  created_at: Date;
  updated_at: Date;
  last_login?: Date;
  is_active: boolean;
}

export interface AIModel {
  id: string;
  name: string;
  provider: 'openai' | 'anthropic' | 'meta' | 'custom';
  model_id: string;
  description?: string;
  pricing_per_token?: number;
  max_tokens?: number;
  supported_features: Record<string, boolean>;
  is_active: boolean;
  created_at: Date;
}

export interface CloudProvider {
  id: string;
  name: 'aws' | 'gcp' | 'azure';
  display_name: string;
  regions: string[];
  instance_types: Record<string, InstanceType>;
  pricing_info: Record<string, any>;
  is_active: boolean;
  created_at: Date;
}

export interface InstanceType {
  cpu: number;
  memory: number; // GB
  storage?: number; // GB
}

export interface UserAPIKey {
  id: string;
  user_id: string;
  provider: string;
  key_name: string;
  encrypted_key: string;
  created_at: Date;
  updated_at: Date;
  is_active: boolean;
}

export interface Deployment {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  ai_model_id: string;
  model_config: ModelConfig;
  cloud_provider_id: string;
  region: string;
  instance_type: string;
  rate_limit: number;
  security_config: SecurityConfig;
  status: 'draft' | 'deploying' | 'running' | 'stopped' | 'failed' | 'terminated';
  cloud_instance_id?: string;
  endpoint_url?: string;
  created_at: Date;
  updated_at: Date;
  deployed_at?: Date;
  last_health_check?: Date;
}

export interface ModelConfig {
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  custom_parameters?: Record<string, any>;
}

export interface SecurityConfig {
  ip_allowlist?: string[];
  require_api_key: boolean;
  cors_origins?: string[];
  rate_limit_per_ip?: number;
}

export interface DeploymentMetrics {
  id: string;
  deployment_id: string;
  timestamp: Date;
  response_time_ms?: number;
  requests_count: number;
  error_count: number;
  success_rate?: number;
  cpu_usage?: number;
  memory_usage?: number;
  disk_usage?: number;
  network_in_mb?: number;
  network_out_mb?: number;
  cost_usd: number;
}

export interface UsageAnalytics {
  id: string;
  user_id: string;
  deployment_id: string;
  date: Date;
  total_requests: number;
  total_errors: number;
  avg_response_time_ms?: number;
  total_cost_usd: number;
  input_tokens_used: number;
  output_tokens_used: number;
  created_at: Date;
}

export interface SystemLog {
  id: string;
  deployment_id?: string;
  user_id?: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';
  message: string;
  context?: Record<string, any>;
  created_at: Date;
}

export interface Alert {
  id: string;
  user_id: string;
  deployment_id?: string;
  alert_type: 'performance' | 'cost' | 'security' | 'maintenance';
  name: string;
  condition_config: AlertCondition;
  notification_channels: NotificationChannel[];
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface AlertCondition {
  metric: string;
  operator: '>' | '<' | '>=' | '<=' | '==' | '!=';
  threshold: number;
  duration_minutes?: number;
}

export interface NotificationChannel {
  type: 'email' | 'slack' | 'webhook';
  config: Record<string, string>;
}

export interface AlertIncident {
  id: string;
  alert_id: string;
  deployment_id?: string;
  status: 'active' | 'resolved' | 'acknowledged';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description?: string;
  triggered_at: Date;
  resolved_at?: Date;
  acknowledged_at?: Date;
}

export interface Backup {
  id: string;
  deployment_id: string;
  name: string;
  backup_type: 'manual' | 'scheduled' | 'auto';
  size_mb?: number;
  storage_location: string;
  checksum?: string;
  status: 'in_progress' | 'completed' | 'failed';
  created_at: Date;
  completed_at?: Date;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  timestamp: string;
}

// Authentication types
export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

export interface JWTPayload {
  user_id: string;
  email: string;
  role: string;
  iat: number;
  exp: number;
}