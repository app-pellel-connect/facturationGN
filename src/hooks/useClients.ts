import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { clientsApi, type Client, type CreateClientData } from '@/lib/api/clients';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import { queryKeys } from '@/lib/queryKeys';

export type { Client } from '@/lib/api/clients';
export type ClientInput = CreateClientData;

export function useClients() {
  const { user, companyId } = useAuth();
  const queryClient = useQueryClient();

  const clientsQuery = useQuery({
    queryKey: queryKeys.clients.byCompany(companyId ?? ''),
    queryFn: async () => {
      return clientsApi.getAll(companyId || undefined);
    },
    enabled: !!user && !!companyId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  const createClient = useMutation({
    mutationFn: async (input: ClientInput) => {
      if (!companyId) throw new Error('No company selected');
      
      return clientsApi.create(input, companyId);
    },
    onMutate: async (newClient) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.clients.byCompany(companyId ?? '') });
      
      // Snapshot the previous value
      const previousClients = queryClient.getQueryData<Client[]>(queryKeys.clients.byCompany(companyId ?? ''));
      
      // Optimistically update to the new value
      if (previousClients) {
        const optimisticClient: Client = {
          id: crypto.randomUUID(),
          company_id: companyId!,
          name: newClient.name,
          email: newClient.email ?? null,
          phone: newClient.phone ?? null,
          address: newClient.address ?? null,
          city: newClient.city ?? null,
          postal_code: newClient.postal_code ?? null,
          country: newClient.country ?? 'Guinée',
          siret: newClient.siret ?? null,
          created_by: user!.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        
        queryClient.setQueryData<Client[]>(
          queryKeys.clients.byCompany(companyId ?? ''),
          [optimisticClient, ...previousClients]
        );
      }
      
      return { previousClients };
    },
    onError: (err, newClient, context) => {
      // Rollback on error
      if (context?.previousClients) {
        queryClient.setQueryData(queryKeys.clients.byCompany(companyId ?? ''), context.previousClients);
      }
      toast.error('Erreur lors de la création');
    },
    onSuccess: () => {
      toast.success('Client créé');
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: queryKeys.clients.byCompany(companyId ?? '') });
    },
  });

  const updateClient = useMutation({
    mutationFn: async ({ id, ...input }: Partial<Client> & { id: string }) => {
      return clientsApi.update(id, input);
    },
    onMutate: async (updatedClient) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.clients.byCompany(companyId ?? '') });
      
      const previousClients = queryClient.getQueryData<Client[]>(queryKeys.clients.byCompany(companyId ?? ''));
      
      if (previousClients) {
        queryClient.setQueryData<Client[]>(
          queryKeys.clients.byCompany(companyId ?? ''),
          previousClients.map(client => 
            client.id === updatedClient.id 
              ? { ...client, ...updatedClient, updated_at: new Date().toISOString() }
              : client
          )
        );
      }
      
      return { previousClients };
    },
    onError: (err, updatedClient, context) => {
      if (context?.previousClients) {
        queryClient.setQueryData(queryKeys.clients.byCompany(companyId ?? ''), context.previousClients);
      }
      toast.error('Erreur lors de la mise à jour');
    },
    onSuccess: () => {
      toast.success('Client mis à jour');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.clients.byCompany(companyId ?? '') });
    },
  });

  const deleteClient = useMutation({
    mutationFn: async (id: string) => {
      return clientsApi.delete(id);
    },
    onMutate: async (deletedId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.clients.byCompany(companyId ?? '') });
      
      const previousClients = queryClient.getQueryData<Client[]>(queryKeys.clients.byCompany(companyId ?? ''));
      
      if (previousClients) {
        queryClient.setQueryData<Client[]>(
          queryKeys.clients.byCompany(companyId ?? ''),
          previousClients.filter(client => client.id !== deletedId)
        );
      }
      
      return { previousClients };
    },
    onError: (err, deletedId, context) => {
      if (context?.previousClients) {
        queryClient.setQueryData(queryKeys.clients.byCompany(companyId ?? ''), context.previousClients);
      }
      toast.error('Erreur lors de la suppression');
    },
    onSuccess: () => {
      toast.success('Client supprimé');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.clients.byCompany(companyId ?? '') });
    },
  });

  return {
    clients: clientsQuery.data ?? [],
    isLoading: clientsQuery.isLoading,
    isError: clientsQuery.isError,
    error: clientsQuery.error,
    refetch: clientsQuery.refetch,
    createClient,
    updateClient,
    deleteClient,
  };
}
