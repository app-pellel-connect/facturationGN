import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useInvoices } from '@/hooks/useInvoices';
import { usePayments } from '@/hooks/usePayments';
import { useAuth } from '@/hooks/useAuth';
import { PaymentDialog } from '@/components/invoice/PaymentDialog';
import { formatGNF, formatDate, formatDateTime } from '@/lib/formatCurrency';
import { generateReceiptPDF, generateInvoicePDF, shareViaWhatsApp, generateInvoiceShareText } from '@/lib/generateReceipt';
import { 
  ArrowLeft, 
  Plus, 
  FileText, 
  Share2, 
  Download, 
  Loader2,
  CreditCard,
  Banknote,
  Smartphone,
  Building2,
  Receipt,
  Trash2,
} from 'lucide-react';
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

const statusConfig = {
  draft: { label: 'Brouillon', class: 'status-draft' },
  sent: { label: 'Envoyée', class: 'status-sent' },
  partial: { label: 'Paiement partiel', class: 'status-partial' },
  paid: { label: 'Payée', class: 'status-paid' },
  cancelled: { label: 'Annulée', class: 'status-cancelled' },
};

const paymentMethodIcons = {
  cash: Banknote,
  mobile_money: Smartphone,
  bank_transfer: Building2,
  check: CreditCard,
  other: Receipt,
};

export default function InvoiceDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { invoices, isLoading: invoicesLoading, deleteInvoice } = useInvoices();
  const { payments, isLoading: paymentsLoading, deletePayment, paymentTypeLabels, paymentMethodLabels } = usePayments(id);
  const { canManageCompany } = useAuth();
  
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [deleteInvoiceOpen, setDeleteInvoiceOpen] = useState(false);
  const [deletePaymentId, setDeletePaymentId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const invoice = invoices.find(inv => inv.id === id);
  const isLoading = invoicesLoading || paymentsLoading;

  if (isLoading) {
    return (
      <AppLayout title="Chargement...">
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  if (!invoice) {
    return (
      <AppLayout title="Facture introuvable">
        <Card className="glass">
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Cette facture n'existe pas.</p>
            <Button onClick={() => navigate('/invoices')} className="mt-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour aux factures
            </Button>
          </CardContent>
        </Card>
      </AppLayout>
    );
  }

  const status = statusConfig[invoice.status as keyof typeof statusConfig] || statusConfig.draft;
  const balance = invoice.balance ?? (Number(invoice.total) - Number(invoice.paid_amount || 0));
  const canPay = balance > 0 && invoice.status !== 'cancelled';

  const handleDownloadReceipt = async () => {
    setIsGenerating(true);
    try {
      const blob = await generateReceiptPDF({ invoice, payments });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `recu-${invoice.invoice_number}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadInvoice = async () => {
    setIsGenerating(true);
    try {
      const blob = await generateInvoicePDF({ invoice, payments });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `facture-${invoice.invoice_number}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleShareWhatsApp = () => {
    const text = generateInvoiceShareText(invoice);
    shareViaWhatsApp(text);
  };

  const handleDeleteInvoice = () => {
    deleteInvoice.mutate(invoice.id);
    navigate('/invoices');
  };

  const handleDeletePayment = () => {
    if (deletePaymentId) {
      deletePayment.mutate(deletePaymentId);
      setDeletePaymentId(null);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => navigate('/invoices')}>
            <ArrowLeft className="mr-1 h-4 w-4" />
            Retour
          </Button>
          <Badge className={status.class}>{status.label}</Badge>
        </div>

        {/* Invoice Summary */}
        <Card className="glass">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-xl">{invoice.invoice_number}</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  {invoice.clients?.name || 'Client non spécifié'}
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Date d'émission</p>
                <p className="font-medium">{formatDate(invoice.issue_date)}</p>
              </div>
              {invoice.due_date && (
                <div>
                  <p className="text-muted-foreground">Date d'échéance</p>
                  <p className="font-medium">{formatDate(invoice.due_date)}</p>
                </div>
              )}
            </div>

            <Separator />

            {/* Financial Summary */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Sous-total</span>
                <span>{formatGNF(invoice.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">TVA ({invoice.tax_rate}%)</span>
                <span>{formatGNF(invoice.tax_amount)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-semibold">
                <span>Total</span>
                <span className="text-lg">{formatGNF(invoice.total)}</span>
              </div>
              <div className="flex justify-between text-sm text-success">
                <span>Montant payé</span>
                <span>{formatGNF(invoice.paid_amount)}</span>
              </div>
              <div className="flex justify-between font-bold text-lg">
                <span>Solde restant</span>
                <span className={balance > 0 ? 'text-warning' : 'text-success'}>
                  {formatGNF(balance)}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-2 pt-2">
              {canPay && canManageCompany && (
                <Button onClick={() => setPaymentDialogOpen(true)} className="col-span-2">
                  <Plus className="mr-2 h-4 w-4" />
                  Enregistrer un paiement
                </Button>
              )}
              <Button variant="outline" onClick={handleDownloadInvoice} disabled={isGenerating}>
                <Download className="mr-2 h-4 w-4" />
                Facture PDF
              </Button>
              <Button variant="outline" onClick={handleShareWhatsApp}>
                <Share2 className="mr-2 h-4 w-4" />
                WhatsApp
              </Button>
              <Button variant="outline" onClick={handleDownloadReceipt} disabled={isGenerating}>
                <Receipt className="mr-2 h-4 w-4" />
                Reçu PDF
              </Button>
              {canManageCompany && (
                <Button 
                  variant="outline" 
                  onClick={() => setDeleteInvoiceOpen(true)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Supprimer
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Items */}
        {invoice.invoice_items && invoice.invoice_items.length > 0 && (
          <Card className="glass">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Articles</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {invoice.invoice_items.map((item) => (
                  <div key={item.id} className="p-4 flex justify-between">
                    <div>
                      <p className="font-medium">{item.description}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.quantity} × {formatGNF(item.unit_price)}
                      </p>
                    </div>
                    <p className="font-semibold">{formatGNF(item.total)}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Payment History */}
        <Card className="glass">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Historique des paiements</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {payments.length === 0 ? (
              <p className="p-4 text-sm text-muted-foreground text-center">
                Aucun paiement enregistré
              </p>
            ) : (
              <div className="divide-y divide-border">
                {payments.map((payment) => {
                  const Icon = paymentMethodIcons[payment.payment_method] || Receipt;
                  return (
                    <div key={payment.id} className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-success/10">
                          <Icon className="h-4 w-4 text-success" />
                        </div>
                        <div>
                          <p className="font-medium">{formatGNF(payment.amount)}</p>
                          <p className="text-xs text-muted-foreground">
                            {paymentTypeLabels[payment.payment_type]} • {paymentMethodLabels[payment.payment_method]}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDateTime(payment.paid_at)}
                          </p>
                        </div>
                      </div>
                      {canManageCompany && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeletePaymentId(payment.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Notes */}
        {invoice.notes && (
          <Card className="glass">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{invoice.notes}</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Payment Dialog */}
      <PaymentDialog
        open={paymentDialogOpen}
        onOpenChange={setPaymentDialogOpen}
        invoiceId={invoice.id}
        invoiceTotal={Number(invoice.total)}
        invoiceBalance={balance}
      />

      {/* Delete Invoice Dialog */}
      <AlertDialog open={deleteInvoiceOpen} onOpenChange={setDeleteInvoiceOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette facture ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. La facture et tous ses paiements seront définitivement supprimés.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteInvoice} className="bg-destructive text-destructive-foreground">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Payment Dialog */}
      <AlertDialog open={!!deletePaymentId} onOpenChange={() => setDeletePaymentId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce paiement ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Le montant payé sera recalculé.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeletePayment} className="bg-destructive text-destructive-foreground">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
