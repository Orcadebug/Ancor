// API Client Configuration for connecting to backend

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  timestamp: string;
}

class ApiClient {
  private baseURL: string;
  private token: string | null = null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    this.token = localStorage.getItem('auth_token');
  }

  setAuthToken(token: string) {
    this.token = token;
    localStorage.setItem('auth_token', token);
  }

  clearAuthToken() {
    this.token = null;
    localStorage.removeItem('auth_token');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const data: ApiResponse<T> = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Authentication endpoints
  async register(userData: {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    company?: string;
  }) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async login(credentials: { email: string; password: string }) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async getProfile() {
    return this.request('/auth/profile');
  }

  // Deployment endpoints
  async getAIModels() {
    return this.request('/deployments/models');
  }

  async getCloudProviders() {
    return this.request('/deployments/providers');
  }

  async getRegions(provider: string) {
    return this.request(`/deployments/regions/${provider}`);
  }

  async getInstanceTypes(provider: string, region: string) {
    return this.request(`/deployments/instances/${provider}/${region}`);
  }

  async createDeployment(deploymentData: any) {
    return this.request('/deployments', {
      method: 'POST',
      body: JSON.stringify(deploymentData),
    });
  }

  async getDeployments() {
    return this.request('/deployments');
  }

  async getDeployment(id: string) {
    return this.request(`/deployments/${id}`);
  }

  async deployInstance(id: string) {
    return this.request(`/deployments/${id}/deploy`, {
      method: 'POST',
    });
  }

  // Monitoring endpoints
  async getDeploymentMetrics(id: string, params?: Record<string, string>) {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.request(`/monitoring/deployments/${id}/metrics${queryString}`);
  }

  async getRealTimeMetrics(id: string) {
    return this.request(`/monitoring/deployments/${id}/metrics/realtime`);
  }

  async getUsageAnalytics(params?: Record<string, string>) {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.request(`/monitoring/analytics/usage${queryString}`);
  }

  // Management endpoints
  async startInstance(id: string) {
    return this.request(`/management/deployments/${id}/start`, {
      method: 'POST',
    });
  }

  async stopInstance(id: string) {
    return this.request(`/management/deployments/${id}/stop`, {
      method: 'POST',
    });
  }

  async restartInstance(id: string) {
    return this.request(`/management/deployments/${id}/restart`, {
      method: 'POST',
    });
  }

  async getInstanceLogs(id: string, params?: Record<string, string>) {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.request(`/management/deployments/${id}/logs${queryString}`);
  }
}

// Export singleton instance
export const apiClient = new ApiClient(API_BASE_URL);
export default apiClient;