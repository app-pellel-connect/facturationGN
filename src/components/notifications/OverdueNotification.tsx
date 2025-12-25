import { useState, useEffect } from 'react';
import { useInvoices } from '@/hooks/useInvoices';
import { formatGNF } from '@/lib/formatCurrency';
import { AlertTriangle, X, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';

export function OverdueNotification() {
  const { invoices } = useInvoices();
  const [dismissed, setDismissed] = useState(() => {
    // Afficher uniquement si c'est une nouvelle session (reconnexion)
    return sessionStorage.getItem('overdue_notification_dismissed') === 'true';
  });
  const [expanded, setExpanded] = useState(false);

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem('overdue_notification_dismissed', 'true');
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const overdueInvoices = invoices.filter(inv => {
    if (inv.status === 'paid' || inv.status === 'cancelled' || inv.status === 'draft') return false;
    if (!inv.due_date) return false;
    const dueDate = new Date(inv.due_date);
    return dueDate < today;
  });

  const totalOverdue = overdueInvoices.reduce((sum, inv) => {
    return sum + (inv.balance ?? (Number(inv.total) - Number(inv.paid_amount || 0)));
  }, 0);

  if (dismissed || overdueInvoices.length === 0) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 md:left-auto md:right-6 md:w-96 z-50 animate-slide-up">
      <div className="bg-destructive/10 border border-destructive/30 backdrop-blur-md rounded-xl p-4 shadow-lg">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-destructive/20 rounded-lg shrink-0">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="font-semibold text-sm">Factures en retard</h4>
                <Badge variant="destructive" className="text-xs">
                  {overdueInvoices.length}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Total impayé: <span className="font-semibold text-destructive">{formatGNF(totalOverdue)}</span>
              </p>
              
              {expanded && (
                <div className="mt-3 space-y-2 max-h-32 overflow-y-auto">
                  {overdueInvoices.slice(0, 5).map(inv => (
                    <Link
                      key={inv.id}
                      to={`/invoices/${inv.id}`}
                      className="flex items-center justify-between text-xs p-2 bg-background/50 rounded-lg hover:bg-background/80 transition-colors"
                    >
                      <div>
                        <span className="font-medium">{inv.invoice_number}</span>
                        <span className="text-muted-foreground ml-2">
                          {inv.clients?.name}
                        </span>
                      </div>
                      <span className="text-destructive font-medium">
                        {formatGNF(inv.balance ?? (Number(inv.total) - Number(inv.paid_amount || 0)))}
                      </span>
                    </Link>
                  ))}
                  {overdueInvoices.length > 5 && (
                    <p className="text-xs text-center text-muted-foreground">
                      +{overdueInvoices.length - 5} autres factures
                    </p>
                  )}
                </div>
              )}
              
              <div className="flex gap-2 mt-3">
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs h-7"
                  onClick={() => setExpanded(!expanded)}
                >
                  {expanded ? 'Réduire' : 'Voir détails'}
                </Button>
                <Link to="/invoices?status=overdue">
                  <Button size="sm" className="text-xs h-7">
                    Gérer
                  </Button>
                </Link>
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 shrink-0"
            onClick={handleDismiss}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export function NotificationBell() {
  const { invoices } = useInvoices();
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const overdueCount = invoices.filter(inv => {
    if (inv.status === 'paid' || inv.status === 'cancelled' || inv.status === 'draft') return false;
    if (!inv.due_date) return false;
    const dueDate = new Date(inv.due_date);
    return dueDate < today;
  }).length;

  if (overdueCount === 0) return null;

  return (
    <div className="relative">
      <Bell className="h-5 w-5 text-destructive animate-pulse" />
      <span className="absolute -top-1 -right-1 h-4 w-4 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center">
        {overdueCount > 9 ? '9+' : overdueCount}
      </span>
    </div>
  );
}
