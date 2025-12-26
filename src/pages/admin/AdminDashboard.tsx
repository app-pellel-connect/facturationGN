import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { companiesApi } from '@/lib/api/companies';
import { subscriptionsApi } from '@/lib/api/subscriptions';
import { auditApi } from '@/lib/api/audit';
import { adminApi } from '@/lib/api/admin';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Building2, 
  Users, 
  Clock, 
  CheckCircle, 
  XCircle,
  Crown,
  Loader2,
  RefreshCw,
  Shield,
  CreditCard,
  ScrollText,
  AlertTriangle,
  Settings,
  Pencil,
  Trash2
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { EditSubscriptionDialog } from '@/components/admin/EditSubscriptionDialog';
import { EditCompanyDialog } from '@/components/admin/EditCompanyDialog';
import { DeleteCompanyDialog } from '@/components/admin/DeleteCompanyDialog';

interface Company {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  city: string | null;
  address: string | null;
  status: 'pending' | 'approved' | 'suspended' | 'rejected';
  created_at: string;
}

interface Subscription {
  id: string;
  company_id: string;
  plan_name: string;
  status: string;
  max_users: number;
  max_invoices_per_month: number;
  max_clients: number;
  expires_at: string | null;
  company?: { name: string };
}

interface AuditLog {
  id: string;
  user_id: string;
  company_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  created_at: string;
  profile?: { full_name: string; email: string } | null;
  company?: { name: string } | null;
}

interface Stats {
  totalCompanies: number;
  pendingCompanies: number;
  approvedCompanies: number;
  suspendedCompanies: number;
  rejectedCompanies: number;
  totalUsers: number;
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();
  const [companies, setCompanies] = useState<Company[]>([]);
  
  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalCompanies: 0,
    pendingCompanies: 0,
    approvedCompanies: 0,
    suspendedCompanies: 0,
    rejectedCompanies: 0,
    totalUsers: 0,
  });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('companies');
  const [editingSubscription, setEditingSubscription] = useState<Subscription | null>(null);
  const [subscriptionDialogOpen, setSubscriptionDialogOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [companyDialogOpen, setCompanyDialogOpen] = useState(false);
  const [deletingCompany, setDeletingCompany] = useState<Company | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch companies
      const companiesData = await companiesApi.getAll();
      setCompanies(companiesData);

      // Fetch stats
      const statsData = await adminApi.getStats();
      setStats(statsData);

      // Fetch subscriptions
      const subsData = await subscriptionsApi.getAll();
      setSubscriptions(subsData);

      // Fetch audit logs
      const logsData = await auditApi.getAll(50);
      setAuditLogs(logsData);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCompanyAction = async (companyId: string, action: 'approve' | 'reject' | 'suspend') => {
    setActionLoading(companyId);
    try {
      const newStatus = action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'suspended';
      
      await companiesApi.update(companyId, {
        status: newStatus,
        rejection_reason: action === 'reject' ? 'Rejetée par l\'administrateur' : undefined,
      });

      toast.success(
        action === 'approve' ? 'Entreprise approuvée' : 
        action === 'reject' ? 'Entreprise rejetée' : 
        'Entreprise suspendue'
      );
      fetchData();
    } catch (error) {
      console.error('Error updating company:', error);
      toast.error('Erreur lors de la mise à jour');
    } finally {
      setActionLoading(null);
    }
  };

  const handleSaveSubscription = async (
    subscriptionId: string,
    data: {
      plan_name: string;
      status: string;
      max_users: number;
      max_invoices_per_month: number;
      max_clients: number;
    }
  ) => {
    try {
      await subscriptionsApi.update(subscriptionId, {
        plan_name: data.plan_name,
        status: data.status as 'trial' | 'active' | 'expired' | 'cancelled',
        max_users: data.max_users,
        max_invoices_per_month: data.max_invoices_per_month,
        max_clients: data.max_clients,
      });

      toast.success('Abonnement mis à jour avec succès');
      fetchData();
    } catch (error) {
      toast.error('Erreur lors de la mise à jour de l\'abonnement');
      throw error;
    }
  };

  const openEditSubscription = (subscription: Subscription) => {
    setEditingSubscription(subscription);
    setSubscriptionDialogOpen(true);
  };

  const openEditCompany = (company: Company) => {
    setEditingCompany(company);
    setCompanyDialogOpen(true);
  };

  const openDeleteCompany = (company: Company) => {
    setDeletingCompany(company);
    setDeleteDialogOpen(true);
  };

  const handleSaveCompany = async (
    companyId: string,
    data: {
      name: string;
      email: string;
      phone: string | null;
      city: string | null;
      address: string | null;
    }
  ) => {
    try {
      await companiesApi.update(companyId, data);
      toast.success('Entreprise mise à jour avec succès');
      fetchData();
    } catch (error) {
      toast.error('Erreur lors de la mise à jour de l\'entreprise');
      throw error;
    }
  };

  const handleDeleteCompany = async (companyId: string) => {
    try {
      // La suppression en cascade gère automatiquement les relations
      await companiesApi.delete(companyId);
      toast.success('Entreprise supprimée avec succès');
      fetchData();
    } catch (error) {
      toast.error('Erreur lors de la suppression de l\'entreprise');
      throw error;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="bg-warning/20 text-warning"><Clock className="h-3 w-3 mr-1" />En attente</Badge>;
      case 'approved':
        return <Badge variant="secondary" className="bg-success/20 text-success"><CheckCircle className="h-3 w-3 mr-1" />Approuvée</Badge>;
      case 'rejected':
        return <Badge variant="secondary" className="bg-destructive/20 text-destructive"><XCircle className="h-3 w-3 mr-1" />Rejetée</Badge>;
      case 'suspended':
        return <Badge variant="secondary" className="bg-warning/20 text-warning"><AlertTriangle className="h-3 w-3 mr-1" />Suspendue</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getSubscriptionBadge = (status: string) => {
    switch (status) {
      case 'trial':
        return <Badge variant="secondary" className="bg-info/20 text-info">Essai</Badge>;
      case 'active':
        return <Badge variant="secondary" className="bg-success/20 text-success">Actif</Badge>;
      case 'expired':
        return <Badge variant="secondary" className="bg-destructive/20 text-destructive">Expiré</Badge>;
      case 'cancelled':
        return <Badge variant="secondary" className="bg-muted text-muted-foreground">Annulé</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      'company_created': 'Entreprise créée',
      'company_approved': 'Entreprise approuvée',
      'company_rejected': 'Entreprise rejetée',
      'company_suspended': 'Entreprise suspendue',
      'invoice_created': 'Facture créée',
      'invoice_updated': 'Facture mise à jour',
      'payment_recorded': 'Paiement enregistré',
      'client_created': 'Client créé',
    };
    return labels[action] || action;
  };

  return (
    <AppLayout title="Administration">
      <div className="space-y-4 px-2 sm:px-0">
        {/* Owner Badge */}
        <Card className="glass border-primary/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Crown className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold">{profile?.full_name || 'Propriétaire'}</p>
                  <p className="text-sm text-muted-foreground">Propriétaire de la plateforme</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={handleSignOut}>
                Déconnexion
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card className="glass">
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Building2 className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-xl font-bold">{stats.totalCompanies}</p>
                  <p className="text-xs text-muted-foreground">Entreprises</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass">
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-warning/10">
                  <Clock className="h-4 w-4 text-warning" />
                </div>
                <div>
                  <p className="text-xl font-bold">{stats.pendingCompanies}</p>
                  <p className="text-xs text-muted-foreground">En attente</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass">
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-accent/10">
                  <Users className="h-4 w-4 text-accent" />
                </div>
                <div>
                  <p className="text-xl font-bold">{stats.totalUsers}</p>
                  <p className="text-xs text-muted-foreground">Utilisateurs</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass col-span-2 sm:col-span-1">
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-success/10">
                  <CheckCircle className="h-4 w-4 text-success" />
                </div>
                <div>
                  <p className="text-xl font-bold">{stats.approvedCompanies}</p>
                  <p className="text-xs text-muted-foreground">Approuvées</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-3 h-auto">
            <TabsTrigger value="companies" className="text-xs sm:text-sm py-2">
              <Building2 className="h-4 w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Entreprises</span>
              <span className="sm:hidden">Entr.</span>
            </TabsTrigger>
            <TabsTrigger value="subscriptions" className="text-xs sm:text-sm py-2">
              <CreditCard className="h-4 w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Abonnements</span>
              <span className="sm:hidden">Abon.</span>
            </TabsTrigger>
            <TabsTrigger value="logs" className="text-xs sm:text-sm py-2">
              <ScrollText className="h-4 w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Logs d'audit</span>
              <span className="sm:hidden">Logs</span>
            </TabsTrigger>
          </TabsList>

          {/* Companies Tab */}
          <TabsContent value="companies" className="space-y-4">
            {/* Pending Companies */}
            {stats.pendingCompanies > 0 && (
              <Card className="glass border-warning/30">
                <CardHeader className="pb-2 px-4 pt-4">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2 text-warning">
                    <Clock className="h-4 w-4" />
                    Entreprises en attente d'approbation ({stats.pendingCompanies})
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y divide-border">
                    {companies
                      .filter(c => c.status === 'pending')
                      .map(company => (
                        <div key={company.id} className="p-4 space-y-3">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-semibold">{company.name}</p>
                              <p className="text-sm text-muted-foreground">{company.email}</p>
                              {company.city && <p className="text-xs text-muted-foreground">{company.city}</p>}
                            </div>
                            {getStatusBadge(company.status)}
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              onClick={() => handleCompanyAction(company.id, 'approve')}
                              disabled={actionLoading === company.id}
                              className="flex-1"
                            >
                              {actionLoading === company.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <>
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Approuver
                                </>
                              )}
                            </Button>
                            <Button 
                              size="sm" 
                              variant="destructive"
                              onClick={() => handleCompanyAction(company.id, 'reject')}
                              disabled={actionLoading === company.id}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Rejeter
                            </Button>
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* All Companies */}
            <Card className="glass">
              <CardHeader className="pb-2 px-4 pt-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Toutes les entreprises ({stats.totalCompanies})
                  </CardTitle>
                  <Button variant="ghost" size="sm" onClick={fetchData} disabled={loading}>
                    <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {loading ? (
                  <div className="p-8 text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                  </div>
                ) : companies.length === 0 ? (
                  <p className="p-4 text-center text-muted-foreground">
                    Aucune entreprise enregistrée
                  </p>
                ) : (
                  <div className="divide-y divide-border">
                    {companies.map(company => (
                      <div key={company.id} className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <p className="font-semibold">{company.name}</p>
                            <p className="text-sm text-muted-foreground">{company.email}</p>
                            {company.city && <p className="text-xs text-muted-foreground">{company.city}</p>}
                            <p className="text-xs text-muted-foreground">
                              Inscrit le {format(new Date(company.created_at), 'dd MMM yyyy', { locale: fr })}
                            </p>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            {getStatusBadge(company.status)}
                            <div className="flex gap-1">
                              <Button 
                                size="sm" 
                                variant="ghost"
                                onClick={() => openEditCompany(company)}
                                className="h-7 w-7 p-0"
                                title="Modifier"
                              >
                                <Pencil className="h-3 w-3" />
                              </Button>
                              <Button 
                                size="sm" 
                                variant="ghost"
                                onClick={() => openDeleteCompany(company)}
                                className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                                title="Supprimer"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                            {company.status === 'approved' && (
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleCompanyAction(company.id, 'suspend')}
                                disabled={actionLoading === company.id}
                                className="text-xs"
                              >
                                Suspendre
                              </Button>
                            )}
                            {company.status === 'suspended' && (
                              <Button 
                                size="sm" 
                                onClick={() => handleCompanyAction(company.id, 'approve')}
                                disabled={actionLoading === company.id}
                                className="text-xs"
                              >
                                Réactiver
                              </Button>
                            )}
                            {company.status === 'rejected' && (
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleCompanyAction(company.id, 'approve')}
                                disabled={actionLoading === company.id}
                                className="text-xs"
                              >
                                Approuver
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Subscriptions Tab */}
          <TabsContent value="subscriptions" className="space-y-4">
            <Card className="glass">
              <CardHeader className="pb-2 px-4 pt-4">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Gestion des abonnements
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {loading ? (
                  <div className="p-8 text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                  </div>
                ) : subscriptions.length === 0 ? (
                  <p className="p-4 text-center text-muted-foreground">
                    Aucun abonnement
                  </p>
                ) : (
                  <div className="divide-y divide-border">
                    {subscriptions.map(sub => (
                      <div key={sub.id} className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <p className="font-semibold">{sub.company?.name || 'Entreprise'}</p>
                            <p className="text-sm text-muted-foreground capitalize">{sub.plan_name}</p>
                            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                              <span>{sub.max_users} utilisateurs</span>
                              <span>•</span>
                              <span>{sub.max_invoices_per_month} factures/mois</span>
                              <span>•</span>
                              <span>{sub.max_clients} clients</span>
                            </div>
                            {sub.expires_at && (
                              <p className="text-xs text-muted-foreground">
                                Expire le {format(new Date(sub.expires_at), 'dd MMM yyyy', { locale: fr })}
                              </p>
                            )}
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            {getSubscriptionBadge(sub.status)}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openEditSubscription(sub)}
                              className="text-xs"
                            >
                              <Settings className="h-3 w-3 mr-1" />
                              Modifier
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Audit Logs Tab */}
          <TabsContent value="logs" className="space-y-4">
            <Card className="glass">
              <CardHeader className="pb-2 px-4 pt-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <ScrollText className="h-4 w-4" />
                    Logs d'audit récents
                  </CardTitle>
                  <Button variant="ghost" size="sm" onClick={fetchData} disabled={loading}>
                    <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {loading ? (
                  <div className="p-8 text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                  </div>
                ) : auditLogs.length === 0 ? (
                  <p className="p-4 text-center text-muted-foreground">
                    Aucun log d'audit
                  </p>
                ) : (
                  <div className="divide-y divide-border max-h-[500px] overflow-y-auto">
                    {auditLogs.map(log => (
                      <div key={log.id} className="p-4">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <p className="font-medium text-sm">{getActionLabel(log.action)}</p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(log.created_at), 'dd/MM/yy HH:mm', { locale: fr })}
                            </p>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Par: {log.profile?.full_name || log.profile?.email || 'Utilisateur inconnu'}
                          </p>
                          {log.company && (
                            <p className="text-xs text-muted-foreground">
                              Entreprise: {log.company.name}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Edit Subscription Dialog */}
        <EditSubscriptionDialog
          subscription={editingSubscription}
          open={subscriptionDialogOpen}
          onOpenChange={setSubscriptionDialogOpen}
          onSave={handleSaveSubscription}
        />

        {/* Edit Company Dialog */}
        <EditCompanyDialog
          company={editingCompany}
          open={companyDialogOpen}
          onOpenChange={setCompanyDialogOpen}
          onSave={handleSaveCompany}
        />

        {/* Delete Company Dialog */}
        <DeleteCompanyDialog
          company={deletingCompany}
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          onConfirm={handleDeleteCompany}
        />
      </div>
    </AppLayout>
  );
}
