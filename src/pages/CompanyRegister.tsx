import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { companiesApi } from '@/lib/api/companies';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Loader2, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';

const companySchema = z.object({
  name: z.string().min(2, 'Nom de l\'entreprise requis'),
  phone: z.string().min(9, 'Téléphone requis'),
  address: z.string().min(2, 'Adresse requise'),
  city: z.string().min(2, 'Ville requise'),
});

export default function CompanyRegister() {
  const navigate = useNavigate();
  const { user, refreshProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    phone: '',
    address: '',
    city: 'Conakry',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const result = companySchema.safeParse(form);
    if (!result.success) {
      toast.error(result.error.errors[0].message);
      return;
    }

    if (!user?.id) {
      toast.error('Vous devez être connecté');
      return;
    }

    setLoading(true);
    try {
      // Créer l'entreprise via l'API
      await companiesApi.create({
        name: form.name,
        email: user.email,
        phone: form.phone,
        address: form.address,
        city: form.city,
        country: 'Guinée',
      });

      toast.success('Entreprise enregistrée ! En attente d\'approbation.');
      
      // Refresh profile to get new company membership
      await refreshProfile();
      
      navigate('/');
    } catch (error: any) {
      console.error('Error creating company:', error);
      toast.error('Erreur lors de l\'enregistrement: ' + (error.message || 'Erreur inconnue'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background">
      <div className="w-full max-w-lg space-y-6">
        {/* Logo */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl gradient-primary shadow-glow">
            <FileText className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-gradient">FactureGN</h1>
          <p className="text-muted-foreground">Enregistrez votre entreprise</p>
        </div>

        <Card className="glass animate-slide-up">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto p-3 rounded-full bg-primary/10 w-fit mb-2">
              <Building2 className="h-6 w-6 text-primary" />
            </div>
            <CardTitle>Nouvelle entreprise</CardTitle>
            <CardDescription>
              Remplissez les informations de votre entreprise pour commencer
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nom de l'entreprise *</Label>
                <Input
                  id="name"
                  placeholder="Ma Société SARL"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Téléphone *</Label>
                <Input
                  id="phone"
                  placeholder="+224 6XX XX XX XX"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Adresse *</Label>
                <Input
                  id="address"
                  placeholder="Quartier, Rue..."
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="city">Ville *</Label>
                <Input
                  id="city"
                  placeholder="Conakry"
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  required
                />
              </div>

              <div className="pt-4 space-y-3">
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Enregistrement...
                    </>
                  ) : (
                    <>
                      <Building2 className="h-4 w-4 mr-2" />
                      Enregistrer l'entreprise
                    </>
                  )}
                </Button>
                
                <p className="text-xs text-center text-muted-foreground">
                  Votre demande sera examinée par l'administrateur de la plateforme.
                  Vous recevrez une notification une fois approuvée.
                </p>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
