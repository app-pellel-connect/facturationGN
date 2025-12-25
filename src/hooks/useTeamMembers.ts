import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import { queryKeys } from '@/lib/queryKeys';
import type { Database } from '@/integrations/supabase/types';

export type PlatformRole = Database['public']['Enums']['platform_role'];

export interface TeamMember {
  id: string;
  user_id: string;
  company_id: string;
  role: PlatformRole;
  is_active: boolean;
  joined_at: string;
  invited_by: string | null;
  created_at: string;
  profile: {
    email: string;
    full_name: string | null;
    phone: string | null;
  } | null;
}

export interface CreateMemberInput {
  email: string;
  password: string;
  full_name?: string;
  role: PlatformRole;
}

export interface UpdateMemberInput {
  id: string;
  role?: PlatformRole;
  is_active?: boolean;
}

const roleLabels: Record<string, string> = {
  platform_owner: 'Propriétaire',
  company_admin: 'Administrateur',
  company_manager: 'Gestionnaire',
  company_user: 'Utilisateur',
};

const roleOptions: { value: PlatformRole; label: string; description: string }[] = [
  { value: 'company_admin', label: 'Administrateur', description: 'Tous les droits de gestion' },
  { value: 'company_manager', label: 'Gestionnaire', description: 'Gestion des clients et factures' },
  { value: 'company_user', label: 'Utilisateur', description: 'Lecture seule' },
];

export function useTeamMembers() {
  const { user, companyId, session } = useAuth();
  const queryClient = useQueryClient();

  const queryKey = queryKeys.team.members(companyId ?? '');

  const membersQuery = useQuery({
    queryKey,
    queryFn: async () => {
      if (!companyId) return [];
      
      const { data, error } = await supabase
        .from('company_members')
        .select(`
          id,
          user_id,
          company_id,
          role,
          is_active,
          joined_at,
          invited_by,
          created_at,
          profiles:user_id (
            email,
            full_name,
            phone
          )
        `)
        .eq('company_id', companyId)
        .order('joined_at', { ascending: true });

      if (error) throw error;

      return (data || []).map((member: any) => ({
        ...member,
        profile: member.profiles,
      })) as TeamMember[];
    },
    enabled: !!user && !!companyId,
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const createMember = useMutation({
    mutationFn: async (input: CreateMemberInput) => {
      if (!companyId || !user) throw new Error('No company selected');

      // Ensure we send a real user JWT (otherwise invoke falls back to anon key -> Invalid JWT)
      let accessToken = session?.access_token;
      if (!accessToken) {
        const { data } = await supabase.auth.getSession();
        accessToken = data.session?.access_token;
      }
      if (!accessToken) {
        throw new Error('Session expirée. Veuillez vous reconnecter.');
      }

      const { data, error } = await supabase.functions.invoke('create-team-member', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: {
          email: input.email,
          password: input.password,
          full_name: input.full_name,
          role: input.role,
          company_id: companyId,
          invited_by: user.id,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      return data.member;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success('Collaborateur ajouté avec succès');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erreur lors de l\'ajout du collaborateur');
    },
  });

  const updateMember = useMutation({
    mutationFn: async (input: UpdateMemberInput) => {
      const { id, ...updates } = input;
      
      const { data, error } = await supabase
        .from('company_members')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey });
      
      const previousMembers = queryClient.getQueryData<TeamMember[]>(queryKey);
      
      if (previousMembers) {
        queryClient.setQueryData<TeamMember[]>(
          queryKey,
          previousMembers.map(member =>
            member.id === input.id ? { ...member, ...input } : member
          )
        );
      }
      
      return { previousMembers };
    },
    onError: (err, input, context) => {
      if (context?.previousMembers) {
        queryClient.setQueryData(queryKey, context.previousMembers);
      }
      toast.error('Erreur lors de la mise à jour');
    },
    onSuccess: (data, input) => {
      if (input.role !== undefined) {
        toast.success('Rôle mis à jour');
      } else if (input.is_active !== undefined) {
        toast.success(input.is_active ? 'Collaborateur réactivé' : 'Collaborateur désactivé');
      } else {
        toast.success('Mise à jour effectuée');
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const toggleMemberStatus = useMutation({
    mutationFn: async (member: TeamMember) => {
      const { data, error } = await supabase
        .from('company_members')
        .update({ is_active: !member.is_active })
        .eq('id', member.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onMutate: async (member) => {
      await queryClient.cancelQueries({ queryKey });
      
      const previousMembers = queryClient.getQueryData<TeamMember[]>(queryKey);
      
      if (previousMembers) {
        queryClient.setQueryData<TeamMember[]>(
          queryKey,
          previousMembers.map(m =>
            m.id === member.id ? { ...m, is_active: !m.is_active } : m
          )
        );
      }
      
      return { previousMembers };
    },
    onError: (err, member, context) => {
      if (context?.previousMembers) {
        queryClient.setQueryData(queryKey, context.previousMembers);
      }
      toast.error('Erreur lors de la modification du statut');
    },
    onSuccess: (data) => {
      toast.success(data.is_active ? 'Collaborateur réactivé' : 'Collaborateur désactivé');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  return {
    members: membersQuery.data ?? [],
    isLoading: membersQuery.isLoading,
    isError: membersQuery.isError,
    error: membersQuery.error,
    refetch: membersQuery.refetch,
    createMember,
    updateMember,
    toggleMemberStatus,
    roleLabels,
    roleOptions,
  };
}
