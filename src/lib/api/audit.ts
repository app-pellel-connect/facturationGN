import { apiClient } from './client.js';

export interface AuditLog {
  id: string;
  user_id: string | null;
  company_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  old_values: any;
  new_values: any;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  full_name?: string | null;
  email?: string | null;
  company_name?: string | null;
}

export const auditApi = {
  getAll: async (limit?: number, companyId?: string): Promise<AuditLog[]> => {
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit.toString());
    if (companyId) params.append('company_id', companyId);
    const query = params.toString();
    return apiClient.get<AuditLog[]>(`/audit${query ? `?${query}` : ''}`);
  },
};

