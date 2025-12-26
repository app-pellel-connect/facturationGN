import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { teamApi, type TeamMember, type CreateMemberData, type UpdateMemberData, type PlatformRole } from '@/lib/api/team';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import { queryKeys } from '@/lib/queryKeys';

export type { PlatformRole } from '@/lib/api/team';

export type { TeamMember } from '@/lib/api/team';
export type CreateMemberInput = CreateMemberData;
export type UpdateMemberInput = UpdateMemberData & { id: string };

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
      
      const members = await teamApi.getAll(companyId);
      return members.map(member => ({
        ...member,
        profile: {
          email: member.email,
          full_name: member.full_name,
          phone: member.phone,
        },
      })) as TeamMember[];
    },
    enabled: !!user && !!companyId,
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const createMember = useMutation({
    mutationFn: async (input: CreateMemberInput) => {
      if (!companyId || !user) throw new Error('No company selected');

      const member = await teamApi.create(input, companyId);
      return {
        ...member,
        profile: {
          email: member.email,
          full_name: member.full_name,
          phone: member.phone,
        },
      } as TeamMember;
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
      
      const member = await teamApi.update(id, updates);
      return {
        ...member,
        profile: {
          email: member.email,
          full_name: member.full_name,
          phone: member.phone,
        },
      } as TeamMember;
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
      const updated = await teamApi.update(member.id, { is_active: !member.is_active });
      return {
        ...updated,
        profile: member.profile,
      } as TeamMember;
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
