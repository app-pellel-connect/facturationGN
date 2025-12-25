// Centralized query keys for TanStack Query
export const queryKeys = {
  // Clients
  clients: {
    all: ['clients'] as const,
    byCompany: (companyId: string) => ['clients', companyId] as const,
    detail: (id: string) => ['clients', 'detail', id] as const,
  },
  
  // Invoices
  invoices: {
    all: ['invoices'] as const,
    byCompany: (companyId: string) => ['invoices', companyId] as const,
    detail: (id: string) => ['invoices', 'detail', id] as const,
    byStatus: (status: string) => ['invoices', 'status', status] as const,
  },
  
  // Payments
  payments: {
    all: ['payments'] as const,
    byInvoice: (invoiceId: string) => ['payments', invoiceId] as const,
    detail: (id: string) => ['payments', 'detail', id] as const,
  },
  
  // Auth & Profile
  auth: {
    profile: (userId: string) => ['profile', userId] as const,
    membership: (userId: string) => ['membership', userId] as const,
  },
  
  // Team
  team: {
    members: (companyId: string) => ['team', 'members', companyId] as const,
  },
} as const;
