import { apiClient } from './client.js';

export interface Payment {
  id: string;
  invoice_id: string;
  amount: number;
  payment_method: string;
  payment_type: 'full' | 'partial' | 'deposit' | 'balance';
  reference: string | null;
  notes: string | null;
  paid_at: string;
  recorded_by: string | null;
  created_at: string;
  recorded_by_name?: string;
}

export interface CreatePaymentData {
  invoice_id: string;
  amount: number;
  payment_method?: string;
  payment_type?: 'full' | 'partial' | 'deposit' | 'balance';
  reference?: string | null;
  notes?: string | null;
  paid_at?: string;
}

export const paymentsApi = {
  getByInvoice: async (invoiceId: string): Promise<Payment[]> => {
    return apiClient.get<Payment[]>(`/payments/invoice/${invoiceId}`);
  },

  create: async (data: CreatePaymentData): Promise<Payment> => {
    return apiClient.post<Payment>('/payments', data);
  },

  delete: async (id: string): Promise<void> => {
    return apiClient.delete(`/payments/${id}`);
  },
};

