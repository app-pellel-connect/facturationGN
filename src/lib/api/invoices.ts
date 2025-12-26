import { apiClient } from './client.js';

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
  created_at: string;
}

export interface Invoice {
  id: string;
  company_id: string;
  client_id: string | null;
  invoice_number: string;
  status: 'draft' | 'sent' | 'partial' | 'paid' | 'cancelled';
  issue_date: string;
  due_date: string | null;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  total: number;
  paid_amount: number;
  balance: number;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  client_name?: string;
  client_email?: string;
  client_phone?: string;
  items?: InvoiceItem[];
}

export interface CreateInvoiceData {
  client_id?: string | null;
  invoice_number: string;
  status?: 'draft' | 'sent' | 'partial' | 'paid' | 'cancelled';
  issue_date?: string;
  due_date?: string | null;
  notes?: string | null;
  tax_rate?: number;
  items: Omit<InvoiceItem, 'id' | 'invoice_id' | 'created_at'>[];
}

export interface UpdateInvoiceData {
  client_id?: string | null;
  status?: 'draft' | 'sent' | 'partial' | 'paid' | 'cancelled';
  issue_date?: string;
  due_date?: string | null;
  notes?: string | null;
  tax_rate?: number;
  items?: Omit<InvoiceItem, 'id' | 'invoice_id' | 'created_at'>[];
}

export const invoicesApi = {
  getAll: async (companyId?: string): Promise<Invoice[]> => {
    const query = companyId ? `?company_id=${companyId}` : '';
    return apiClient.get<Invoice[]>(`/invoices${query}`);
  },

  getById: async (id: string): Promise<Invoice> => {
    return apiClient.get<Invoice>(`/invoices/${id}`);
  },

  create: async (data: CreateInvoiceData, companyId?: string): Promise<Invoice> => {
    const body = companyId ? { ...data, company_id: companyId } : data;
    return apiClient.post<Invoice>('/invoices', body);
  },

  update: async (id: string, data: UpdateInvoiceData): Promise<Invoice> => {
    return apiClient.put<Invoice>(`/invoices/${id}`, data);
  },

  delete: async (id: string): Promise<void> => {
    return apiClient.delete(`/invoices/${id}`);
  },
};

