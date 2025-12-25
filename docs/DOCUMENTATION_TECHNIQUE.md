# Documentation Technique - FactureGN v2.0.0

> Plateforme de facturation multi-entreprises pour la Guinée  
> Développé par **Pellel-Connect**

---

## Table des matières

1. [Architecture Générale](#architecture-générale)
2. [Stack Technique](#stack-technique)
3. [Structure du Projet](#structure-du-projet)
4. [Base de Données](#base-de-données)
5. [Authentification & Autorisation](#authentification--autorisation)
6. [Gestion des Rôles](#gestion-des-rôles)
7. [API & Hooks](#api--hooks)
8. [Composants Principaux](#composants-principaux)
9. [Flux de Travail](#flux-de-travail)
10. [Sécurité](#sécurité)
11. [Déploiement](#déploiement)

---

## Architecture Générale

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │   React     │  │   Vite      │  │   TailwindCSS + shadcn  │  │
│  │   18.3.1    │  │   Build     │  │   UI Components         │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      LOVABLE CLOUD                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │  Supabase   │  │    Auth     │  │    Edge Functions       │  │
│  │  PostgreSQL │  │   Service   │  │    (Deno Runtime)       │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Stack Technique

### Frontend
| Technologie | Version | Description |
|-------------|---------|-------------|
| React | 18.3.1 | Framework UI |
| TypeScript | 5.x | Typage statique |
| Vite | 5.x | Bundler & Dev Server |
| TailwindCSS | 3.x | Framework CSS utilitaire |
| shadcn/ui | latest | Composants UI |
| React Query | 5.83.0 | Gestion état serveur |
| React Router | 6.30.1 | Routage |
| React Hook Form | 7.61.1 | Gestion formulaires |
| Zod | 3.25.76 | Validation schemas |

### Backend (Lovable Cloud / Supabase)
| Service | Description |
|---------|-------------|
| PostgreSQL | Base de données relationnelle |
| Auth | Authentification utilisateurs |
| RLS | Row Level Security |
| Edge Functions | Fonctions serverless Deno |
| Realtime | Subscriptions temps réel |

---

## Structure du Projet

```
src/
├── components/
│   ├── admin/                    # Composants administration
│   │   ├── DeleteCompanyDialog.tsx
│   │   ├── EditCompanyDialog.tsx
│   │   └── EditSubscriptionDialog.tsx
│   ├── invoice/                  # Composants facturation
│   │   └── PaymentDialog.tsx
│   ├── landing/                  # Page d'accueil
│   │   └── LandingPage.tsx
│   ├── layout/                   # Layout global
│   │   ├── AppLayout.tsx
│   │   ├── HeaderActions.tsx
│   │   └── MobileNav.tsx
│   ├── notifications/            # Notifications
│   │   └── OverdueNotification.tsx
│   ├── settings/                 # Paramètres
│   │   └── TeamManagement.tsx
│   └── ui/                       # Composants shadcn/ui
│
├── hooks/                        # Hooks personnalisés
│   ├── useAuth.tsx              # Authentification
│   ├── useClients.ts            # CRUD Clients
│   ├── useInvoices.ts           # CRUD Factures
│   ├── usePayments.ts           # CRUD Paiements
│   └── use-mobile.tsx           # Détection mobile
│
├── integrations/
│   └── supabase/
│       ├── client.ts            # Client Supabase
│       └── types.ts             # Types auto-générés
│
├── lib/                          # Utilitaires
│   ├── formatCurrency.ts        # Formatage monétaire
│   ├── generateReceipt.ts       # Génération reçus PDF
│   ├── seedDemoData.ts          # Données de test
│   └── utils.ts                 # Fonctions utilitaires
│
├── pages/                        # Pages/Routes
│   ├── admin/
│   │   └── AdminDashboard.tsx   # Dashboard admin plateforme
│   ├── Auth.tsx                 # Connexion/Inscription
│   ├── ClientForm.tsx           # Formulaire client
│   ├── Clients.tsx              # Liste clients
│   ├── CompanyRegister.tsx      # Inscription entreprise
│   ├── CompanyRejected.tsx      # Entreprise rejetée
│   ├── CompanySuspended.tsx     # Entreprise suspendue
│   ├── Dashboard.tsx            # Tableau de bord
│   ├── Index.tsx                # Point d'entrée
│   ├── InvoiceDetail.tsx        # Détail facture
│   ├── InvoiceForm.tsx          # Formulaire facture
│   ├── Invoices.tsx             # Liste factures
│   ├── NotFound.tsx             # Page 404
│   ├── PendingApproval.tsx      # En attente d'approbation
│   └── Settings.tsx             # Paramètres
│
└── supabase/
    ├── config.toml              # Configuration Supabase
    └── functions/               # Edge Functions
```

---

## Base de Données

### Schéma des Tables

```sql
-- PROFILS UTILISATEURS
profiles (
    id UUID PRIMARY KEY,          -- Référence auth.users
    email TEXT NOT NULL,
    full_name TEXT,
    phone TEXT,
    avatar_url TEXT,
    is_platform_owner BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
)

-- ENTREPRISES
companies (
    id UUID PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    address TEXT,
    city TEXT,
    postal_code TEXT,
    country TEXT DEFAULT 'Guinée',
    siret TEXT,
    logo_url TEXT,
    currency TEXT DEFAULT 'GNF',
    tax_rate NUMERIC DEFAULT 18,
    status company_status DEFAULT 'pending',
    rejection_reason TEXT,
    approved_at TIMESTAMPTZ,
    approved_by UUID REFERENCES profiles,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
)

-- MEMBRES D'ENTREPRISE (Rôles)
company_members (
    id UUID PRIMARY KEY,
    company_id UUID REFERENCES companies NOT NULL,
    user_id UUID REFERENCES profiles NOT NULL,
    role platform_role DEFAULT 'company_user',
    is_active BOOLEAN DEFAULT true,
    invited_by UUID REFERENCES profiles,
    joined_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ
)

-- ABONNEMENTS
subscriptions (
    id UUID PRIMARY KEY,
    company_id UUID REFERENCES companies NOT NULL,
    plan_name TEXT DEFAULT 'trial',
    status subscription_status DEFAULT 'trial',
    max_users INTEGER DEFAULT 3,
    max_invoices_per_month INTEGER DEFAULT 50,
    max_clients INTEGER DEFAULT 20,
    started_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
)

-- CLIENTS
clients (
    id UUID PRIMARY KEY,
    company_id UUID REFERENCES companies NOT NULL,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    address TEXT,
    city TEXT,
    postal_code TEXT,
    country TEXT DEFAULT 'Guinée',
    siret TEXT,
    created_by UUID REFERENCES profiles,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
)

-- FACTURES
invoices (
    id UUID PRIMARY KEY,
    company_id UUID REFERENCES companies NOT NULL,
    client_id UUID REFERENCES clients,
    invoice_number TEXT NOT NULL,
    issue_date DATE DEFAULT CURRENT_DATE,
    due_date DATE,
    status TEXT DEFAULT 'draft',
    subtotal NUMERIC DEFAULT 0,
    tax_rate NUMERIC DEFAULT 18,
    tax_amount NUMERIC DEFAULT 0,
    total NUMERIC DEFAULT 0,
    paid_amount NUMERIC DEFAULT 0,
    balance NUMERIC,
    notes TEXT,
    created_by UUID REFERENCES profiles,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
)

-- LIGNES DE FACTURE
invoice_items (
    id UUID PRIMARY KEY,
    invoice_id UUID REFERENCES invoices NOT NULL,
    description TEXT NOT NULL,
    quantity NUMERIC DEFAULT 1,
    unit_price NUMERIC NOT NULL,
    total NUMERIC NOT NULL,
    created_at TIMESTAMPTZ
)

-- PAIEMENTS
payments (
    id UUID PRIMARY KEY,
    invoice_id UUID REFERENCES invoices NOT NULL,
    amount NUMERIC NOT NULL,
    payment_method TEXT DEFAULT 'cash',
    payment_type TEXT DEFAULT 'partial',
    reference TEXT,
    notes TEXT,
    paid_at TIMESTAMPTZ,
    recorded_by UUID REFERENCES profiles,
    created_at TIMESTAMPTZ
)

-- JOURNAUX D'AUDIT
audit_logs (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES profiles,
    company_id UUID REFERENCES companies,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ
)
```

### Types Énumérés

```sql
-- Statut de l'entreprise
CREATE TYPE company_status AS ENUM (
    'pending',    -- En attente d'approbation
    'approved',   -- Approuvée
    'suspended',  -- Suspendue
    'rejected'    -- Rejetée
);

-- Rôles de la plateforme
CREATE TYPE platform_role AS ENUM (
    'platform_owner',   -- Propriétaire de la plateforme
    'company_admin',    -- Administrateur d'entreprise
    'company_manager',  -- Gestionnaire
    'company_user'      -- Utilisateur simple
);

-- Statut d'abonnement
CREATE TYPE subscription_status AS ENUM (
    'trial',      -- Période d'essai
    'active',     -- Actif
    'expired',    -- Expiré
    'cancelled'   -- Annulé
);
```

### Fonctions PostgreSQL

```sql
-- Vérifier si utilisateur est propriétaire de la plateforme
is_platform_owner(_user_id UUID) RETURNS BOOLEAN

-- Obtenir l'entreprise de l'utilisateur
get_user_company(_user_id UUID) RETURNS UUID

-- Vérifier si utilisateur a un rôle spécifique
has_company_role(_user_id UUID, _company_id UUID, _roles platform_role[]) RETURNS BOOLEAN

-- Enregistrer une nouvelle entreprise
register_company(p_user_id UUID, p_name TEXT, p_phone TEXT, p_address TEXT, p_city TEXT) RETURNS UUID
```

---

## Authentification & Autorisation

### Flux d'Authentification

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Signup    │────▶│   Trigger   │────▶│   Profile   │
│   Auth      │     │   Create    │     │   Created   │
└─────────────┘     └─────────────┘     └─────────────┘
                           │
                           ▼
                    ┌─────────────┐
                    │ First User  │
                    │ = Platform  │
                    │   Owner     │
                    └─────────────┘
```

### Hook useAuth

```typescript
const {
  user,              // Utilisateur Supabase
  profile,           // Profil public
  loading,           // État chargement
  isPlatformOwner,   // Est propriétaire plateforme
  companyMembership, // Appartenance entreprise
  companyId,         // ID entreprise courante
  companyRole,       // Rôle dans l'entreprise
  isCompanyApproved, // Entreprise approuvée
  hasCompanyRole,    // Vérifie un rôle
  canManageCompany,  // Peut gérer l'entreprise
  signIn,            // Connexion
  signUp,            // Inscription
  signOut,           // Déconnexion
  refreshProfile,    // Rafraîchir profil
} = useAuth();
```

---

## Gestion des Rôles

### Matrice des Permissions

| Action | platform_owner | company_admin | company_manager | company_user |
|--------|:--------------:|:-------------:|:---------------:|:------------:|
| Voir dashboard admin | ✅ | ❌ | ❌ | ❌ |
| Approuver entreprises | ✅ | ❌ | ❌ | ❌ |
| Gérer abonnements | ✅ | ❌ | ❌ | ❌ |
| Gérer équipe | ❌ | ✅ | ❌ | ❌ |
| Créer clients | ❌ | ✅ | ✅ | ❌ |
| Créer factures | ❌ | ✅ | ✅ | ❌ |
| Voir clients | ❌ | ✅ | ✅ | ✅ |
| Voir factures | ❌ | ✅ | ✅ | ✅ |
| Enregistrer paiements | ❌ | ✅ | ✅ | ❌ |

### Politiques RLS (Row Level Security)

```sql
-- Les membres peuvent voir les clients de leur entreprise
CREATE POLICY "Company members can view clients" ON clients
FOR SELECT USING (company_id = get_user_company(auth.uid()));

-- Admin/Manager peuvent gérer les clients
CREATE POLICY "Company admin/manager can manage clients" ON clients
FOR ALL USING (
  has_company_role(auth.uid(), company_id, 
    ARRAY['company_admin', 'company_manager'])
);
```

---

## API & Hooks

### useClients

```typescript
const {
  clients,          // Liste des clients
  isLoading,        // État chargement
  createClient,     // Mutation création
  updateClient,     // Mutation mise à jour
  deleteClient,     // Mutation suppression
} = useClients();

// Créer un client
createClient.mutate({
  name: 'Entreprise ABC',
  email: 'contact@abc.com',
  phone: '+224 621 00 00 00',
  address: 'Rue principale',
  city: 'Conakry',
});
```

### useInvoices

```typescript
const {
  invoices,              // Liste des factures
  isLoading,             // État chargement
  createInvoice,         // Mutation création
  updateInvoiceStatus,   // Mutation statut
  deleteInvoice,         // Mutation suppression
  generateInvoiceNumber, // Générer numéro
} = useInvoices();

// Créer une facture
createInvoice.mutate({
  client_id: 'uuid-client',
  due_date: '2025-01-31',
  tax_rate: 18,
  items: [
    { description: 'Service', quantity: 1, unit_price: 100000 }
  ],
});
```

### usePayments

```typescript
const {
  payments,          // Liste des paiements
  isLoading,         // État chargement
  createPayment,     // Mutation création
  deletePayment,     // Mutation suppression
  paymentTypeLabels, // Labels types
  paymentMethodLabels, // Labels méthodes
} = usePayments(invoiceId);

// Enregistrer un paiement
createPayment.mutate({
  invoice_id: 'uuid-facture',
  amount: 50000,
  payment_method: 'mobile_money',
  payment_type: 'partial',
});
```

---

## Composants Principaux

### AppLayout

Layout principal de l'application avec navigation et header.

```tsx
<AppLayout title="Tableau de bord">
  {/* Contenu de la page */}
</AppLayout>
```

### TeamManagement

Gestion des membres d'équipe (pour company_admin).

```tsx
<TeamManagement 
  companyId={companyId} 
  currentUserId={user.id} 
/>
```

**Fonctionnalités :**
- Lister les membres
- Inviter un nouveau membre
- Modifier le rôle d'un membre
- Activer/Désactiver un membre

### PaymentDialog

Dialog pour enregistrer un paiement sur une facture.

```tsx
<PaymentDialog
  open={open}
  onOpenChange={setOpen}
  invoice={invoice}
  onSuccess={handleSuccess}
/>
```

---

## Flux de Travail

### Inscription Entreprise

```
1. Utilisateur s'inscrit (Auth)
   ↓
2. Trigger crée le profil
   ↓
3. Utilisateur enregistre son entreprise
   ↓
4. Fonction register_company() :
   - Crée l'entreprise (status: pending)
   - Ajoute l'utilisateur comme company_admin
   - Crée l'abonnement trial
   ↓
5. Propriétaire plateforme approuve
   ↓
6. Entreprise peut utiliser l'application
```

### Création Facture

```
1. Sélectionner un client
   ↓
2. Ajouter des lignes
   ↓
3. Définir les dates et taxes
   ↓
4. Enregistrer (status: draft)
   ↓
5. Envoyer au client (status: sent)
   ↓
6. Enregistrer paiements
   ↓
7. Facture payée (status: paid)
```

---

## Sécurité

### Principes Appliqués

1. **Row Level Security (RLS)** : Toutes les tables ont RLS activé
2. **Security Definer Functions** : Fonctions avec privilèges élevés
3. **Séparation des rôles** : Rôles stockés dans `company_members`, pas dans `profiles`
4. **Validation serveur** : Jamais de validation côté client uniquement
5. **Audit Logs** : Journalisation des actions critiques

### Bonnes Pratiques

```typescript
// ❌ MAUVAIS : Vérification côté client
if (localStorage.getItem('isAdmin')) { ... }

// ✅ BON : Vérification via hook authentifié
const { isPlatformOwner, companyRole } = useAuth();
if (isPlatformOwner || companyRole === 'company_admin') { ... }
```

---

## Déploiement

### Variables d'Environnement

```env
VITE_SUPABASE_URL=https://[project-id].supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=[anon-key]
VITE_SUPABASE_PROJECT_ID=[project-id]
```

### Build Production

```bash
npm run build
```

### Déploiement Lovable

1. Cliquer sur "Publish" dans l'interface Lovable
2. Les changements frontend nécessitent "Update"
3. Les Edge Functions et migrations se déploient automatiquement

---

## Support

**Développé par Pellel-Connect**

Pour toute question technique, consulter :
- [Guide d'inscription](./GUIDE_INSCRIPTION.md)
- [README](../README.md)

---

*Documentation mise à jour : Décembre 2025*
