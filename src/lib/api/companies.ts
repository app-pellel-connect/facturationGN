import { apiClient } from './client.js';

export interface Company {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  address: string | null;
  city: string | null;
  postal_code: string | null;
  country: string;
  siret: string | null;
  logo_url: string | null;
  currency: string;
  tax_rate: number;
  status: 'pending' | 'approved' | 'suspended' | 'rejected';
  approved_at: string | null;
  approved_by: string | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateCompanyData {
  name: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  postal_code?: string;
  country?: string;
  siret?: string;
  logo_url?: string;
  currency?: string;
  tax_rate?: number;
}

export interface UpdateCompanyData {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  postal_code?: string;
  country?: string;
  siret?: string;
  logo_url?: string;
  currency?: string;
  tax_rate?: number;
  status?: 'pending' | 'approved' | 'suspended' | 'rejected';
  rejection_reason?: string;
}

export const companiesApi = {
  getAll: async (): Promise<Company[]> => {
    return apiClient.get<Company[]>('/companies');
  },

  getById: async (id: string): Promise<Company> => {
    return apiClient.get<Company>(`/companies/${id}`);
  },

  create: async (data: CreateCompanyData): Promise<Company> => {
    return apiClient.post<Company>('/companies', data);
  },

  update: async (id: string, data: UpdateCompanyData): Promise<Company> => {
    return apiClient.put<Company>(`/companies/${id}`, data);
  },

  delete: async (id: string): Promise<void> => {
    return apiClient.delete(`/companies/${id}`);
  },
};

