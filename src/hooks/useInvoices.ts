import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import { queryKeys } from '@/lib/queryKeys';

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
  clients?: { name: string } | null;
  invoice_items?: InvoiceItem[];
}

export type InvoiceInput = {
  client_id: string | null;
  invoice_number: string;
  status?: 'draft' | 'sent' | 'partial' | 'paid' | 'cancelled';
  issue_date?: string;
  due_date?: string | null;
  notes?: string | null;
  tax_rate?: number;
  items: Omit<InvoiceItem, 'id' | 'invoice_id' | 'created_at'>[];
};

export function useInvoices() {
  const { user, companyId } = useAuth();
  const queryClient = useQueryClient();

  // Get tax rate from company settings
  const defaultTaxRate = 18;

  const invoicesQuery = useQuery({
    queryKey: queryKeys.invoices.byCompany(companyId ?? ''),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('invoices')
        .select(`
          *,
          clients(name),
          invoice_items(*)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Invoice[];
    },
    enabled: !!user && !!companyId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  const createInvoice = useMutation({
    mutationFn: async (input: InvoiceInput) => {
      if (!companyId) throw new Error('No company selected');
      
      const { items, ...invoiceData } = input;
      
      // Calculate totals
      const subtotal = items.reduce((sum, item) => sum + item.total, 0);
      const taxRate = input.tax_rate ?? defaultTaxRate;
      const taxAmount = subtotal * (taxRate / 100);
      const total = subtotal + taxAmount;

      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .insert({
          ...invoiceData,
          company_id: companyId,
          created_by: user!.id,
          subtotal,
          tax_rate: taxRate,
          tax_amount: taxAmount,
          total,
        })
        .select()
        .single();
      
      if (invoiceError) throw invoiceError;

      if (items.length > 0) {
        const { error: itemsError } = await supabase
          .from('invoice_items')
          .insert(items.map(item => ({ ...item, invoice_id: invoice.id })));
        
        if (itemsError) throw itemsError;
      }

      return invoice;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.invoices.byCompany(companyId ?? '') });
      toast.success('Facture créée');
    },
    onError: () => {
      toast.error('Erreur lors de la création');
    },
  });

  const updateInvoiceStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: Invoice['status'] }) => {
      const { data, error } = await supabase
        .from('invoices')
        .update({ status })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.invoices.byCompany(companyId ?? '') });
      
      const previousInvoices = queryClient.getQueryData<Invoice[]>(queryKeys.invoices.byCompany(companyId ?? ''));
      
      if (previousInvoices) {
        queryClient.setQueryData<Invoice[]>(
          queryKeys.invoices.byCompany(companyId ?? ''),
          previousInvoices.map(invoice => 
            invoice.id === id ? { ...invoice, status } : invoice
          )
        );
      }
      
      return { previousInvoices };
    },
    onError: (err, variables, context) => {
      if (context?.previousInvoices) {
        queryClient.setQueryData(queryKeys.invoices.byCompany(companyId ?? ''), context.previousInvoices);
      }
      toast.error('Erreur lors de la mise à jour');
    },
    onSuccess: () => {
      toast.success('Statut mis à jour');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.invoices.byCompany(companyId ?? '') });
    },
  });

  const deleteInvoice = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('invoices')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onMutate: async (deletedId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.invoices.byCompany(companyId ?? '') });
      
      const previousInvoices = queryClient.getQueryData<Invoice[]>(queryKeys.invoices.byCompany(companyId ?? ''));
      
      if (previousInvoices) {
        queryClient.setQueryData<Invoice[]>(
          queryKeys.invoices.byCompany(companyId ?? ''),
          previousInvoices.filter(invoice => invoice.id !== deletedId)
        );
      }
      
      return { previousInvoices };
    },
    onError: (err, deletedId, context) => {
      if (context?.previousInvoices) {
        queryClient.setQueryData(queryKeys.invoices.byCompany(companyId ?? ''), context.previousInvoices);
      }
      toast.error('Erreur lors de la suppression');
    },
    onSuccess: () => {
      toast.success('Facture supprimée');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.invoices.byCompany(companyId ?? '') });
    },
  });

  const generateInvoiceNumber = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `FAC-${year}${month}-${random}`;
  };

  return {
    invoices: invoicesQuery.data ?? [],
    isLoading: invoicesQuery.isLoading,
    isError: invoicesQuery.isError,
    error: invoicesQuery.error,
    refetch: invoicesQuery.refetch,
    createInvoice,
    updateInvoiceStatus,
    deleteInvoice,
    generateInvoiceNumber,
  };
}
