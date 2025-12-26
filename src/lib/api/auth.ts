import { apiClient } from './client.js';

export interface SignUpData {
  email: string;
  password: string;
  full_name: string;
}

export interface SignInData {
  email: string;
  password: string;
}

export interface AuthResponse {
  message: string;
  token: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    full_name: string | null;
    is_platform_owner: boolean;
  };
}

export interface ProfileResponse {
  user: {
    id: string;
    email: string;
    full_name: string | null;
    phone: string | null;
    avatar_url: string | null;
    is_platform_owner: boolean;
  };
  company: {
    id: string;
    name: string;
    status: string;
    role: string;
  } | null;
}

export const authApi = {
  signUp: async (data: SignUpData): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/auth/signup', data);
    apiClient.setToken(response.token);
    // Sauvegarder le refresh token
    if (typeof window !== 'undefined' && response.refreshToken) {
      localStorage.setItem('refresh_token', response.refreshToken);
    }
    return response;
  },

  signIn: async (data: SignInData): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/auth/signin', data);
    apiClient.setToken(response.token);
    // Sauvegarder le refresh token
    if (typeof window !== 'undefined' && response.refreshToken) {
      localStorage.setItem('refresh_token', response.refreshToken);
    }
    return response;
  },

  signOut: () => {
    apiClient.setToken(null);
  },

  getProfile: async (): Promise<ProfileResponse> => {
    return apiClient.get<ProfileResponse>('/auth/me');
  },

  refreshToken: async (refreshToken: string): Promise<{ token: string }> => {
    const response = await apiClient.post<{ token: string }>('/auth/refresh', { refreshToken });
    apiClient.setToken(response.token);
    return response;
  },
};

