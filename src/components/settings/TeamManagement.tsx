import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Users, UserPlus, Pencil, UserX, Loader2, Mail, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { useTeamMembers, type PlatformRole } from '@/hooks/useTeamMembers';

interface TeamMember {
  id: string;
  user_id: string;
  role: PlatformRole;
  is_active: boolean;
  joined_at: string;
  profile: {
    email: string;
    full_name: string | null;
  } | null;
}

interface TeamManagementProps {
  companyId: string;
  currentUserId: string;
}

const roleLabels: Record<string, string> = {
  company_admin: 'Administrateur',
  company_manager: 'Gestionnaire',
  company_user: 'Utilisateur',
};

const roleOptions: { value: PlatformRole; label: string }[] = [
  { value: 'company_admin', label: 'Administrateur' },
  { value: 'company_manager', label: 'Gestionnaire' },
  { value: 'company_user', label: 'Utilisateur' },
];

export function TeamManagement({ companyId, currentUserId }: TeamManagementProps) {
  const { members, isLoading, createMember, updateMember, toggleMemberStatus } = useTeamMembers();
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deactivateDialogOpen, setDeactivateDialogOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [saving, setSaving] = useState(false);

  // Invite form state
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteFullName, setInviteFullName] = useState('');
  const [inviteRole, setInviteRole] = useState<PlatformRole>('company_user');
  const [invitePassword, setInvitePassword] = useState('');

  // Edit form state
  const [editRole, setEditRole] = useState<PlatformRole>('company_user');

  const handleInvite = async () => {
    if (!inviteEmail || !invitePassword) {
      toast.error('Email et mot de passe requis');
      return;
    }

    if (invitePassword.length < 6) {
      toast.error('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    setSaving(true);
    try {
      await createMember.mutateAsync({
        email: inviteEmail,
        password: invitePassword,
        full_name: inviteFullName || undefined,
        role: inviteRole,
      });

      setInviteDialogOpen(false);
      resetInviteForm();
    } catch (error: any) {
      // Error is already handled by the mutation
    } finally {
      setSaving(false);
    }
  };

  const handleEditRole = async () => {
    if (!selectedMember) return;

    setSaving(true);
    try {
      await updateMember.mutateAsync({
        id: selectedMember.id,
        role: editRole,
      });

      setEditDialogOpen(false);
    } catch (error) {
      // Error is already handled by the mutation
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async () => {
    if (!selectedMember) return;

    setSaving(true);
    try {
      await toggleMemberStatus.mutateAsync(selectedMember);
      setDeactivateDialogOpen(false);
    } catch (error) {
      // Error is already handled by the mutation
    } finally {
      setSaving(false);
    }
  };

  const resetInviteForm = () => {
    setInviteEmail('');
    setInviteFullName('');
    setInviteRole('company_user');
    setInvitePassword('');
  };

  const openEditDialog = (member: TeamMember) => {
    setSelectedMember(member);
    setEditRole(member.role);
    setEditDialogOpen(true);
  };

  const openDeactivateDialog = (member: TeamMember) => {
    setSelectedMember(member);
    setDeactivateDialogOpen(true);
  };

  if (isLoading) {
    return (
      <Card className="glass card-hover">
        <CardContent className="p-6 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="glass card-hover">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              Équipe ({members.filter(m => m.is_active).length} actifs)
            </CardTitle>
            <Button size="sm" onClick={() => setInviteDialogOpen(true)}>
              <UserPlus className="h-4 w-4 mr-2" />
              Ajouter
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {members.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Aucun membre dans l'équipe
            </p>
          ) : (
            <div className="space-y-2">
              {members.map((member) => (
                <div
                  key={member.id}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    member.is_active ? 'bg-card' : 'bg-muted/50 opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2 rounded-full bg-primary/10">
                      <Mail className="h-4 w-4 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">
                        {member.profile?.full_name || member.profile?.email || 'Utilisateur'}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {member.profile?.email}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={member.is_active ? 'secondary' : 'outline'} className="text-xs">
                      {roleLabels[member.role] || member.role}
                    </Badge>
                    {!member.is_active && (
                      <Badge variant="destructive" className="text-xs">Inactif</Badge>
                    )}
                    {member.user_id !== currentUserId && (
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => openEditDialog(member)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => openDeactivateDialog(member)}
                        >
                          <UserX className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Invite Dialog */}
      <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter un collaborateur</DialogTitle>
            <DialogDescription>
              Créez un compte pour un nouveau membre de l'équipe
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="invite-name">Nom complet</Label>
              <Input
                id="invite-name"
                value={inviteFullName}
                onChange={(e) => setInviteFullName(e.target.value)}
                placeholder="Jean Dupont"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="invite-email">Email *</Label>
              <Input
                id="invite-email"
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="collaborateur@exemple.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="invite-password">Mot de passe *</Label>
              <Input
                id="invite-password"
                type="password"
                value={invitePassword}
                onChange={(e) => setInvitePassword(e.target.value)}
                placeholder="Minimum 6 caractères"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="invite-role">Rôle</Label>
              <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as PlatformRole)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {roleOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInviteDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleInvite} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Ajouter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Role Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier le rôle</DialogTitle>
            <DialogDescription>
              {selectedMember?.profile?.full_name || selectedMember?.profile?.email}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="edit-role">Rôle</Label>
            <Select value={editRole} onValueChange={(v) => setEditRole(v as PlatformRole)}>
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {roleOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleEditRole} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Deactivate/Reactivate Dialog */}
      <AlertDialog open={deactivateDialogOpen} onOpenChange={setDeactivateDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {selectedMember?.is_active ? 'Désactiver le collaborateur' : 'Réactiver le collaborateur'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {selectedMember?.is_active
                ? `${selectedMember?.profile?.full_name || selectedMember?.profile?.email} ne pourra plus accéder à l'application.`
                : `${selectedMember?.profile?.full_name || selectedMember?.profile?.email} pourra à nouveau accéder à l'application.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleToggleActive}
              className={selectedMember?.is_active ? 'bg-destructive hover:bg-destructive/90' : ''}
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {selectedMember?.is_active ? 'Désactiver' : 'Réactiver'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
