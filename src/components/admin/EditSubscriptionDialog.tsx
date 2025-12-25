import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

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

interface EditSubscriptionDialogProps {
  subscription: Subscription | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (subscriptionId: string, data: {
    plan_name: string;
    status: string;
    max_users: number;
    max_invoices_per_month: number;
    max_clients: number;
  }) => Promise<void>;
}

export function EditSubscriptionDialog({
  subscription,
  open,
  onOpenChange,
  onSave,
}: EditSubscriptionDialogProps) {
  const [planName, setPlanName] = useState(subscription?.plan_name || 'trial');
  const [status, setStatus] = useState(subscription?.status || 'trial');
  const [maxUsers, setMaxUsers] = useState(subscription?.max_users || 3);
  const [maxInvoices, setMaxInvoices] = useState(subscription?.max_invoices_per_month || 50);
  const [maxClients, setMaxClients] = useState(subscription?.max_clients || 20);
  const [saving, setSaving] = useState(false);

  // Reset values when subscription changes
  useState(() => {
    if (subscription) {
      setPlanName(subscription.plan_name);
      setStatus(subscription.status);
      setMaxUsers(subscription.max_users);
      setMaxInvoices(subscription.max_invoices_per_month);
      setMaxClients(subscription.max_clients);
    }
  });

  const handleSave = async () => {
    if (!subscription) return;
    setSaving(true);
    try {
      await onSave(subscription.id, {
        plan_name: planName,
        status,
        max_users: maxUsers,
        max_invoices_per_month: maxInvoices,
        max_clients: maxClients,
      });
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  if (!subscription) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Modifier l'abonnement</DialogTitle>
          <DialogDescription>
            {subscription.company?.name || 'Entreprise'}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="plan">Plan</Label>
            <Select value={planName} onValueChange={setPlanName}>
              <SelectTrigger id="plan">
                <SelectValue placeholder="Sélectionner un plan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="trial">Essai</SelectItem>
                <SelectItem value="starter">Starter</SelectItem>
                <SelectItem value="pro">Pro</SelectItem>
                <SelectItem value="enterprise">Enterprise</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="status">Statut</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger id="status">
                <SelectValue placeholder="Sélectionner un statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="trial">Essai</SelectItem>
                <SelectItem value="active">Actif</SelectItem>
                <SelectItem value="expired">Expiré</SelectItem>
                <SelectItem value="cancelled">Annulé</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="maxUsers">Nombre max d'utilisateurs</Label>
            <Input
              id="maxUsers"
              type="number"
              min={1}
              value={maxUsers}
              onChange={(e) => setMaxUsers(parseInt(e.target.value) || 1)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="maxInvoices">Factures max par mois</Label>
            <Input
              id="maxInvoices"
              type="number"
              min={1}
              value={maxInvoices}
              onChange={(e) => setMaxInvoices(parseInt(e.target.value) || 1)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="maxClients">Nombre max de clients</Label>
            <Input
              id="maxClients"
              type="number"
              min={1}
              value={maxClients}
              onChange={(e) => setMaxClients(parseInt(e.target.value) || 1)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Annuler
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enregistrement...
              </>
            ) : (
              'Enregistrer'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
