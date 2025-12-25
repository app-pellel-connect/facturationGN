import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { useClients } from '@/hooks/useClients';
import { useInvoices } from '@/hooks/useInvoices';
import { Users, FileText, TrendingUp, Plus, Banknote, Clock, AlertTriangle, CalendarClock } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatGNF } from '@/lib/formatCurrency';
import { differenceInDays } from 'date-fns';
import { useMemo } from 'react';

const statusConfig = {
  draft: { label: 'Brouillon', class: 'status-draft', bgClass: 'bg-muted hover:bg-muted/80' },
  sent: { label: 'Envoyée', class: 'status-sent', bgClass: 'bg-primary/10 hover:bg-primary/20' },
  partial: { label: 'Partiel', class: 'status-partial', bgClass: 'bg-warning/10 hover:bg-warning/20' },
  paid: { label: 'Payée', class: 'status-paid', bgClass: 'bg-success/10 hover:bg-success/20' },
  cancelled: { label: 'Annulée', class: 'status-cancelled', bgClass: 'bg-destructive/10 hover:bg-destructive/20' },
  overdue: { label: 'En retard', class: 'bg-destructive/20 text-destructive', bgClass: 'bg-destructive/10 hover:bg-destructive/20' },
};

export default function Dashboard() {
  const { canManageCompany } = useAuth();
  const { clients } = useClients();
  const { invoices } = useInvoices();
  const navigate = useNavigate();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Invoice statistics by status
  const invoiceStats = useMemo(() => {
    const stats = {
      draft: { count: 0, amount: 0 },
      sent: { count: 0, amount: 0 },
      partial: { count: 0, amount: 0 },
      paid: { count: 0, amount: 0 },
      cancelled: { count: 0, amount: 0 },
      overdue: { count: 0, amount: 0 },
    };

    invoices.forEach(inv => {
      const status = inv.status as keyof typeof stats;
      if (stats[status]) {
        stats[status].count++;
        stats[status].amount += Number(inv.total);
      }

      // Check if overdue (sent or partial and past due date)
      if ((inv.status === 'sent' || inv.status === 'partial') && inv.due_date) {
        const dueDate = new Date(inv.due_date);
        if (dueDate < today) {
          stats.overdue.count++;
          stats.overdue.amount += Number(inv.balance ?? (Number(inv.total) - Number(inv.paid_amount || 0)));
        }
      }
    });

    return stats;
  }, [invoices, today]);

  const totalRevenue = invoices
    .filter(inv => inv.status === 'paid')
    .reduce((sum, inv) => sum + Number(inv.total), 0);

  const totalPaid = invoices.reduce((sum, inv) => sum + Number(inv.paid_amount || 0), 0);

  const pendingAmount = invoices
    .filter(inv => inv.status !== 'paid' && inv.status !== 'cancelled')
    .reduce((sum, inv) => sum + Number(inv.balance || inv.total), 0);

  const partialPayments = invoices.filter(inv => inv.status === 'partial').length;

  const recentInvoices = invoices.slice(0, 5);

  // Factures en retard (triées par date d'échéance, les plus anciennes en premier)
  const overdueInvoices = invoices
    .filter(inv => {
      if (inv.status === 'paid' || inv.status === 'cancelled' || inv.status === 'draft') return false;
      if (!inv.due_date) return false;
      const dueDate = new Date(inv.due_date);
      return dueDate < today;
    })
    .sort((a, b) => new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime())
    .slice(0, 5);

  // Prochaines factures à échéance (dans les 30 prochains jours)
  const upcomingInvoices = invoices
    .filter(inv => {
      if (inv.status === 'paid' || inv.status === 'cancelled' || inv.status === 'draft') return false;
      if (!inv.due_date) return false;
      const dueDate = new Date(inv.due_date);
      return dueDate >= today;
    })
    .sort((a, b) => new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime())
    .slice(0, 5);

  const getDaysOverdue = (dueDate: string) => {
    return differenceInDays(today, new Date(dueDate));
  };

  const getDaysUntilDue = (dueDate: string) => {
    return differenceInDays(new Date(dueDate), today);
  };

  const handleStatusClick = (status: string) => {
    navigate(`/invoices?status=${status}`);
  };

  return (
    <AppLayout title="Tableau de bord">
      <div className="space-y-4">
        {/* Stats Cards - 2x2 Grid for mobile */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="glass card-hover">
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Users className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-xl font-bold">{clients.length}</p>
                  <p className="text-xs text-muted-foreground">Clients</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass card-hover">
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-accent/10">
                  <FileText className="h-4 w-4 text-accent" />
                </div>
                <div>
                  <p className="text-xl font-bold">{invoices.length}</p>
                  <p className="text-xs text-muted-foreground">Factures</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass card-hover">
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-success/10">
                  <Banknote className="h-4 w-4 text-success" />
                </div>
                <div>
                  <p className="text-sm font-bold truncate">{formatGNF(totalPaid)}</p>
                  <p className="text-xs text-muted-foreground">Encaissé</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass card-hover">
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-warning/10">
                  <Clock className="h-4 w-4 text-warning" />
                </div>
                <div>
                  <p className="text-sm font-bold truncate">{formatGNF(pendingAmount)}</p>
                  <p className="text-xs text-muted-foreground">En attente</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Invoice Statistics by Status */}
        <Card className="glass">
          <CardHeader className="pb-2 px-4 pt-4">
            <CardTitle className="text-sm font-semibold">Statuts des factures</CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(invoiceStats).map(([status, data]) => {
                if (data.count === 0) return null;
                const config = statusConfig[status as keyof typeof statusConfig];
                return (
                  <button
                    key={status}
                    onClick={() => handleStatusClick(status)}
                    className={`p-2 rounded-lg text-left transition-all ${config.bgClass} active:scale-95`}
                  >
                    <Badge className={`${config.class} text-xs mb-1`} variant="secondary">
                      {config.label}
                    </Badge>
                    <p className="text-lg font-bold">{data.count}</p>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Partial payments alert */}
        {partialPayments > 0 && (
          <Card className="border-warning/50 bg-warning/5">
            <CardContent className="p-3 flex items-center gap-3">
              <TrendingUp className="h-5 w-5 text-warning shrink-0" />
              <div className="text-sm">
                <span className="font-semibold">{partialPayments} facture(s)</span> avec paiement partiel en attente de solde
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Actions - Only for admin/manager */}
        {canManageCompany && (
          <div className="flex gap-2">
            <Link to="/clients/new" className="flex-1">
              <Button className="w-full gap-2" variant="outline" size="sm">
                <Plus className="h-4 w-4" />
                Client
              </Button>
            </Link>
            <Link to="/invoices/new" className="flex-1">
              <Button className="w-full gap-2" size="sm">
                <Plus className="h-4 w-4" />
                Facture
              </Button>
            </Link>
          </div>
        )}

        {/* Overdue Invoices */}
        {overdueInvoices.length > 0 && (
          <Card className="glass border-destructive/30">
            <CardHeader className="pb-2 px-4 pt-4">
              <CardTitle className="text-sm font-semibold flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-4 w-4" />
                Factures en retard
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {overdueInvoices.map((invoice) => {
                  const daysOverdue = getDaysOverdue(invoice.due_date!);
                  return (
                    <Link
                      key={invoice.id}
                      to={`/invoices/${invoice.id}`}
                      className="flex items-center justify-between p-3 hover:bg-destructive/5 transition-colors active:bg-destructive/10"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm truncate">{invoice.invoice_number}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {invoice.clients?.name || 'Sans client'}
                        </p>
                      </div>
                      <div className="text-right ml-2">
                        <p className="font-semibold text-sm text-destructive">
                          {formatGNF(invoice.balance ?? (Number(invoice.total) - Number(invoice.paid_amount || 0)))}
                        </p>
                        <span className="text-xs text-destructive/80">
                          {daysOverdue} jour{daysOverdue > 1 ? 's' : ''} de retard
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Upcoming Invoices */}
        {upcomingInvoices.length > 0 && (
          <Card className="glass border-primary/30">
            <CardHeader className="pb-2 px-4 pt-4">
              <CardTitle className="text-sm font-semibold flex items-center gap-2 text-primary">
                <CalendarClock className="h-4 w-4" />
                Prochaines échéances
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {upcomingInvoices.map((invoice) => {
                  const daysUntil = getDaysUntilDue(invoice.due_date!);
                  const isUrgent = daysUntil <= 3;
                  return (
                    <Link
                      key={invoice.id}
                      to={`/invoices/${invoice.id}`}
                      className="flex items-center justify-between p-3 hover:bg-primary/5 transition-colors active:bg-primary/10"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm truncate">{invoice.invoice_number}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {invoice.clients?.name || 'Sans client'}
                        </p>
                      </div>
                      <div className="text-right ml-2">
                        <p className="font-semibold text-sm">
                          {formatGNF(invoice.balance ?? (Number(invoice.total) - Number(invoice.paid_amount || 0)))}
                        </p>
                        <span className={`text-xs ${isUrgent ? 'text-warning font-medium' : 'text-muted-foreground'}`}>
                          {daysUntil === 0 ? "Aujourd'hui" : `Dans ${daysUntil} jour${daysUntil > 1 ? 's' : ''}`}
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Invoices */}
        <Card className="glass">
          <CardHeader className="pb-2 px-4 pt-4">
            <CardTitle className="text-sm font-semibold">Factures récentes</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {recentInvoices.length === 0 ? (
              <p className="p-4 text-sm text-muted-foreground text-center">
                Aucune facture pour le moment
              </p>
            ) : (
              <div className="divide-y divide-border">
                {recentInvoices.map((invoice) => {
                  const status = statusConfig[invoice.status as keyof typeof statusConfig] || statusConfig.draft;
                  return (
                    <Link
                      key={invoice.id}
                      to={`/invoices/${invoice.id}`}
                      className="flex items-center justify-between p-3 hover:bg-muted/50 transition-colors active:bg-muted"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm truncate">{invoice.invoice_number}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {invoice.clients?.name || 'Sans client'}
                        </p>
                      </div>
                      <div className="text-right ml-2">
                        <p className="font-semibold text-sm">{formatGNF(invoice.total)}</p>
                        <Badge className={`${status.class} text-xs`} variant="secondary">
                          {status.label}
                        </Badge>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
