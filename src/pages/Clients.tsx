import { useState, useMemo } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useClients, Client } from '@/hooks/useClients';
import { useInvoices } from '@/hooks/useInvoices';
import { useAuth } from '@/hooks/useAuth';
import { formatGNF, formatDate } from '@/lib/formatCurrency';
import { Plus, Search, User, Phone, Mail, Trash2, Edit, Loader2, FileText, ChevronRight, ChevronDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

const statusConfig = {
  draft: { label: 'Brouillon', class: 'status-draft' },
  sent: { label: 'Envoyée', class: 'status-sent' },
  partial: { label: 'Partiel', class: 'status-partial' },
  paid: { label: 'Payée', class: 'status-paid' },
  cancelled: { label: 'Annulée', class: 'status-cancelled' },
};

export default function Clients() {
  const { clients, isLoading, deleteClient } = useClients();
  const { invoices } = useInvoices();
  const { canManageCompany } = useAuth();
  const [search, setSearch] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [expandedClient, setExpandedClient] = useState<string | null>(null);

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(search.toLowerCase()) ||
    client.email?.toLowerCase().includes(search.toLowerCase())
  );

  // Get invoice stats per client
  const clientStats = useMemo(() => {
    const stats: Record<string, { total: number; count: number; pending: number; paid: number }> = {};
    
    invoices.forEach(inv => {
      if (!inv.client_id) return;
      if (!stats[inv.client_id]) {
        stats[inv.client_id] = { total: 0, count: 0, pending: 0, paid: 0 };
      }
      stats[inv.client_id].count++;
      stats[inv.client_id].total += Number(inv.total);
      if (inv.status === 'paid') {
        stats[inv.client_id].paid++;
      } else if (inv.status !== 'cancelled' && inv.status !== 'draft') {
        stats[inv.client_id].pending++;
      }
    });
    
    return stats;
  }, [invoices]);

  // Get invoices for expanded client
  const getClientInvoices = (clientId: string) => {
    return invoices
      .filter(inv => inv.client_id === clientId)
      .sort((a, b) => new Date(b.issue_date).getTime() - new Date(a.issue_date).getTime())
      .slice(0, 5);
  };

  const handleDelete = () => {
    if (deleteId) {
      deleteClient.mutate(deleteId);
      setDeleteId(null);
    }
  };

  return (
    <AppLayout title="Clients">
      <div className="space-y-4">
        {/* Search & Add */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher un client..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          {canManageCompany && (
            <Link to="/clients/new">
              <Button size="icon">
                <Plus className="h-4 w-4" />
              </Button>
            </Link>
          )}
        </div>

        {/* Clients List */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredClients.length === 0 ? (
          <Card className="glass">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <User className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {search ? 'Aucun client trouvé' : 'Aucun client pour le moment'}
              </p>
              {!search && canManageCompany && (
                <Link to="/clients/new" className="mt-4">
                  <Button variant="outline" className="gap-2">
                    <Plus className="h-4 w-4" />
                    Ajouter un client
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredClients.map((client, index) => {
              const stats = clientStats[client.id] || { total: 0, count: 0, pending: 0, paid: 0 };
              const isExpanded = expandedClient === client.id;
              const clientInvoices = isExpanded ? getClientInvoices(client.id) : [];

              return (
                <Collapsible
                  key={client.id}
                  open={isExpanded}
                  onOpenChange={() => setExpandedClient(isExpanded ? null : client.id)}
                >
                  <Card className="glass animate-slide-up overflow-hidden" style={{ animationDelay: `${Math.min(index, 10) * 0.03}s` }}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <CollapsibleTrigger className="flex items-start gap-3 text-left flex-1">
                          <div className="p-2 bg-primary/10 rounded-lg shrink-0 mt-0.5">
                            <User className="h-4 w-4 text-primary" />
                          </div>
                          <div className="space-y-1 min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold">{client.name}</h3>
                              {isExpanded ? (
                                <ChevronDown className="h-4 w-4 text-muted-foreground" />
                              ) : (
                                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                              )}
                            </div>
                            {client.email && (
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Mail className="h-3 w-3" />
                                <span className="truncate">{client.email}</span>
                              </div>
                            )}
                            {client.phone && (
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Phone className="h-3 w-3" />
                                {client.phone}
                              </div>
                            )}
                            {stats.count > 0 && (
                              <div className="flex items-center gap-2 mt-2">
                                <Badge variant="secondary" className="text-xs">
                                  <FileText className="h-3 w-3 mr-1" />
                                  {stats.count} facture{stats.count > 1 ? 's' : ''}
                                </Badge>
                                {stats.pending > 0 && (
                                  <Badge variant="outline" className="text-xs text-warning border-warning/30">
                                    {stats.pending} en attente
                                  </Badge>
                                )}
                              </div>
                            )}
                          </div>
                        </CollapsibleTrigger>
                        <div className="flex flex-col items-end gap-2">
                          {canManageCompany && (
                            <div className="flex gap-1">
                              <Link to={`/clients/${client.id}/edit`}>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </Link>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:text-destructive"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeleteId(client.id);
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                          {stats.total > 0 && (
                            <p className="text-sm font-semibold text-right">
                              {formatGNF(stats.total)}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>

                    <CollapsibleContent>
                      <div className="px-4 pb-4 pt-0 border-t border-border/50 mt-2">
                        <div className="space-y-2 mt-3">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-medium text-muted-foreground">Dernières factures</h4>
                            <Link to={`/invoices?client=${client.id}`}>
                              <Button variant="ghost" size="sm" className="text-xs h-7">
                                Voir tout
                              </Button>
                            </Link>
                          </div>
                          {clientInvoices.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-4">
                              Aucune facture
                            </p>
                          ) : (
                            clientInvoices.map(inv => {
                              const status = statusConfig[inv.status as keyof typeof statusConfig] || statusConfig.draft;
                              return (
                                <Link key={inv.id} to={`/invoices/${inv.id}`}>
                                  <div className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors">
                                    <div>
                                      <p className="text-sm font-medium">{inv.invoice_number}</p>
                                      <p className="text-xs text-muted-foreground">{formatDate(inv.issue_date)}</p>
                                    </div>
                                    <div className="text-right">
                                      <p className="text-sm font-semibold">{formatGNF(inv.total)}</p>
                                      <Badge className={`${status.class} text-xs`} variant="secondary">
                                        {status.label}
                                      </Badge>
                                    </div>
                                  </div>
                                </Link>
                              );
                            })
                          )}
                          {canManageCompany && (
                            <Link to={`/invoices/new?client=${client.id}`} className="block">
                              <Button variant="outline" size="sm" className="w-full text-xs gap-1">
                                <Plus className="h-3 w-3" />
                                Nouvelle facture pour ce client
                              </Button>
                            </Link>
                          )}
                        </div>
                      </div>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>
              );
            })}
          </div>
        )}
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce client ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Le client sera définitivement supprimé.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
