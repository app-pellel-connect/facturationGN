import { apiClient } from './client.js';

export type PlatformRole = 'company_admin' | 'company_manager' | 'company_user';

export interface TeamMember {
  id: string;
  user_id: string;
  role: PlatformRole;
  is_active: boolean;
  joined_at: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
}

export interface CreateMemberData {
  email: string;
  password: string;
  full_name: string;
  role?: PlatformRole;
  company_id?: string;
}

export interface UpdateMemberData {
  role?: PlatformRole;
  is_active?: boolean;
}

export const teamApi = {
  getAll: async (companyId?: string): Promise<TeamMember[]> => {
    const query = companyId ? `?company_id=${companyId}` : '';
    return apiClient.get<TeamMember[]>(`/team${query}`);
  },

  create: async (data: CreateMemberData, companyId?: string): Promise<TeamMember> => {
    const body = companyId ? { ...data, company_id: companyId } : data;
    return apiClient.post<TeamMember>('/team', body);
  },

  update: async (id: string, data: UpdateMemberData): Promise<TeamMember> => {
    return apiClient.put<TeamMember>(`/team/${id}`, data);
  },

  delete: async (id: string): Promise<void> => {
    return apiClient.delete(`/team/${id}`);
  },
};

