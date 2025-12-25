import { useState } from 'react';
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
import { Loader2 } from 'lucide-react';

interface Company {
  id: string;
  name: string;
}

interface DeleteCompanyDialogProps {
  company: Company | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (companyId: string) => Promise<void>;
}

export function DeleteCompanyDialog({
  company,
  open,
  onOpenChange,
  onConfirm,
}: DeleteCompanyDialogProps) {
  const [deleting, setDeleting] = useState(false);

  const handleConfirm = async () => {
    if (!company) return;
    setDeleting(true);
    try {
      await onConfirm(company.id);
      onOpenChange(false);
    } finally {
      setDeleting(false);
    }
  };

  if (!company) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Supprimer l'entreprise ?</AlertDialogTitle>
          <AlertDialogDescription>
            Êtes-vous sûr de vouloir supprimer <strong>{company.name}</strong> ? 
            Cette action est irréversible et supprimera toutes les données associées 
            (membres, abonnement, etc.).
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleting}>Annuler</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={deleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {deleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Suppression...
              </>
            ) : (
              'Supprimer'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
