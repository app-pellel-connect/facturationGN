import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle, FileText, LogOut, Mail } from 'lucide-react';

export default function CompanySuspended() {
  const navigate = useNavigate();
  const { companyMembership, signOut } = useAuth();
  
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

        <Card className="glass animate-slide-up border-warning/30">
          <CardContent className="pt-6 text-center space-y-4">
            <div className="mx-auto p-4 rounded-full bg-warning/10 w-fit">
              <AlertTriangle className="h-10 w-10 text-warning" />
            </div>
            
            <div className="space-y-2">
              <h2 className="text-xl font-semibold">Compte suspendu</h2>
              <p className="text-muted-foreground">
                L'accès à{' '}
                <span className="font-semibold text-foreground">
                  {companyMembership?.company?.name || 'votre entreprise'}
                </span>{' '}
                a été temporairement suspendu.
              </p>
            </div>

            <div className="bg-warning/5 rounded-lg p-4 text-sm text-left space-y-2">
              <div className="flex items-start gap-2">
                <Mail className="h-4 w-4 mt-0.5 text-warning shrink-0" />
                <p className="text-muted-foreground">
                  Contactez l'administrateur de la plateforme pour résoudre cette situation et réactiver votre compte.
                </p>
              </div>
            </div>

            <div className="pt-4">
              <Button onClick={handleSignOut} variant="outline" className="w-full gap-2">
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
