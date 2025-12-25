# Documentation FactureGN - Guide d'inscription

## 📋 Table des matières

1. [Architecture des rôles](#architecture-des-rôles)
2. [Devenir Propriétaire de la plateforme](#devenir-propriétaire-de-la-plateforme)
3. [Inscrire une entreprise](#inscrire-une-entreprise)
4. [Gestion des collaborateurs](#gestion-des-collaborateurs)
5. [Identifiants de test](#identifiants-de-test)

---

## Architecture des rôles

FactureGN utilise un système de rôles hiérarchique :

```
┌─────────────────────────────────────────────────────────┐
│                  PROPRIÉTAIRE PLATEFORME                │
│  (Premier utilisateur inscrit - Pellel-Connect)         │
│  • Approuve/rejette les entreprises                     │
│  • Accès aux statistiques globales                      │
│  • Gestion des abonnements                              │
│  • Consultation des logs d'audit                        │
│  • Accès automatique au Dashboard Admin                 │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│                      ENTREPRISE                         │
│  (Doit être approuvée par le propriétaire)              │
├─────────────────────────────────────────────────────────┤
│  company_admin     │ Administrateur - Tous les droits   │
│  company_manager   │ Gestionnaire - Factures & clients  │
│  company_user      │ Utilisateur - Lecture seule        │
└─────────────────────────────────────────────────────────┘
```

### Flux de connexion automatique

Après connexion, l'utilisateur est automatiquement redirigé vers :

| Condition                                        | Redirection                            |
| ------------------------------------------------ | -------------------------------------- |
| Premier utilisateur (`is_platform_owner = true`) | Dashboard Admin                        |
| Utilisateur sans entreprise                      | Formulaire d'enregistrement entreprise |
| Entreprise en attente (`pending`)                | Écran d'attente d'approbation          |
| Entreprise rejetée (`rejected`)                  | Écran de refus                         |
| Entreprise suspendue (`suspended`)               | Écran de suspension                    |
| Entreprise approuvée (`approved`)                | Dashboard entreprise                   |

## Devenir Propriétaire de la plateforme

### Qui est le propriétaire ?

Le **premier utilisateur** à créer un compte sur FactureGN devient automatiquement le **propriétaire de la plateforme**. Ce rôle est unique et ne peut pas être transféré.

### Étapes pour le propriétaire

1. **Accéder à la page d'inscription**
   - URL : `/auth`
   - Cliquer sur l'onglet "Inscription"

2. **Remplir le formulaire**

   ```
   Nom complet    : [Votre nom]
   Email          : admin@pellel-connect.com (recommandé)
   Mot de passe   : [Minimum 6 caractères]
   Confirmation   : [Répéter le mot de passe]
   ```

3. **Valider l'inscription**
   - Le système détecte qu'il n'y a aucun utilisateur
   - Votre compte est créé avec `is_platform_owner = true`
   - Vous êtes redirigé vers le tableau de bord propriétaire

### Fonctionnalités du propriétaire

| Fonctionnalité        | Description                                       |
| --------------------- | ------------------------------------------------- |
| Gestion entreprises   | Approuver, suspendre ou rejeter les demandes      |
| Statistiques globales | Nombre d'entreprises, factures totales, revenus   |
| Gestion abonnements   | Définir les limites (utilisateurs, factures/mois) |
| Logs d'audit          | Historique de toutes les actions importantes      |

---

## Inscrire une entreprise

### Prérequis

- Le propriétaire de la plateforme doit déjà être inscrit
- Une adresse email valide pour l'administrateur de l'entreprise

### Étapes d'inscription

#### Étape 1 : Créer un compte utilisateur

1. Accéder à `/auth`
2. Cliquer sur l'onglet "Inscription"
3. Remplir le formulaire :
   ```
   Nom complet    : [Nom de l'administrateur]
   Email          : contact@monentreprise.gn
   Mot de passe   : [Minimum 6 caractères]
   Confirmation   : [Répéter le mot de passe]
   ```
4. Valider l'inscription

#### Étape 2 : Enregistrer l'entreprise

Après connexion, vous serez redirigé vers le formulaire d'enregistrement entreprise :

```
Informations entreprise
───────────────────────
Nom de l'entreprise    : [Obligatoire]
RCCM/SIRET             : [Optionnel]
Email professionnel    : [Obligatoire]
Téléphone              : [Optionnel]

Adresse
───────────────────────
Adresse                : [Rue, quartier]
Ville                  : [Ex: Conakry]
Code postal            : [Optionnel]
Pays                   : Guinée (par défaut)

Configuration
───────────────────────
Devise                 : GNF (par défaut)
Taux de TVA            : 18% (par défaut)
```

#### Étape 3 : Attendre l'approbation

- Votre entreprise est créée avec le statut `pending`
- Le propriétaire de la plateforme reçoit une notification
- Vous verrez un écran d'attente avec le message :

```
┌─────────────────────────────────────────────────┐
│        ⏳ En attente d'approbation              │
│                                                 │
│  Votre demande d'inscription pour              │
│  [Nom Entreprise] est en cours d'examen.       │
│                                                 │
│  Vous recevrez un email dès que votre          │
│  entreprise sera approuvée.                    │
└─────────────────────────────────────────────────┘
```

#### Étape 4 : Entreprise approuvée

Une fois approuvée par le propriétaire :

- Le statut passe à `approved`
- Un abonnement `trial` est créé (30 jours)
- Vous pouvez accéder à toutes les fonctionnalités

### Statuts possibles

| Statut      | Description                 |
| ----------- | --------------------------- |
| `pending`   | En attente d'approbation    |
| `approved`  | Approuvée - Accès complet   |
| `suspended` | Suspendue - Accès bloqué    |
| `rejected`  | Rejetée - Doit re-soumettre |

---

## Gestion des collaborateurs

### Qui peut ajouter des collaborateurs ?

Seul l'**Administrateur de l'entreprise** (`company_admin`) peut gérer les collaborateurs.

### Ajouter un collaborateur

1. Accéder aux **Paramètres** > **Équipe**
2. Cliquer sur "Inviter un collaborateur"
3. Remplir le formulaire :
   ```
   Email          : collaborateur@email.com
   Rôle           : [Gestionnaire / Utilisateur]
   ```
4. Le collaborateur reçoit un email d'invitation

### Permissions par rôle

| Action                | Admin | Gestionnaire | Utilisateur |
| --------------------- | :---: | :----------: | :---------: |
| Voir factures         |  ✅   |      ✅      |     ✅      |
| Créer factures        |  ✅   |      ✅      |     ❌      |
| Modifier factures     |  ✅   |      ✅      |     ❌      |
| Supprimer factures    |  ✅   |      ✅      |     ❌      |
| Gérer clients         |  ✅   |      ✅      |     ❌      |
| Enregistrer paiements |  ✅   |      ✅      |     ❌      |
| Gérer équipe          |  ✅   |      ❌      |     ❌      |
| Paramètres entreprise |  ✅   |      ❌      |     ❌      |

---

## Identifiants de test

Pour tester l'application en développement :

### Comptes de test

```javascript
// Utilisez ces identifiants pour vous inscrire
{ email: 'test@facture.gn',  password: 'Test1234!'  }
{ email: 'demo@facture.gn',  password: 'Demo1234!'  }
{ email: 'admin@facture.gn', password: 'Admin1234!' }
```

### Scénario de test recommandé

1. **Créer le compte propriétaire**
   - Inscrire `admin@facture.gn` en premier
   - Ce compte devient propriétaire de la plateforme

2. **Créer une entreprise**
   - Inscrire `test@facture.gn`
   - Enregistrer une entreprise de test
   - Se connecter avec `admin@facture.gn`
   - Approuver l'entreprise

3. **Générer des données de test**
   - Se connecter avec `test@facture.gn`
   - Aller dans Paramètres > Données de test
   - Cliquer sur "Générer" pour créer :
     - 50 clients
     - 500 factures
     - Paiements associés

---

## Support

Pour toute question ou problème :

- **Email** : support@pellel-connect.com
- **Documentation** : https://docs.facturegn.com

---

_Documentation FactureGN v2.0.0 - © 2025 Pellel-Connect_
