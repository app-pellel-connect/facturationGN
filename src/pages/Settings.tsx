import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { User, Shield, Mail, Database, Loader2, Building2, Crown, Users, ChevronRight } from 'lucide-react';
import { seedDemoData } from '@/lib/seedDemoData';
import { toast } from 'sonner';

const roleLabels: Record<string, string> = {
  platform_owner: 'Propriétaire plateforme',
  company_admin: 'Administrateur',
  company_manager: 'Gestionnaire',
  company_user: 'Utilisateur',
};

export default function Settings() {
  const navigate = useNavigate();
  const { user, profile, isPlatformOwner, companyMembership, companyRole, companyId } = useAuth();
  const [seeding, setSeeding] = useState(false);

  const handleSeedData = async (force: boolean = false) => {
    if (!user?.id || !companyId) {
      toast.error('Vous devez être membre d\'une entreprise pour générer des données');
      return;
    }
    
    setSeeding(true);
    try {
      const result = await seedDemoData(companyId, user.id, force);
      if (result.success) {
        toast.success(result.message);
        window.location.reload();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error('Erreur lors de la création des données');
    } finally {
      setSeeding(false);
    }
  };

  const canManageTeam = companyRole === 'company_admin';

  return (
    <AppLayout title="Paramètres">
      <div className="space-y-4 stagger-children">
        {/* Profile */}
        <Card className="glass card-hover">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <User className="h-4 w-4 text-primary" />
              Profil
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{user?.email}</span>
            </div>
            {profile?.full_name && (
              <div className="flex items-center gap-3">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{profile.full_name}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Platform Owner Badge */}
        {isPlatformOwner && (
          <Card className="glass card-hover border-primary/30">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Crown className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold">Propriétaire de la plateforme</p>
                  <p className="text-sm text-muted-foreground">Vous avez accès à toutes les fonctionnalités d'administration</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Company Info */}
        {companyMembership?.company && (
          <Card className="glass card-hover">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Building2 className="h-4 w-4 text-primary" />
                Entreprise
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-medium">{companyMembership.company.name}</span>
                <Badge variant={companyMembership.company.status === 'approved' ? 'default' : 'secondary'}>
                  {companyMembership.company.status === 'approved' ? 'Approuvée' : 
                   companyMembership.company.status === 'pending' ? 'En attente' :
                   companyMembership.company.status === 'suspended' ? 'Suspendue' : 'Rejetée'}
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Role */}
        <Card className="glass card-hover">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" />
              Rôle
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {companyRole && (
                <Badge variant="secondary" className="bg-primary/10 text-primary">
                  {roleLabels[companyRole] || companyRole}
                </Badge>
              )}
              {!companyRole && !isPlatformOwner && (
                <span className="text-sm text-muted-foreground">Aucune entreprise assignée</span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Team Management Link - Only for company admins */}
        {companyId && canManageTeam && (
          <Card 
            className="glass card-hover cursor-pointer transition-all hover:border-primary/50"
            onClick={() => navigate('/team')}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold">Gestion de l'équipe</p>
                    <p className="text-sm text-muted-foreground">Gérer les collaborateurs et les rôles</p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Demo Data - Only for company members with admin role */}
        {companyId && (companyRole === 'company_admin' || companyRole === 'company_manager') && (
          <Card className="glass card-hover">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Database className="h-4 w-4 text-primary" />
                Données de test
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Générer 50 clients, 500 factures et des paiements de démonstration pour tester l'application.
              </p>
              <div className="flex gap-2">
                <Button 
                  onClick={() => handleSeedData(false)} 
                  disabled={seeding}
                  variant="outline"
                  className="flex-1"
                >
                  {seeding ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Création...
                    </>
                  ) : (
                    <>
                      <Database className="mr-2 h-4 w-4" />
                      Générer
                    </>
                  )}
                </Button>
                <Button 
                  onClick={() => handleSeedData(true)} 
                  disabled={seeding}
                  variant="destructive"
                  size="sm"
                >
                  Forcer
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Le bouton "Forcer" ajoutera des données même si des données existent déjà.
            </p>
            <p className="text-xs text-muted-foreground pt-2 border-t border-border/50">
              Développé par <span className="font-semibold text-primary">Pellel-Connect</span>
            </p>
          </CardContent>
        </Card>
        )}

        {/* App Info */}
        <Card className="glass card-hover">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">À propos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm font-medium">FactureGN v2.0.0</p>
            <p className="text-sm text-muted-foreground">
              Plateforme de facturation multi-entreprises pour la Guinée
            </p>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
