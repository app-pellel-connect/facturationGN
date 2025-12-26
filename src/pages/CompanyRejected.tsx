import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { XCircle, FileText, LogOut, RefreshCw } from 'lucide-react';

export default function CompanyRejected() {
  const navigate = useNavigate();
  const { companyMembership, signOut, refreshProfile } = useAuth();
  
  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background">
      <div className="w-full max-w-md space-y-6">
        {/* Logo */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl gradient-primary shadow-glow">
            <FileText className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-gradient">FactureGN</h1>
        </div>

        <Card className="glass animate-slide-up border-destructive/30">
          <CardContent className="pt-6 text-center space-y-4">
            <div className="mx-auto p-4 rounded-full bg-destructive/10 w-fit">
              <XCircle className="h-10 w-10 text-destructive" />
            </div>
            
            <div className="space-y-2">
              <h2 className="text-xl font-semibold">Demande refusée</h2>
              <p className="text-muted-foreground">
                Votre demande d'inscription pour{' '}
                <span className="font-semibold text-foreground">
                  {companyMembership?.company?.name || 'votre entreprise'}
                </span>{' '}
                n'a pas été approuvée.
              </p>
            </div>

            <div className="bg-destructive/5 rounded-lg p-4 text-sm text-left">
              <p className="text-muted-foreground">
                Contactez l'administrateur de la plateforme pour plus d'informations ou pour soumettre une nouvelle demande.
              </p>
            </div>

            <div className="pt-4 space-y-2">
              <Button onClick={() => refreshProfile()} variant="outline" className="w-full gap-2">
                <RefreshCw className="h-4 w-4" />
                Vérifier à nouveau
              </Button>
              <Button onClick={handleSignOut} variant="ghost" className="w-full gap-2 text-muted-foreground">
                <LogOut className="h-4 w-4" />
                Se déconnecter
              </Button>
            </div>
          </CardContent>
        </Card>

        <p className="text-xs text-center text-muted-foreground">
          Contact : support@pellel-connect.com
        </p>
      </div>
    </div>
  );
}
