import { useState } from 'react';
import { Bell, User, LogOut, Settings, ChevronDown, Users, Building2, Shield } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useInvoices } from '@/hooks/useInvoices';
import { formatGNF } from '@/lib/formatCurrency';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuPortal,
} from '@/components/ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

const roleLabels: Record<string, string> = {
  platform_owner: 'Propriétaire',
  company_admin: 'Administrateur',
  company_manager: 'Gestionnaire',
  company_user: 'Utilisateur',
};

export function HeaderActions() {
  const { user, signOut, companyRole, companyMembership, isPlatformOwner } = useAuth();
  const { invoices } = useInvoices();
  const navigate = useNavigate();
  const [notifOpen, setNotifOpen] = useState(false);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const overdueInvoices = invoices.filter(inv => {
    if (inv.status === 'paid' || inv.status === 'cancelled' || inv.status === 'draft') return false;
    if (!inv.due_date) return false;
    const dueDate = new Date(inv.due_date);
    return dueDate < today;
  });

  const overdueCount = overdueInvoices.length;
  const totalOverdue = overdueInvoices.reduce((sum, inv) => {
    return sum + (inv.balance ?? (Number(inv.total) - Number(inv.paid_amount || 0)));
  }, 0);

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const userInitials = user?.email?.slice(0, 2).toUpperCase() || 'U';
  const isAdmin = companyRole === 'company_admin';
  const canManage = companyRole === 'company_admin' || companyRole === 'company_manager';

  return (
    <div className="flex items-center gap-2">
      {/* Notification Bell */}
      <Popover open={notifOpen} onOpenChange={setNotifOpen}>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon" className="relative">
            <Bell className={`h-5 w-5 ${overdueCount > 0 ? 'text-destructive' : ''}`} />
            {overdueCount > 0 && (
              <Badge 
                variant="destructive" 
                className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
              >
                {overdueCount > 9 ? '9+' : overdueCount}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-80 p-0 bg-popover border border-border shadow-lg">
          <div className="p-4 border-b border-border">
            <h4 className="font-semibold text-sm">Notifications</h4>
          </div>
          {overdueCount === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Aucune notification
            </div>
          ) : (
            <div className="p-2">
              <div className="p-3 bg-destructive/10 rounded-lg mb-2">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-destructive">
                    {overdueCount} facture{overdueCount > 1 ? 's' : ''} en retard
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Total impayé: <span className="font-semibold">{formatGNF(totalOverdue)}</span>
                </p>
              </div>
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {overdueInvoices.slice(0, 5).map(inv => (
                  <Link
                    key={inv.id}
                    to={`/invoices/${inv.id}`}
                    onClick={() => setNotifOpen(false)}
                    className="flex items-center justify-between text-xs p-2 rounded-lg hover:bg-muted transition-colors"
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
              </div>
              {overdueCount > 5 && (
                <Link
                  to="/invoices?status=overdue"
                  onClick={() => setNotifOpen(false)}
                  className="block text-center text-xs text-primary hover:underline py-2"
                >
                  Voir toutes les {overdueCount} factures
                </Link>
              )}
            </div>
          )}
        </PopoverContent>
      </Popover>

      {/* User Profile */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="gap-2 px-2">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                {userInitials}
              </AvatarFallback>
            </Avatar>
            <ChevronDown className="h-4 w-4 text-muted-foreground hidden sm:block" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56 bg-popover border border-border shadow-lg z-50">
          <DropdownMenuLabel>
            <div className="flex flex-col">
              <span className="font-medium">Mon compte</span>
              <span className="text-xs text-muted-foreground truncate">
                {user?.email}
              </span>
              {companyRole && (
                <Badge variant="secondary" className="mt-1 w-fit text-xs">
                  {roleLabels[companyRole] || companyRole}
                </Badge>
              )}
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          {/* Company Info */}
          {companyMembership?.company && (
            <>
              <DropdownMenuLabel className="py-1">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Building2 className="h-3 w-3" />
                  {companyMembership.company.name}
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
            </>
          )}

          {/* Admin Submenu */}
          {isAdmin && (
            <>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger className="cursor-pointer">
                  <Shield className="mr-2 h-4 w-4" />
                  Administration
                </DropdownMenuSubTrigger>
                <DropdownMenuPortal>
                  <DropdownMenuSubContent className="bg-popover border border-border shadow-lg z-50">
                    <DropdownMenuItem asChild>
                      <Link to="/team" className="cursor-pointer">
                        <Users className="mr-2 h-4 w-4" />
                        Gestion équipe
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/settings" className="cursor-pointer">
                        <Building2 className="mr-2 h-4 w-4" />
                        Paramètres entreprise
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuPortal>
              </DropdownMenuSub>
              <DropdownMenuSeparator />
            </>
          )}

          {/* Platform Owner Menu */}
          {isPlatformOwner && (
            <>
              <DropdownMenuItem asChild>
                <Link to="/admin" className="cursor-pointer text-primary">
                  <Shield className="mr-2 h-4 w-4" />
                  Admin Plateforme
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}

          <DropdownMenuItem asChild>
            <Link to="/settings" className="cursor-pointer">
              <Settings className="mr-2 h-4 w-4" />
              Paramètres
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem 
            onClick={handleSignOut}
            className="cursor-pointer focus:bg-muted text-destructive focus:text-destructive"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Déconnexion
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
