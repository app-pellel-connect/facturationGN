import { useState, useEffect } from 'react';
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
import { Loader2 } from 'lucide-react';

interface Company {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  city: string | null;
  address: string | null;
  status: 'pending' | 'approved' | 'suspended' | 'rejected';
}

interface EditCompanyDialogProps {
  company: Company | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (companyId: string, data: {
    name: string;
    email: string;
    phone: string | null;
    city: string | null;
    address: string | null;
  }) => Promise<void>;
}

export function EditCompanyDialog({
  company,
  open,
  onOpenChange,
  onSave,
}: EditCompanyDialogProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (company) {
      setName(company.name);
      setEmail(company.email);
      setPhone(company.phone || '');
      setCity(company.city || '');
      setAddress(company.address || '');
    }
  }, [company]);

  const handleSave = async () => {
    if (!company) return;
    if (!name.trim() || !email.trim()) return;
    
    setSaving(true);
    try {
      await onSave(company.id, {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim() || null,
        city: city.trim() || null,
        address: address.trim() || null,
      });
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  if (!company) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Modifier l'entreprise</DialogTitle>
          <DialogDescription>
            Modifiez les informations de l'entreprise
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Nom *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nom de l'entreprise"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@entreprise.com"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="phone">Téléphone</Label>
            <Input
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+224 XXX XXX XXX"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="city">Ville</Label>
            <Input
              id="city"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Conakry"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="address">Adresse</Label>
            <Input
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Adresse complète"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Annuler
          </Button>
          <Button onClick={handleSave} disabled={saving || !name.trim() || !email.trim()}>
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
