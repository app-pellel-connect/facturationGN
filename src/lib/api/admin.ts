import { apiClient } from './client.js';

export interface AdminStats {
  totalCompanies: number;
  pendingCompanies: number;
  approvedCompanies: number;
  suspendedCompanies: number;
  rejectedCompanies: number;
  totalUsers: number;
}

export const adminApi = {
  getStats: async (): Promise<AdminStats> => {
    return apiClient.get<AdminStats>('/admin/stats');
  },
};

