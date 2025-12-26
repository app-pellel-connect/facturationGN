import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Clock, FileText, Mail, RefreshCw, LogOut, Phone, MessageSquare } from 'lucide-react';

export default function PendingApproval() {
  const navigate = useNavigate();
  const { companyMembership, signOut, refreshProfile } = useAuth();
  
  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const handleRefresh = async () => {
    await refreshProfile();
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

        <Card className="glass animate-slide-up">
          <CardContent className="pt-6 text-center space-y-4">
            <div className="mx-auto p-4 rounded-full bg-warning/10 w-fit">
              <Clock className="h-10 w-10 text-warning animate-pulse" />
            </div>
            
            <div className="space-y-2">
              <h2 className="text-xl font-semibold">En attente d'approbation</h2>
              <p className="text-muted-foreground">
                Votre demande d'inscription pour{' '}
                <span className="font-semibold text-foreground">
                  {companyMembership?.company?.name || 'votre entreprise'}
                </span>{' '}
                est en cours d'examen.
              </p>
            </div>

            <div className="bg-muted/50 rounded-lg p-4 text-sm text-left space-y-3">
              <p className="text-muted-foreground">
                Vous serez notifié dès que votre entreprise sera approuvée. En attendant, vous pouvez nous contacter :
              </p>
              <div className="flex flex-col gap-2">
                <a 
                  href="tel:+224620000000" 
                  className="flex items-center gap-2 text-primary hover:underline"
                >
                  <Phone className="h-4 w-4 shrink-0" />
                  <span>+224 620 00 00 00</span>
                </a>
                <a 
                  href="sms:+224620000000" 
                  className="flex items-center gap-2 text-primary hover:underline"
                >
                  <MessageSquare className="h-4 w-4 shrink-0" />
                  <span>Envoyer un SMS</span>
                </a>
                <a 
                  href="mailto:support@pellel-connect.com" 
                  className="flex items-center gap-2 text-primary hover:underline"
                >
                  <Mail className="h-4 w-4 shrink-0" />
                  <span>support@pellel-connect.com</span>
                </a>
              </div>
            </div>

            <div className="pt-4 space-y-2">
              <Button onClick={handleRefresh} variant="outline" className="w-full gap-2">
                <RefreshCw className="h-4 w-4" />
                Vérifier le statut
              </Button>
              <Button onClick={handleSignOut} variant="ghost" className="w-full gap-2 text-muted-foreground">
                <LogOut className="h-4 w-4" />
                Se déconnecter
              </Button>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
