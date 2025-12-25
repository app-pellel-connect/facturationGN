import { create } from 'zustand';

interface UIState {
  // Sidebar state
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;
  
  // Modal states
  paymentDialogOpen: boolean;
  deleteDialogOpen: boolean;
  
  // Loading states
  globalLoading: boolean;
  
  // Filter states
  invoiceStatusFilter: string | null;
  clientSearchQuery: string;
  invoiceSearchQuery: string;
}

interface UIActions {
  // Sidebar actions
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebarCollapsed: () => void;
  
  // Modal actions
  setPaymentDialogOpen: (open: boolean) => void;
  setDeleteDialogOpen: (open: boolean) => void;
  
  // Loading actions
  setGlobalLoading: (loading: boolean) => void;
  
  // Filter actions
  setInvoiceStatusFilter: (status: string | null) => void;
  setClientSearchQuery: (query: string) => void;
  setInvoiceSearchQuery: (query: string) => void;
  resetFilters: () => void;
}

const initialState: UIState = {
  sidebarOpen: true,
  sidebarCollapsed: false,
  paymentDialogOpen: false,
  deleteDialogOpen: false,
  globalLoading: false,
  invoiceStatusFilter: null,
  clientSearchQuery: '',
  invoiceSearchQuery: '',
};

export const useUIStore = create<UIState & UIActions>()((set) => ({
  ...initialState,

  // Sidebar actions
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSidebarCollapsed: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  
  // Modal actions
  setPaymentDialogOpen: (open) => set({ paymentDialogOpen: open }),
  setDeleteDialogOpen: (open) => set({ deleteDialogOpen: open }),
  
  // Loading actions
  setGlobalLoading: (loading) => set({ globalLoading: loading }),
  
  // Filter actions
  setInvoiceStatusFilter: (status) => set({ invoiceStatusFilter: status }),
  setClientSearchQuery: (query) => set({ clientSearchQuery: query }),
  setInvoiceSearchQuery: (query) => set({ invoiceSearchQuery: query }),
  resetFilters: () => set({ 
    invoiceStatusFilter: null, 
    clientSearchQuery: '', 
    invoiceSearchQuery: '' 
  }),
}));
