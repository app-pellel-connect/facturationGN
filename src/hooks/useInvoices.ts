import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { invoicesApi, type Invoice, type InvoiceItem, type CreateInvoiceData } from '@/lib/api/invoices';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import { queryKeys } from '@/lib/queryKeys';

export type { Invoice, InvoiceItem } from '@/lib/api/invoices';
export type InvoiceInput = CreateInvoiceData;

export function useInvoices() {
  const { user, companyId } = useAuth();
  const queryClient = useQueryClient();

  // Get tax rate from company settings
  const defaultTaxRate = 18;

  const invoicesQuery = useQuery({
    queryKey: queryKeys.invoices.byCompany(companyId ?? ''),
    queryFn: async () => {
      return invoicesApi.getAll(companyId || undefined);
    },
    enabled: !!user && !!companyId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  const createInvoice = useMutation({
    mutationFn: async (input: InvoiceInput) => {
      if (!companyId) throw new Error('No company selected');
      
      return invoicesApi.create(input, companyId);
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
      return invoicesApi.update(id, { status });
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
      return invoicesApi.delete(id);
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
