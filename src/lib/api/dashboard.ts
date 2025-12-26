import { apiClient } from './client.js';

export interface DashboardStats {
  total_clients: string;
  total_invoices: string;
  paid_invoices: string;
  sent_invoices: string;
  draft_invoices: string;
  total_revenue: string;
  total_paid: string;
  total_outstanding: string;
  overdue: {
    count: number;
    amount: number;
  };
  revenueByMonth: Array<{
    month: string;
    revenue: string;
  }>;
}

export const dashboardApi = {
  getStats: async (companyId?: string): Promise<DashboardStats> => {
    const query = companyId ? `?company_id=${companyId}` : '';
    return apiClient.get<DashboardStats>(`/dashboard/stats${query}`);
  },
};

