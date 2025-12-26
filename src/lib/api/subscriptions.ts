import { apiClient } from './client.js';

export interface Subscription {
  id: string;
  company_id: string;
  plan_name: string;
  status: 'trial' | 'active' | 'expired' | 'cancelled';
  max_users: number;
  max_invoices_per_month: number;
  max_clients: number;
  started_at: string;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
  company_name?: string;
}

export interface UpdateSubscriptionData {
  plan_name?: string;
  status?: 'trial' | 'active' | 'expired' | 'cancelled';
  max_users?: number;
  max_invoices_per_month?: number;
  max_clients?: number;
  expires_at?: string;
}

export const subscriptionsApi = {
  getAll: async (): Promise<Subscription[]> => {
    return apiClient.get<Subscription[]>('/subscriptions');
  },

  getById: async (id: string): Promise<Subscription> => {
    return apiClient.get<Subscription>(`/subscriptions/${id}`);
  },

  update: async (id: string, data: UpdateSubscriptionData): Promise<Subscription> => {
    return apiClient.put<Subscription>(`/subscriptions/${id}`, data);
  },
};

