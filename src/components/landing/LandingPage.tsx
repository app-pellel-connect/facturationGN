import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { FileText, Users, Banknote, Shield, ArrowRight, Smartphone, Wifi, Globe } from 'lucide-react';

const features = [
  {
    icon: FileText,
    title: 'Gestion des factures',
    description: 'Créez et gérez vos factures professionnelles',
  },
  {
    icon: Users,
    title: 'Gestion des clients',
    description: 'Centralisez les informations de vos clients',
  },
  {
    icon: Banknote,
    title: 'Suivi des paiements',
    description: 'Acomptes, paiements partiels et soldes',
  },
  {
    icon: Smartphone,
    title: 'Mobile first',
    description: 'Optimisé pour une utilisation sur téléphone',
  },
  {
    icon: Wifi,
    title: 'Connexion faible',
    description: 'Fonctionne même avec une connexion limitée',
  },
  {
    icon: Shield,
    title: 'Sécurisé',
    description: 'Vos données sont protégées et sécurisées',
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b border-border/50 safe-area-top">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg gradient-primary flex items-center justify-center">
              <FileText className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg">FactureGN</span>
          </div>
          <Link to="/auth">
            <Button size="sm">Connexion</Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-12 text-center">
        <div className="max-w-md mx-auto space-y-4">
          {/* Guinea badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted text-sm">
            <Globe className="h-3.5 w-3.5" />
            <span>Conçu pour la Guinée</span>
          </div>
          
          <h1 className="text-3xl font-bold tracking-tight">
            Gérez vos factures{' '}
            <span className="text-primary">simplement</span>
          </h1>
          <p className="text-muted-foreground">
            L'application de facturation moderne, adaptée aux entreprises guinéennes. 
            Fonctionne même avec une connexion internet limitée.
          </p>
          <div className="flex flex-col gap-2 pt-2">
            <Link to="/auth">
              <Button size="lg" className="w-full gap-2">
                Commencer gratuitement
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-2 gap-3">
          {features.map((feature) => (
            <Card key={feature.title} className="glass border-border/50">
              <CardContent className="p-4">
                <div className="flex flex-col gap-2">
                  <div className="p-2 rounded-lg bg-primary/10 w-fit">
                    <feature.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">{feature.title}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-8">
        <Card className="gradient-primary text-primary-foreground overflow-hidden">
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-bold mb-2">
              Prêt à simplifier votre facturation ?
            </h2>
            <p className="text-primary-foreground/80 text-sm mb-4">
              Rejoignez les entreprises guinéennes qui font confiance à FactureGN
            </p>
            <Link to="/auth">
              <Button variant="secondary" size="lg" className="gap-2">
                Créer mon compte
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-6 safe-area-bottom">
        <div className="container mx-auto px-4 text-center text-xs text-muted-foreground">
          <p>© 2025 FactureGN - Une solution <span className="font-semibold text-primary">Pellel-Connect</span></p>
          <p className="mt-1">Monnaie: Franc Guinéen (GNF)</p>
        </div>
      </footer>
    </div>
  );
}
