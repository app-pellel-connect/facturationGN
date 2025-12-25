import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useClients, ClientInput } from '@/hooks/useClients';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { z } from 'zod';
import { toast } from 'sonner';

const clientSchema = z.object({
  name: z.string().min(1, 'Nom requis').max(100),
  email: z.string().email('Email invalide').or(z.literal('')).nullable(),
  phone: z.string().max(20).nullable(),
  address: z.string().max(200).nullable(),
  city: z.string().max(100).nullable(),
  postal_code: z.string().max(10).nullable(),
  country: z.string().max(100).nullable(),
  siret: z.string().max(20).nullable(),
});

export default function ClientForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { clients, createClient, updateClient } = useClients();
  const isEdit = !!id;

  const [form, setForm] = useState<ClientInput>({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    postal_code: '',
    country: 'France',
    siret: '',
  });

  useEffect(() => {
    if (isEdit && clients.length > 0) {
      const client = clients.find(c => c.id === id);
      if (client) {
        setForm({
          name: client.name,
          email: client.email || '',
          phone: client.phone || '',
          address: client.address || '',
          city: client.city || '',
          postal_code: client.postal_code || '',
          country: client.country || 'France',
          siret: client.siret || '',
        });
      }
    }
  }, [isEdit, id, clients]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const result = clientSchema.safeParse(form);
    if (!result.success) {
      toast.error(result.error.errors[0].message);
      return;
    }

    const cleanedForm = {
      ...form,
      email: form.email || null,
      phone: form.phone || null,
      address: form.address || null,
      city: form.city || null,
      postal_code: form.postal_code || null,
      country: form.country || null,
      siret: form.siret || null,
    };

    if (isEdit) {
      await updateClient.mutateAsync({ id, ...cleanedForm });
    } else {
      await createClient.mutateAsync(cleanedForm);
    }
    navigate('/clients');
  };

  const isPending = createClient.isPending || updateClient.isPending;

  return (
    <AppLayout title={isEdit ? 'Modifier le client' : 'Nouveau client'}>
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/clients')} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Retour
        </Button>

        <Card className="glass">
          <CardContent className="p-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nom *</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Nom du client"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email || ''}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="email@exemple.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Téléphone</Label>
                <Input
                  id="phone"
                  value={form.phone || ''}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="+33 6 12 34 56 78"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="siret">SIRET</Label>
                <Input
                  id="siret"
                  value={form.siret || ''}
                  onChange={(e) => setForm({ ...form, siret: e.target.value })}
                  placeholder="123 456 789 00012"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Adresse</Label>
                <Input
                  id="address"
                  value={form.address || ''}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  placeholder="123 Rue de la Paix"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="postal_code">Code postal</Label>
                  <Input
                    id="postal_code"
                    value={form.postal_code || ''}
                    onChange={(e) => setForm({ ...form, postal_code: e.target.value })}
                    placeholder="75001"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">Ville</Label>
                  <Input
                    id="city"
                    value={form.city || ''}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    placeholder="Paris"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="country">Pays</Label>
                <Input
                  id="country"
                  value={form.country || ''}
                  onChange={(e) => setForm({ ...form, country: e.target.value })}
                  placeholder="France"
                />
              </div>

              <Button type="submit" className="w-full" disabled={isPending}>
                {isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                {isEdit ? 'Mettre à jour' : 'Créer le client'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
