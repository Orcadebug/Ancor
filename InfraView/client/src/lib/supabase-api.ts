import { useAuthStore } from "@/stores/authStore";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

class SupabaseApiClient {
  private getAuthHeaders() {
    const { session } = useAuthStore.getState();
    
    console.log("🔐 Getting auth headers:", {
      hasSession: !!session,
      hasAccessToken: !!session?.access_token,
      tokenPreview: session?.access_token ? `${session.access_token.substring(0, 20)}...` : 'none'
    });
    
    return {
      "Content-Type": "application/json",
      ...(session?.access_token && {
        Authorization: `Bearer ${session.access_token}`,
      }),
    };
  }

  async get(endpoint: string) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: "GET",
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    return response.json();
  }

  async post(endpoint: string, data: any) {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers = this.getAuthHeaders();
    
    console.log("📡 Making POST request:", {
      url,
      headers: { ...headers, Authorization: headers.Authorization ? `Bearer ${headers.Authorization.substring(7, 27)}...` : 'none' },
      data
    });
    
    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(data),
    });

    console.log("📡 Response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("📡 Response error:", errorText);
      throw new Error(`API Error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log("📡 Response success:", result);
    return result;
  }

  async put(endpoint: string, data: any) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: "PUT",
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    return response.json();
  }

  async delete(endpoint: string) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: "DELETE",
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    return response.json();
  }
}

export const apiClient = new SupabaseApiClient();