import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { paymentsApi, type Payment, type CreatePaymentData } from '@/lib/api/payments';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import { queryKeys } from '@/lib/queryKeys';

export type { Payment } from '@/lib/api/payments';
export type PaymentInput = CreatePaymentData & {
  payment_type: 'deposit' | 'partial' | 'full' | 'balance';
};

const paymentTypeLabels: Record<Payment['payment_type'], string> = {
  deposit: 'Acompte',
  partial: 'Paiement partiel',
  full: 'Paiement intégral',
  balance: 'Solde',
};

const paymentMethodLabels: Record<Payment['payment_method'], string> = {
  cash: 'Espèces',
  mobile_money: 'Mobile Money',
  bank_transfer: 'Virement bancaire',
  check: 'Chèque',
  other: 'Autre',
};

export function usePayments(invoiceId?: string) {
  const { user, companyId } = useAuth();
  const queryClient = useQueryClient();

  const queryKey = invoiceId 
    ? queryKeys.payments.byInvoice(invoiceId) 
    : queryKeys.payments.all;

  const paymentsQuery = useQuery({
    queryKey,
    queryFn: async () => {
      if (invoiceId) {
        return paymentsApi.getByInvoice(invoiceId);
      }
      return [];
    },
    enabled: !!user && !!companyId && (!!invoiceId || invoiceId === undefined),
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  const createPayment = useMutation({
    mutationFn: async (input: PaymentInput) => {
      return paymentsApi.create({
        invoice_id: input.invoice_id,
        amount: input.amount,
        payment_method: input.payment_method || 'cash',
        payment_type: input.payment_type === 'full' ? 'full' : 'partial',
        reference: input.reference || null,
        notes: input.notes || null,
      });
    },
    onMutate: async (newPayment) => {
      const currentQueryKey = queryKeys.payments.byInvoice(newPayment.invoice_id);
      await queryClient.cancelQueries({ queryKey: currentQueryKey });
      
      const previousPayments = queryClient.getQueryData<Payment[]>(currentQueryKey);
      
      if (previousPayments) {
        const optimisticPayment: Payment = {
          ...newPayment,
          id: crypto.randomUUID(),
          recorded_by: user!.id,
          reference: newPayment.reference ?? null,
          notes: newPayment.notes ?? null,
          payment_method: newPayment.payment_method ?? 'cash',
          paid_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
        };
        
        queryClient.setQueryData<Payment[]>(
          currentQueryKey,
          [optimisticPayment, ...previousPayments]
        );
      }
      
      return { previousPayments, queryKey: currentQueryKey };
    },
    onError: (err, newPayment, context) => {
      if (context?.previousPayments && context?.queryKey) {
        queryClient.setQueryData(context.queryKey, context.previousPayments);
      }
      toast.error('Erreur lors de l\'enregistrement du paiement');
    },
    onSuccess: () => {
      toast.success('Paiement enregistré avec succès');
    },
    onSettled: (data, error, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.payments.byInvoice(variables.invoice_id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.invoices.byCompany(companyId ?? '') });
    },
  });

  const deletePayment = useMutation({
    mutationFn: async (id: string) => {
      return paymentsApi.delete(id);
    },
    onMutate: async (deletedId) => {
      await queryClient.cancelQueries({ queryKey });
      
      const previousPayments = queryClient.getQueryData<Payment[]>(queryKey);
      
      if (previousPayments) {
        queryClient.setQueryData<Payment[]>(
          queryKey,
          previousPayments.filter(payment => payment.id !== deletedId)
        );
      }
      
      return { previousPayments };
    },
    onError: (err, deletedId, context) => {
      if (context?.previousPayments) {
        queryClient.setQueryData(queryKey, context.previousPayments);
      }
      toast.error('Erreur lors de la suppression');
    },
    onSuccess: () => {
      toast.success('Paiement supprimé');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
      queryClient.invalidateQueries({ queryKey: queryKeys.invoices.byCompany(companyId ?? '') });
    },
  });

  return {
    payments: paymentsQuery.data ?? [],
    isLoading: paymentsQuery.isLoading,
    isError: paymentsQuery.isError,
    error: paymentsQuery.error,
    refetch: paymentsQuery.refetch,
    createPayment,
    deletePayment,
    paymentTypeLabels,
    paymentMethodLabels,
  };
}
