import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { usePayments, Payment } from '@/hooks/usePayments';
import { formatGNF } from '@/lib/formatCurrency';
import { Loader2 } from 'lucide-react';

interface PaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoiceId: string;
  invoiceTotal: number;
  invoiceBalance: number;
  onSuccess?: () => void;
}

export function PaymentDialog({
  open,
  onOpenChange,
  invoiceId,
  invoiceTotal,
  invoiceBalance,
  onSuccess,
}: PaymentDialogProps) {
  const { createPayment } = usePayments();
  const [amount, setAmount] = useState('');
  const [paymentType, setPaymentType] = useState<Payment['payment_type']>('partial');
  const [paymentMethod, setPaymentMethod] = useState<Payment['payment_method']>('cash');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) return;

    await createPayment.mutateAsync({
      invoice_id: invoiceId,
      amount: numAmount,
      payment_type: paymentType,
      payment_method: paymentMethod,
      reference: reference || undefined,
      notes: notes || undefined,
    });

    // Reset form
    setAmount('');
    setPaymentType('partial');
    setPaymentMethod('cash');
    setReference('');
    setNotes('');
    onOpenChange(false);
    onSuccess?.();
  };

  const setQuickAmount = (type: 'deposit' | 'balance' | 'full') => {
    switch (type) {
      case 'deposit':
        // 30% deposit
        setAmount(Math.round(invoiceTotal * 0.3).toString());
        setPaymentType('deposit');
        break;
      case 'balance':
        setAmount(Math.round(invoiceBalance).toString());
        setPaymentType('balance');
        break;
      case 'full':
        setAmount(Math.round(invoiceTotal).toString());
        setPaymentType('full');
        break;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Enregistrer un paiement</DialogTitle>
          <DialogDescription>
            Solde restant: <span className="font-semibold text-foreground">{formatGNF(invoiceBalance)}</span>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Quick amount buttons */}
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setQuickAmount('deposit')}
              className="flex-1"
            >
              Acompte 30%
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setQuickAmount('balance')}
              className="flex-1"
            >
              Solde
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setQuickAmount('full')}
              className="flex-1"
            >
              Total
            </Button>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Montant (GNF)</Label>
            <Input
              id="amount"
              type="number"
              placeholder="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              min={1}
              className="text-lg font-semibold"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Type de paiement</Label>
              <Select value={paymentType} onValueChange={(v) => setPaymentType(v as Payment['payment_type'])}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="deposit">Acompte</SelectItem>
                  <SelectItem value="partial">Paiement partiel</SelectItem>
                  <SelectItem value="balance">Solde</SelectItem>
                  <SelectItem value="full">Paiement intégral</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Mode de paiement</Label>
              <Select value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as Payment['payment_method'])}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Espèces</SelectItem>
                  <SelectItem value="mobile_money">Mobile Money</SelectItem>
                  <SelectItem value="bank_transfer">Virement</SelectItem>
                  <SelectItem value="check">Chèque</SelectItem>
                  <SelectItem value="other">Autre</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reference">Référence (optionnel)</Label>
            <Input
              id="reference"
              placeholder="N° transaction, chèque..."
              value={reference}
              onChange={(e) => setReference(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optionnel)</Label>
            <Textarea
              id="notes"
              placeholder="Observations..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={createPayment.isPending}>
              {createPayment.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Enregistrer
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
