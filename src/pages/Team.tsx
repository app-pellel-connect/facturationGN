import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Users, UserPlus, Pencil, UserX, UserCheck, Loader2, Mail, Shield, Search, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useTeamMembers, TeamMember, PlatformRole } from '@/hooks/useTeamMembers';
import { z } from 'zod';

const inviteSchema = z.object({
  email: z.string().email('Email invalide').max(255),
  password: z.string().min(6, 'Minimum 6 caractères').max(100),
  full_name: z.string().max(100).optional(),
  role: z.enum(['company_admin', 'company_manager', 'company_user']),
});

export default function Team() {
  const navigate = useNavigate();
  const { user, companyId, companyRole, isCompanyApproved, loading: authLoading } = useAuth();
  const { 
    members, 
    isLoading, 
    createMember, 
    updateMember, 
    toggleMemberStatus,
    roleLabels,
    roleOptions 
  } = useTeamMembers();

  const [searchQuery, setSearchQuery] = useState('');
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);

  // Form state
  const [inviteEmail, setInviteEmail] = useState('');
  const [invitePassword, setInvitePassword] = useState('');
  const [inviteFullName, setInviteFullName] = useState('');
  const [inviteRole, setInviteRole] = useState<PlatformRole>('company_user');
  const [editRole, setEditRole] = useState<PlatformRole>('company_user');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const isAdmin = companyRole === 'company_admin';

  // Redirect non-admins
  if (!authLoading && (!user || !companyId || !isCompanyApproved)) {
    navigate('/');
    return null;
  }

  if (!authLoading && !isAdmin) {
    navigate('/');
    return null;
  }

  const filteredMembers = members.filter(member => {
    const searchLower = searchQuery.toLowerCase();
    return (
      member.profile?.email?.toLowerCase().includes(searchLower) ||
      member.profile?.full_name?.toLowerCase().includes(searchLower) ||
      roleLabels[member.role]?.toLowerCase().includes(searchLower)
    );
  });

  const activeMembers = filteredMembers.filter(m => m.is_active);
  const inactiveMembers = filteredMembers.filter(m => !m.is_active);

  const resetInviteForm = () => {
    setInviteEmail('');
    setInvitePassword('');
    setInviteFullName('');
    setInviteRole('company_user');
    setFormErrors({});
  };

  const handleInvite = async () => {
    const result = inviteSchema.safeParse({
      email: inviteEmail,
      password: invitePassword,
      full_name: inviteFullName || undefined,
      role: inviteRole,
    });

    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.errors.forEach(err => {
        if (err.path[0]) {
          errors[err.path[0].toString()] = err.message;
        }
      });
      setFormErrors(errors);
      return;
    }

    await createMember.mutateAsync({
      email: inviteEmail,
      password: invitePassword,
      full_name: inviteFullName,
      role: inviteRole,
    });

    setInviteDialogOpen(false);
    resetInviteForm();
  };

  const handleEditRole = async () => {
    if (!selectedMember) return;
    
    await updateMember.mutateAsync({
      id: selectedMember.id,
      role: editRole,
    });

    setEditDialogOpen(false);
    setSelectedMember(null);
  };

  const handleToggleStatus = async () => {
    if (!selectedMember) return;
    
    await toggleMemberStatus.mutateAsync(selectedMember);

    setStatusDialogOpen(false);
    setSelectedMember(null);
  };

  const openEditDialog = (member: TeamMember) => {
    setSelectedMember(member);
    setEditRole(member.role);
    setEditDialogOpen(true);
  };

  const openStatusDialog = (member: TeamMember) => {
    setSelectedMember(member);
    setStatusDialogOpen(true);
  };

  const MemberCard = ({ member }: { member: TeamMember }) => (
    <div
      className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
        member.is_active 
          ? 'bg-card hover:shadow-md' 
          : 'bg-muted/30 opacity-60'
      }`}
    >
      <div className="flex items-center gap-4 min-w-0">
        <div className={`p-3 rounded-full ${member.is_active ? 'bg-primary/10' : 'bg-muted'}`}>
          <Mail className={`h-5 w-5 ${member.is_active ? 'text-primary' : 'text-muted-foreground'}`} />
        </div>
        <div className="min-w-0">
          <p className="font-semibold truncate">
            {member.profile?.full_name || 'Utilisateur'}
          </p>
          <p className="text-sm text-muted-foreground truncate">
            {member.profile?.email}
          </p>
          {member.profile?.phone && (
            <p className="text-xs text-muted-foreground">{member.profile.phone}</p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex flex-col items-end gap-1">
          <Badge variant="secondary" className="text-xs">
            <Shield className="h-3 w-3 mr-1" />
            {roleLabels[member.role]}
          </Badge>
          {!member.is_active && (
            <Badge variant="destructive" className="text-xs">Inactif</Badge>
          )}
        </div>
        {member.user_id !== user?.id && (
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              onClick={() => openEditDialog(member)}
              title="Modifier le rôle"
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={`h-9 w-9 ${member.is_active ? 'text-destructive hover:text-destructive' : 'text-green-600 hover:text-green-700'}`}
              onClick={() => openStatusDialog(member)}
              title={member.is_active ? 'Désactiver' : 'Réactiver'}
            >
              {member.is_active ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
            </Button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <AppLayout title="Gestion de l'équipe">
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate('/settings')} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Retour
          </Button>
          <Button onClick={() => setInviteDialogOpen(true)} className="gap-2">
            <UserPlus className="h-4 w-4" />
            Ajouter un collaborateur
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="glass">
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-primary">{members.length}</p>
              <p className="text-sm text-muted-foreground">Total</p>
            </CardContent>
          </Card>
          <Card className="glass">
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-green-600">{activeMembers.length}</p>
              <p className="text-sm text-muted-foreground">Actifs</p>
            </CardContent>
          </Card>
          <Card className="glass">
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-muted-foreground">{inactiveMembers.length}</p>
              <p className="text-sm text-muted-foreground">Inactifs</p>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un membre..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Members List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Active Members */}
            <Card className="glass">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  Membres actifs ({activeMembers.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {activeMembers.length === 0 ? (
                  <p className="text-center text-muted-foreground py-6">
                    Aucun membre actif trouvé
                  </p>
                ) : (
                  activeMembers.map(member => (
                    <MemberCard key={member.id} member={member} />
                  ))
                )}
              </CardContent>
            </Card>

            {/* Inactive Members */}
            {inactiveMembers.length > 0 && (
              <Card className="glass border-dashed">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-muted-foreground">
                    <UserX className="h-5 w-5" />
                    Membres inactifs ({inactiveMembers.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {inactiveMembers.map(member => (
                    <MemberCard key={member.id} member={member} />
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>

      {/* Invite Dialog */}
      <Dialog open={inviteDialogOpen} onOpenChange={(open) => {
        setInviteDialogOpen(open);
        if (!open) resetInviteForm();
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-primary" />
              Ajouter un collaborateur
            </DialogTitle>
            <DialogDescription>
              Créez un compte pour un nouveau membre de votre équipe
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
                className={formErrors.email ? 'border-destructive' : ''}
              />
              {formErrors.email && (
                <p className="text-xs text-destructive">{formErrors.email}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="invite-password">Mot de passe *</Label>
              <Input
                id="invite-password"
                type="password"
                value={invitePassword}
                onChange={(e) => setInvitePassword(e.target.value)}
                placeholder="Minimum 6 caractères"
                className={formErrors.password ? 'border-destructive' : ''}
              />
              {formErrors.password && (
                <p className="text-xs text-destructive">{formErrors.password}</p>
              )}
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
                      <div className="flex flex-col">
                        <span>{option.label}</span>
                        <span className="text-xs text-muted-foreground">{option.description}</span>
                      </div>
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
            <Button onClick={handleInvite} disabled={createMember.isPending}>
              {createMember.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
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
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label>Rôle</Label>
              <Select value={editRole} onValueChange={(v) => setEditRole(v as PlatformRole)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {roleOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex flex-col">
                        <span>{option.label}</span>
                        <span className="text-xs text-muted-foreground">{option.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleEditRole} disabled={updateMember.isPending}>
              {updateMember.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Toggle Status Dialog */}
      <AlertDialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
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
              onClick={handleToggleStatus}
              className={selectedMember?.is_active ? 'bg-destructive hover:bg-destructive/90' : 'bg-green-600 hover:bg-green-700'}
            >
              {toggleMemberStatus.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {selectedMember?.is_active ? 'Désactiver' : 'Réactiver'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
