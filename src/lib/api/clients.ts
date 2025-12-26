import { apiClient } from './client.js';

export interface Client {
  id: string;
  company_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  postal_code: string | null;
  country: string;
  siret: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateClientData {
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  postal_code?: string | null;
  country?: string;
  siret?: string | null;
}

export interface UpdateClientData {
  name?: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  postal_code?: string | null;
  country?: string;
  siret?: string | null;
}

export const clientsApi = {
  getAll: async (companyId?: string): Promise<Client[]> => {
    const query = companyId ? `?company_id=${companyId}` : '';
    return apiClient.get<Client[]>(`/clients${query}`);
  },

  getById: async (id: string): Promise<Client> => {
    return apiClient.get<Client>(`/clients/${id}`);
  },

  create: async (data: CreateClientData, companyId?: string): Promise<Client> => {
    const body = companyId ? { ...data, company_id: companyId } : data;
    return apiClient.post<Client>('/clients', body);
  },

  update: async (id: string, data: UpdateClientData): Promise<Client> => {
    return apiClient.put<Client>(`/clients/${id}`, data);
  },

  delete: async (id: string): Promise<void> => {
    return apiClient.delete(`/clients/${id}`);
  },
};

