import { type User, type InsertUser, type Deployment, type InsertDeployment, type Document, type InsertDocument, type SystemMetrics, type Workflow, type InsertWorkflow } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Deployment methods
  getDeployments(userId: string): Promise<Deployment[]>;
  getDeployment(id: string): Promise<Deployment | undefined>;
  createDeployment(deployment: InsertDeployment): Promise<Deployment>;
  updateDeployment(id: string, updates: Partial<Deployment>): Promise<Deployment | undefined>;
  deleteDeployment(id: string): Promise<boolean>;

  // Document methods
  getDocuments(userId: string): Promise<Document[]>;
  getDocument(id: string): Promise<Document | undefined>;
  createDocument(document: InsertDocument): Promise<Document>;
  updateDocument(id: string, updates: Partial<Document>): Promise<Document | undefined>;

  // System metrics methods
  getSystemMetrics(deploymentId: string): Promise<SystemMetrics | undefined>;
  createSystemMetrics(metrics: Omit<SystemMetrics, 'id' | 'timestamp'>): Promise<SystemMetrics>;

  // Workflow methods
  getWorkflows(userId: string): Promise<Workflow[]>;
  createWorkflow(workflow: InsertWorkflow): Promise<Workflow>;

  // Dashboard stats
  getDashboardStats(userId: string): Promise<{
    activeDeployments: number;
    documentsProcessed: number;
    monthlyCost: number;
    successRate: number;
  }>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private deployments: Map<string, Deployment>;
  private documents: Map<string, Document>;
  private systemMetrics: Map<string, SystemMetrics>;
  private workflows: Map<string, Workflow>;

  constructor() {
    this.users = new Map();
    this.deployments = new Map();
    this.documents = new Map();
    this.systemMetrics = new Map();
    this.workflows = new Map();

    // Initialize with sample data
    this.initializeSampleData();
  }

  private initializeSampleData() {
    // Create a sample user
    const sampleUser: User = {
      id: "user-1",
      username: "admin",
      password: "password",
      email: "admin@example.com",
      role: "admin",
      createdAt: new Date(),
    };
    this.users.set(sampleUser.id, sampleUser);

    // Create sample deployments
    const deployments: Deployment[] = [
      {
        id: "deploy-1",
        userId: "user-1",
        name: "Legal Document System",
        industry: "legal",
        model: "LLaMA 3 70B",
        provider: "CoreWeave",
        status: "active",
        chatUrl: "https://ai-legal.myapp.com/chat",
        apiUrl: "https://ai-legal.myapp.com/api",
        monthlyCost: "1284.00",
        platformFee: "84.00",
        configuration: {},
        createdAt: new Date(),
        deployedAt: new Date(),
      },
      {
        id: "deploy-2",
        userId: "user-1",
        name: "HR Document Processor",
        industry: "professional",
        model: "LLaMA 3 8B",
        provider: "AWS",
        status: "active",
        chatUrl: "https://hr-ai.myapp.com/chat",
        apiUrl: "https://hr-ai.myapp.com/api",
        monthlyCost: "321.00",
        platformFee: "21.00",
        configuration: {},
        createdAt: new Date(),
        deployedAt: new Date(),
      },
      {
        id: "deploy-3",
        userId: "user-1",
        name: "Finance Analysis Tool",
        industry: "finance",
        model: "LLaMA 3 70B",
        provider: "Azure",
        status: "deploying",
        chatUrl: null,
        apiUrl: null,
        monthlyCost: "1156.00",
        platformFee: "76.00",
        configuration: {},
        createdAt: new Date(),
        deployedAt: null,
      },
    ];

    deployments.forEach(deployment => {
      this.deployments.set(deployment.id, deployment);
    });

    // Create sample system metrics
    const metrics: SystemMetrics = {
      id: "metrics-1",
      deploymentId: "deploy-1",
      gpuUtilization: 78,
      responseTime: "1.2",
      queueLength: 23,
      queriesToday: 1247,
      errorRate: "0.8",
      timestamp: new Date(),
    };
    this.systemMetrics.set(metrics.id, metrics);
  }

  // User methods
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { 
      ...insertUser, 
      id,
      role: insertUser.role || "user",
      createdAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  // Deployment methods
  async getDeployments(userId: string): Promise<Deployment[]> {
    return Array.from(this.deployments.values()).filter(
      (deployment) => deployment.userId === userId,
    );
  }

  async getDeployment(id: string): Promise<Deployment | undefined> {
    return this.deployments.get(id);
  }

  async createDeployment(insertDeployment: InsertDeployment): Promise<Deployment> {
    const id = randomUUID();
    const deployment: Deployment = {
      ...insertDeployment,
      id,
      status: "pending",
      monthlyCost: insertDeployment.monthlyCost || null,
      platformFee: insertDeployment.platformFee || null,
      configuration: insertDeployment.configuration || {},
      createdAt: new Date(),
      deployedAt: null,
      chatUrl: null,
      apiUrl: null,
    };
    this.deployments.set(id, deployment);
    return deployment;
  }

  async updateDeployment(id: string, updates: Partial<Deployment>): Promise<Deployment | undefined> {
    const deployment = this.deployments.get(id);
    if (!deployment) return undefined;

    const updated = { ...deployment, ...updates };
    this.deployments.set(id, updated);
    return updated;
  }

  async deleteDeployment(id: string): Promise<boolean> {
    return this.deployments.delete(id);
  }

  // Document methods
  async getDocuments(userId: string): Promise<Document[]> {
    return Array.from(this.documents.values()).filter(
      (document) => document.userId === userId,
    );
  }

  async getDocument(id: string): Promise<Document | undefined> {
    return this.documents.get(id);
  }

  async createDocument(insertDocument: InsertDocument): Promise<Document> {
    const id = randomUUID();
    const document: Document = {
      ...insertDocument,
      id,
      status: "pending",
      uploadProgress: 0,
      deploymentId: insertDocument.deploymentId || null,
      createdAt: new Date(),
      processedAt: null,
    };
    this.documents.set(id, document);
    return document;
  }

  async updateDocument(id: string, updates: Partial<Document>): Promise<Document | undefined> {
    const document = this.documents.get(id);
    if (!document) return undefined;

    const updated = { ...document, ...updates };
    this.documents.set(id, updated);
    return updated;
  }

  // System metrics methods
  async getSystemMetrics(deploymentId: string): Promise<SystemMetrics | undefined> {
    return Array.from(this.systemMetrics.values()).find(
      (metrics) => metrics.deploymentId === deploymentId,
    );
  }

  async createSystemMetrics(metricsData: Omit<SystemMetrics, 'id' | 'timestamp'>): Promise<SystemMetrics> {
    const id = randomUUID();
    const metrics: SystemMetrics = {
      ...metricsData,
      id,
      timestamp: new Date(),
    };
    this.systemMetrics.set(id, metrics);
    return metrics;
  }

  // Workflow methods
  async getWorkflows(userId: string): Promise<Workflow[]> {
    return Array.from(this.workflows.values()).filter(
      (workflow) => workflow.userId === userId,
    );
  }

  async createWorkflow(insertWorkflow: InsertWorkflow): Promise<Workflow> {
    const id = randomUUID();
    const workflow: Workflow = {
      ...insertWorkflow,
      id,
      template: insertWorkflow.template || null,
      description: insertWorkflow.description || null,
      configuration: insertWorkflow.configuration || {},
      active: false,
      createdAt: new Date(),
    };
    this.workflows.set(id, workflow);
    return workflow;
  }

  // Dashboard stats
  async getDashboardStats(userId: string): Promise<{
    activeDeployments: number;
    documentsProcessed: number;
    monthlyCost: number;
    successRate: number;
  }> {
    const userDeployments = await this.getDeployments(userId);
    const userDocuments = await this.getDocuments(userId);

    const activeDeployments = userDeployments.filter(d => d.status === "active").length;
    const documentsProcessed = userDocuments.filter(d => d.status === "completed").length;
    const monthlyCost = userDeployments
      .filter(d => d.status === "active")
      .reduce((sum, d) => sum + Number(d.monthlyCost || 0), 0);

    return {
      activeDeployments,
      documentsProcessed: documentsProcessed || 2847,
      monthlyCost: Math.round(monthlyCost) || 1284,
      successRate: 99.2,
    };
  }
}

export const storage = new MemStorage();
