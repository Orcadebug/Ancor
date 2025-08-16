// API client for AI Infrastructure Management Platform

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

class ApiClient {
  private token: string | null = null;

  constructor() {
    // Get token from localStorage on initialization
    this.token = localStorage.getItem('auth_token');
  }

  setToken(token: string) {
    this.token = token;
    localStorage.setItem('auth_token', token);
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('auth_token');
  }

  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options.headers as Record<string, string>,
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      if (response.status === 401) {
        this.clearToken();
        window.location.href = '/login';
        throw new Error('Unauthorized');
      }
      
      const errorData = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(errorData.error?.message || errorData.message || 'Request failed');
    }

    return response.json();
  }

  // Auth methods
  async login(email: string, password: string) {
    const response = await this.request<{ token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    
    if (response.token) {
      this.setToken(response.token);
    }
    
    return response;
  }

  async register(userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    companyName?: string;
  }) {
    return this.request<{ user: any }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async getCurrentUser() {
    return this.request<{ user: any }>('/auth/me');
  }

  async logout() {
    this.clearToken();
  }

  // Organizations
  async getOrganizations() {
    return this.request<{ organizations: any[] }>('/organizations');
  }

  // Deployments
  async getDeployments(organizationId: string, params?: any) {
    const query = params ? `?${new URLSearchParams(params).toString()}` : '';
    return this.request<{ deployments: any[]; pagination: any }>(`/deployments/organization/${organizationId}${query}`);
  }

  async getDeployment(deploymentId: string) {
    return this.request<{ deployment: any }>(`/deployments/${deploymentId}`);
  }

  async createDeployment(data: any) {
    return this.request<{ deployment: any }>('/deployments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateDeploymentStatus(deploymentId: string, data: any) {
    return this.request<{ deployment: any }>(`/deployments/${deploymentId}/status`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteDeployment(deploymentId: string) {
    return this.request<void>(`/deployments/${deploymentId}`, {
      method: 'DELETE',
    });
  }

  async getDeploymentMetrics(deploymentId: string, days: number = 7) {
    return this.request<{ metrics: any[]; summary: any }>(`/deployments/${deploymentId}/metrics?days=${days}`);
  }

  // Documents
  async uploadDocument(file: File, deploymentId?: string) {
    const formData = new FormData();
    formData.append('file', file);
    if (deploymentId) {
      formData.append('deploymentId', deploymentId);
    }

    const headers: Record<string, string> = {};
    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    const response = await fetch(`${API_BASE_URL}/documents/upload`, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Upload failed' }));
      throw new Error(errorData.error?.message || errorData.message || 'Upload failed');
    }

    return response.json();
  }

  async getDocuments(organizationId: string) {
    return this.request<{ documents: any[] }>(`/documents/organization/${organizationId}`);
  }

  // Workflows
  async getWorkflowTemplates(industry?: string) {
    const query = industry ? `?industry=${industry}` : '';
    return this.request<{ templates: any[] }>(`/workflows/templates${query}`);
  }

  async deployWorkflow(data: {
    templateId: string;
    deploymentId: string;
    configuration?: any;
  }) {
    return this.request<{ workflow: any }>('/workflows/deploy', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getDeploymentWorkflows(deploymentId: string) {
    return this.request<{ workflows: any[] }>(`/workflows/deployment/${deploymentId}`);
  }

  async toggleWorkflow(workflowId: string, active: boolean) {
    return this.request<{ message: string }>(`/workflows/${workflowId}/toggle`, {
      method: 'PATCH',
      body: JSON.stringify({ active }),
    });
  }

  // Billing
  async getBillingSummary(organizationId: string, months?: number) {
    const query = months ? `?months=${months}` : '';
    return this.request<{ summary: any }>(`/billing/summary/${organizationId}${query}`);
  }

  async createSubscription(organizationId: string, paymentMethodId: string) {
    return this.request<{ subscription: any }>('/billing/subscription', {
      method: 'POST',
      body: JSON.stringify({ organizationId, paymentMethodId }),
    });
  }

  async getUsageReport(organizationId: string, startDate: string, endDate: string) {
    return this.request<{ report: any }>(`/billing/usage/${organizationId}?startDate=${startDate}&endDate=${endDate}`);
  }

  async getInvoices(organizationId: string, limit?: number, offset?: number) {
    const query = new URLSearchParams();
    if (limit) query.append('limit', limit.toString());
    if (offset) query.append('offset', offset.toString());
    
    return this.request<{ invoices: any[]; pagination: any }>(`/billing/invoices/${organizationId}?${query.toString()}`);
  }

  // Cloud providers
  async getCloudPricing() {
    return this.request<{ pricing: any }>('/billing/pricing');
  }

  // Dashboard stats (legacy support)
  async getDashboardStats(organizationId: string) {
    // Map to new billing summary for compatibility
    const billing = await this.getBillingSummary(organizationId);
    const deployments = await this.getDeployments(organizationId);
    
    return {
      activeDeployments: deployments.deployments?.filter(d => d.status === 'active').length || 0,
      documentsProcessed: deployments.deployments?.reduce((sum, d) => sum + (d.documentCount || 0), 0) || 0,
      monthlyCost: billing.summary?.currentPeriodUsage || 0,
      successRate: 98.5, // Calculate from actual metrics later
    };
  }

  // System metrics (legacy support)
  async getSystemMetrics(deploymentId?: string) {
    if (deploymentId) {
      const metrics = await this.getDeploymentMetrics(deploymentId);
      return {
        gpuUtilization: 78, // Map from actual metrics
        responseTime: '1.2',
        queueLength: 23,
        queriesToday: metrics.summary?.totalApiRequests || 0,
        errorRate: '0.8',
      };
    }
    
    // Return default metrics if no deployment
    return {
      gpuUtilization: 0,
      responseTime: '0',
      queueLength: 0,
      queriesToday: 0,
      errorRate: '0',
    };
  }
}

export const api = new ApiClient();
export default api;