# Guide du Seed de Base de Données

Ce guide explique comment peupler la base de données avec des données de test pour FactureGN.

## 🎯 Vue d'ensemble

Le système de seed permet de créer rapidement des données de test pour le développement et les tests. Plusieurs scénarios sont disponibles selon vos besoins.

## 📋 Scénarios disponibles

### 1. Empty (Vide)

Scénario vide - ne crée aucune donnée.

```bash
npm run seed:empty
```

**Utilisation** : Pour tester avec une base de données vide.

### 2. Minimal (Minimal)

Crée les données essentielles pour démarrer rapidement.

```bash
npm run seed:minimal
```

**Contenu** :
- ✅ 2 utilisateurs (1 admin plateforme, 1 utilisateur)
- ✅ 1 entreprise approuvée
- ✅ Membres d'équipe associés

**Identifiants** :
- `admin@facture.gn` / `Admin1234!` (Admin plateforme)
- `demo@facture.gn` / `Demo1234!` (Utilisateur)

### 3. Standard (Standard) - Par défaut

Scénario équilibré avec plusieurs utilisateurs et entreprises.

```bash
npm run seed:standard
# ou simplement
npm run seed
```

**Contenu** :
- ✅ 3 utilisateurs
- ✅ 3 entreprises (2 approuvées, 1 en attente)
- ✅ Membres d'équipe associés

**Identifiants** :
- `admin@facture.gn` / `Admin1234!` (Admin plateforme)
- `manager@demo.gn` / `Manager1234!` (Gestionnaire)
- `user@demo.gn` / `User1234!` (Utilisateur)

### 4. Full (Complet)

Scénario avec beaucoup de données pour tester la performance.

```bash
npm run seed:full
```

**Contenu** :
- ✅ 11 utilisateurs (1 admin + 10 utilisateurs)
- ✅ 5 entreprises
- ✅ Membres d'équipe associés

**Identifiants** :
- `admin@facture.gn` / `Admin1234!` (Admin plateforme)
- `user1@demo.gn` à `user10@demo.gn` / `Demo1234!` (Utilisateurs)

## 🚀 Utilisation

### Seed simple

```bash
cd backend
npm run seed
```

### Seed avec scénario spécifique

```bash
npm run seed:minimal
npm run seed:standard
npm run seed:full
npm run seed:empty
```

### Migration + Seed en une commande

Pour exécuter les migrations puis le seed en une seule commande :

```bash
npm run migrate:seed              # Standard
npm run migrate:seed:minimal      # Minimal
npm run migrate:seed:standard     # Standard
npm run migrate:seed:full         # Full
```

## 📊 Données créées

### Utilisateurs

Chaque utilisateur créé contient :
- ✅ Profil dans la table `profiles`
- ✅ Credentials dans la table `users` (mot de passe hashé)
- ✅ Email, nom complet, téléphone optionnel
- ✅ Statut plateforme owner (pour le premier utilisateur)

### Entreprises

Chaque entreprise créée contient :
- ✅ Données de l'entreprise (nom, email, téléphone, adresse, ville)
- ✅ Statut (pending, approved, suspended, rejected)
- ✅ Abonnement par défaut (trial)
- ✅ Membre admin (le propriétaire de l'entreprise)

### Membres d'équipe

- ✅ Association entre utilisateurs et entreprises
- ✅ Rôle `company_admin` pour les propriétaires
- ✅ Statut actif par défaut

## 🔐 Sécurité

### Mots de passe

Les mots de passe sont hashés avec bcrypt (10 rounds) avant d'être stockés dans la base de données.

**Format des mots de passe de test** :
- Doivent respecter les règles de sécurité
- Sont identiques pour faciliter les tests
- **⚠️ Ne JAMAIS utiliser en production !**

### Données de test

Les données créées sont :
- ✅ Déterministes (mêmes données à chaque exécution)
- ✅ Sécurisées (mots de passe hashés)
- ✅ Cohérentes (relations entre tables respectées)

## 🔄 Réexécution

### Réexécuter le seed

Le seed utilise `ON CONFLICT` pour éviter les doublons :
- ✅ Peut être exécuté plusieurs fois
- ✅ Met à jour les données existantes si nécessaire
- ✅ Ne crée pas de doublons

### Réinitialiser avant de seed

Si vous voulez recommencer à zéro :

```bash
# Option 1: Réinitialiser les migrations (développement uniquement)
npm run migrate:reset
npm run migrate
npm run seed

# Option 2: Supprimer manuellement les données
# (via pgAdmin, psql, etc.)
```

## 🎨 Personnalisation

### Modifier un scénario

Éditez le fichier `backend/src/db/seed.ts` :

```typescript
const scenarios = {
  custom: {
    users: [
      {
        email: 'custom@example.com',
        password: 'Custom1234!',
        full_name: 'Utilisateur Personnalisé',
        phone: '+224 612 34 56 78',
        is_platform_owner: false,
      },
    ],
    companies: [
      {
        name: 'Ma Compagnie',
        email: 'contact@company.gn',
        phone: '+224 612 34 56 78',
        address: 'Mon Adresse',
        city: 'Conakry',
        country: 'Guinée',
        status: 'approved',
      },
    ],
  },
};
```

Puis exécutez :

```bash
npm run seed -- --scenario=custom
```

### Ajouter des données supplémentaires

Pour ajouter des clients, factures, paiements, etc., vous pouvez :

1. Étendre le script `seed.ts`
2. Créer un script séparé pour les données spécifiques
3. Utiliser l'API pour créer des données via des requêtes HTTP

## 📝 Exemples d'utilisation

### Développement rapide

```bash
# Migration + seed minimal
npm run migrate:seed:minimal

# Démarrer le backend
npm run dev
```

### Tests complets

```bash
# Migration + seed complet
npm run migrate:seed:full

# Tester toutes les fonctionnalités avec beaucoup de données
```

### Démo

```bash
# Seed standard pour une démo
npm run seed:standard

# Les identifiants sont affichés dans la console
```

## ⚠️ Avertissements

### Production

⚠️ **NE JAMAIS exécuter le seed en production !**

Le seed est conçu uniquement pour :
- ✅ Développement
- ✅ Tests
- ✅ Démonstrations

### Données existantes

Le seed :
- ✅ Met à jour les données existantes (ON CONFLICT)
- ✅ Ne supprime pas les données existantes
- ✅ Peut créer des conflits si vous modifiez manuellement les données

## 🔍 Vérification

### Vérifier les données créées

```sql
-- Compter les utilisateurs
SELECT COUNT(*) FROM profiles;

-- Compter les entreprises
SELECT COUNT(*) FROM companies;

-- Vérifier les membres d'équipe
SELECT COUNT(*) FROM company_members;

-- Voir les entreprises avec leurs membres
SELECT 
  c.name as company_name,
  c.status,
  COUNT(cm.id) as member_count
FROM companies c
LEFT JOIN company_members cm ON cm.company_id = c.id
GROUP BY c.id, c.name, c.status;
```

### Vérifier les identifiants

Les identifiants sont affichés dans la console après l'exécution du seed :

```
🔐 Identifiants de connexion:
   - admin@facture.gn / Admin1234!
   - demo@facture.gn / Demo1234!
```

## 🐛 Dépannage

### Erreur : "relation does not exist"

**Cause** : Les migrations n'ont pas été exécutées.

**Solution** :
```bash
npm run migrate
npm run seed
```

### Erreur : "duplicate key value"

**Cause** : Les données existent déjà.

**Solution** : C'est normal, le seed met à jour les données existantes. Vérifiez que les données sont correctes.

### Erreur : "password authentication failed"

**Cause** : Problème de connexion à la base de données.

**Solution** : Vérifiez votre `.env` et la configuration de la base de données.

## 📚 Ressources

- [Documentation des migrations](./MIGRATIONS.md)
- [Documentation du backend](../backend/README.md)
- [Configuration des variables d'environnement](./CONFIGURATION_ENV.md)

