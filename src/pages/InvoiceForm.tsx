import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useInvoices, InvoiceInput } from '@/hooks/useInvoices';
import { useClients } from '@/hooks/useClients';
import { ArrowLeft, Plus, Trash2, Loader2 } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

interface InvoiceItemInput {
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}

export default function InvoiceForm() {
  const navigate = useNavigate();
  const { clients } = useClients();
  const { createInvoice, generateInvoiceNumber } = useInvoices();

  const [form, setForm] = useState({
    client_id: '',
    invoice_number: generateInvoiceNumber(),
    issue_date: new Date().toISOString().split('T')[0],
    due_date: '',
    notes: '',
  });

  const [items, setItems] = useState<InvoiceItemInput[]>([
    { description: '', quantity: 1, unit_price: 0, total: 0 }
  ]);

  const updateItem = (index: number, field: keyof InvoiceItemInput, value: string | number) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    
    // Recalculate total
    if (field === 'quantity' || field === 'unit_price') {
      newItems[index].total = Number(newItems[index].quantity) * Number(newItems[index].unit_price);
    }
    
    setItems(newItems);
  };

  const addItem = () => {
    setItems([...items, { description: '', quantity: 1, unit_price: 0, total: 0 }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const taxAmount = subtotal * 0.2;
  const total = subtotal + taxAmount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validItems = items.filter(item => item.description && item.total > 0);
    if (validItems.length === 0) {
      toast.error('Ajoutez au moins une ligne de facturation');
      return;
    }

    const invoiceData: InvoiceInput = {
      client_id: form.client_id || null,
      invoice_number: form.invoice_number,
      issue_date: form.issue_date,
      due_date: form.due_date || null,
      notes: form.notes || null,
      items: validItems,
    };

    await createInvoice.mutateAsync(invoiceData);
    navigate('/invoices');
  };

  return (
    <AppLayout title="Nouvelle facture">
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/invoices')} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Retour
        </Button>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Invoice Info */}
          <Card className="glass">
            <CardContent className="p-4 space-y-4">
              <div className="space-y-2">
                <Label>Numéro de facture</Label>
                <Input
                  value={form.invoice_number}
                  onChange={(e) => setForm({ ...form, invoice_number: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Client</Label>
                <Select
                  value={form.client_id}
                  onValueChange={(value) => setForm({ ...form, client_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Date d'émission</Label>
                  <Input
                    type="date"
                    value={form.issue_date}
                    onChange={(e) => setForm({ ...form, issue_date: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Date d'échéance</Label>
                  <Input
                    type="date"
                    value={form.due_date}
                    onChange={(e) => setForm({ ...form, due_date: e.target.value })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Items */}
          <Card className="glass">
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <Label>Lignes de facture</Label>
                <Button type="button" variant="outline" size="sm" onClick={addItem} className="gap-1">
                  <Plus className="h-3 w-3" />
                  Ajouter
                </Button>
              </div>

              {items.map((item, index) => (
                <div key={index} className="space-y-3 p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Ligne {index + 1}</span>
                    {items.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeItem(index)}
                        className="h-6 w-6 text-destructive"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>

                  <Input
                    placeholder="Description"
                    value={item.description}
                    onChange={(e) => updateItem(index, 'description', e.target.value)}
                  />

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <Label className="text-xs">Quantité</Label>
                      <Input
                        type="number"
                        min="1"
                        step="0.01"
                        value={item.quantity}
                        onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Prix unit.</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.unit_price}
                        onChange={(e) => updateItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Total</Label>
                      <Input value={item.total.toFixed(2) + '€'} readOnly className="bg-muted" />
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Totals */}
          <Card className="glass">
            <CardContent className="p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Sous-total HT</span>
                <span>{subtotal.toFixed(2)}€</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">TVA (20%)</span>
                <span>{taxAmount.toFixed(2)}€</span>
              </div>
              <div className="flex justify-between font-bold text-lg border-t pt-2">
                <span>Total TTC</span>
                <span className="text-primary">{total.toFixed(2)}€</span>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          <Card className="glass">
            <CardContent className="p-4">
              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  placeholder="Notes ou conditions particulières..."
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          <Button type="submit" className="w-full" disabled={createInvoice.isPending}>
            {createInvoice.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Créer la facture
          </Button>
        </form>
      </div>
    </AppLayout>
  );
}
