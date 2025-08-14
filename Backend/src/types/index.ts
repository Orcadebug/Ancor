import { Request } from 'express';

// User and Authentication Types
export interface User {
  id: string;
  email: string;
  name: string;
  organizationId: string;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export enum UserRole {
  ADMIN = 'ADMIN',
  EDITOR = 'EDITOR',
  VIEWER = 'VIEWER'
}

export interface AuthenticatedRequest extends Request {
  user?: User;
}

// Organization Types
export interface Organization {
  id: string;
  name: string;
  industry: Industry;
  teamSize: TeamSize;
  documentVolume: DocumentVolume;
  stripeCustomerId?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export enum Industry {
  LEGAL = 'LEGAL',
  HEALTHCARE = 'HEALTHCARE',
  FINANCE = 'FINANCE',
  PROFESSIONAL = 'PROFESSIONAL'
}

export enum TeamSize {
  SMALL = '1-5',
  MEDIUM = '6-20', 
  LARGE = '21-100',
  ENTERPRISE = '100+'
}

export enum DocumentVolume {
  LOW = '1-100',
  MEDIUM = '101-1000',
  HIGH = '1001-10000',
  ENTERPRISE = '10000+'
}

// Deployment Types
export interface Deployment {
  id: string;
  organizationId: string;
  name: string;
  industry: Industry;
  useCase: string;
  modelId: string;
  region: Region;
  compliance: ComplianceType;
  status: DeploymentStatus;
  infrastructure: InfrastructureConfig;
  endpoints: DeploymentEndpoints;
  costEstimate: number;
  actualCost: number;
  createdAt: Date;
  updatedAt: Date;
}

export enum Region {
  US_EAST = 'us-east',
  US_WEST = 'us-west', 
  EU_CENTRAL = 'eu-central'
}

export enum ComplianceType {
  SOC2 = 'SOC2',
  HIPAA = 'HIPAA',
  LEGAL = 'LEGAL',
  GDPR = 'GDPR'
}

export enum DeploymentStatus {
  PENDING = 'PENDING',
  PROVISIONING = 'PROVISIONING',
  DEPLOYING = 'DEPLOYING',
  RUNNING = 'RUNNING',
  STOPPING = 'STOPPING',
  STOPPED = 'STOPPED',
  FAILED = 'FAILED'
}

export interface InfrastructureConfig {
  gpuType: string;
  gpuCount: number;
  memoryGB: number;
  storageGB: number;
  networkBandwidth: string;
}

export interface DeploymentEndpoints {
  chatUI: string;
  apiEndpoint: string;
  n8nWorkflows: string;
  adminDashboard: string;
}

// AI Model Types
export interface AIModel {
  id: string;
  name: string;
  type: ModelType;
  parameters: string;
  vramRequirement: number;
  tokensPerDay: number;
  monthlyPrice: number;
  description: string;
  isRecommended: boolean;
}

export enum ModelType {
  LIGHTWEIGHT = 'LIGHTWEIGHT',
  RECOMMENDED = 'RECOMMENDED',
  ENTERPRISE = 'ENTERPRISE'
}

// Document Types
export interface Document {
  id: string;
  organizationId: string;
  deploymentId: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  s3Key: string;
  status: DocumentStatus;
  extractedText?: string;
  summary?: string;
  metadata: DocumentMetadata;
  embeddings?: number[];
  createdAt: Date;
  updatedAt: Date;
}

export enum DocumentStatus {
  UPLOADED = 'UPLOADED',
  PROCESSING = 'PROCESSING',
  PROCESSED = 'PROCESSED',
  FAILED = 'FAILED'
}

export interface DocumentMetadata {
  pages?: number;
  language?: string;
  keywords?: string[];
  entities?: string[];
  sentiment?: number;
  category?: string;
}

// Chat and Query Types
export interface ChatSession {
  id: string;
  organizationId: string;
  deploymentId: string;
  userId: string;
  title: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatMessage {
  id: string;
  sessionId: string;
  content: string;
  role: MessageRole;
  sources?: DocumentSource[];
  metadata?: MessageMetadata;
  createdAt: Date;
}

export enum MessageRole {
  USER = 'USER',
  ASSISTANT = 'ASSISTANT',
  SYSTEM = 'SYSTEM'
}

export interface DocumentSource {
  documentId: string;
  filename: string;
  pageNumber?: number;
  snippet: string;
  relevanceScore: number;
}

export interface MessageMetadata {
  tokensUsed?: number;
  responseTime?: number;
  modelUsed?: string;
  confidence?: number;
}

// Workflow Types
export interface Workflow {
  id: string;
  organizationId: string;
  deploymentId: string;
  name: string;
  description: string;
  template: WorkflowTemplate;
  n8nWorkflowId: string;
  isActive: boolean;
  configuration: WorkflowConfig;
  createdAt: Date;
  updatedAt: Date;
}

export enum WorkflowTemplate {
  DOCUMENT_AUTO_PROCESSING = 'DOCUMENT_AUTO_PROCESSING',
  DAILY_DIGEST = 'DAILY_DIGEST',
  QUESTION_ROUTING = 'QUESTION_ROUTING',
  COMPLIANCE_MONITORING = 'COMPLIANCE_MONITORING'
}

export interface WorkflowConfig {
  triggers: WorkflowTrigger[];
  actions: WorkflowAction[];
  schedule?: string;
  integrations: WorkflowIntegration[];
}

export interface WorkflowTrigger {
  type: string;
  config: Record<string, any>;
}

export interface WorkflowAction {
  type: string;
  config: Record<string, any>;
}

export interface WorkflowIntegration {
  service: string;
  credentials: Record<string, any>;
}

// Usage and Billing Types
export interface UsageMetric {
  id: string;
  organizationId: string;
  deploymentId: string;
  metricType: MetricType;
  value: number;
  unit: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export enum MetricType {
  API_REQUESTS = 'API_REQUESTS',
  DOCUMENTS_PROCESSED = 'DOCUMENTS_PROCESSED',
  TOKENS_USED = 'TOKENS_USED',
  STORAGE_USED = 'STORAGE_USED',
  COMPUTE_HOURS = 'COMPUTE_HOURS',
  BANDWIDTH_USED = 'BANDWIDTH_USED'
}

export interface BillingRecord {
  id: string;
  organizationId: string;
  period: string;
  hostingCost: number;
  platformFee: number;
  totalCost: number;
  stripeInvoiceId?: string;
  status: BillingStatus;
  dueDate: Date;
  paidAt?: Date;
  createdAt: Date;
}

export enum BillingStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  OVERDUE = 'OVERDUE',
  FAILED = 'FAILED'
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Error Types
export interface AppError extends Error {
  statusCode: number;
  isOperational: boolean;
}

// Deployment Progress Types
export interface DeploymentProgress {
  deploymentId: string;
  step: number;
  totalSteps: number;
  currentTask: string;
  progress: number;
  logs: string[];
  startedAt: Date;
  estimatedCompletion?: Date;
}