# FactureGN - Plateforme de facturation guinéenne

> Développé par **Pellel-Connect**

Application de facturation moderne multi-entreprises pour la Guinée.

## 🚀 Démarrage rapide

### Pour le propriétaire de la plateforme

Le **premier utilisateur inscrit** devient automatiquement propriétaire de la plateforme :

1. Aller sur `/auth`
2. Créer un compte avec l'email administrateur (ex: `admin@pellel-connect.com`)
3. Vous avez maintenant accès au tableau de bord propriétaire

### Pour une entreprise

1. **S'inscrire** sur `/auth` avec un compte utilisateur
2. **Enregistrer l'entreprise** via le formulaire dédié
3. **Attendre l'approbation** du propriétaire de la plateforme
4. **Commencer à facturer** une fois l'entreprise approuvée

## 📖 Documentation

📄 **[Guide d'inscription complet](./docs/GUIDE_INSCRIPTION.md)** - Tout savoir sur la création de compte

## 🔐 Système de rôles

| Rôle | Description |
|------|-------------|
| `platform_owner` | Propriétaire de la plateforme - Gère toutes les entreprises |
| `company_admin` | Administrateur d'entreprise - Tous les droits sur son entreprise |
| `company_manager` | Gestionnaire - Gère factures et clients |
| `company_user` | Utilisateur - Consultation uniquement |

## 🧪 Identifiants de test

| Email | Mot de passe |
|-------|--------------|
| `admin@facture.gn` | `Admin1234!` |
| `test@facture.gn` | `Test1234!` |
| `demo@facture.gn` | `Demo1234!` |

> **Scénario recommandé :**
> 1. Inscrire `admin@facture.gn` en premier (devient propriétaire)
> 2. Inscrire `test@facture.gn` et enregistrer une entreprise
> 3. Avec `admin@facture.gn`, approuver l'entreprise
> 4. Générer des données de test dans **Paramètres → Données de test**

## 🛠️ Technologies

- **Frontend** : React + TypeScript + Tailwind CSS + shadcn/ui
- **Backend** : Node.js/Express + PostgreSQL + JWT
- **Devise** : Franc Guinéen (GNF)
- **Build** : Vite

## 💻 Développement local

```sh
# Cloner le projet
git clone <YOUR_GIT_URL>

# Installer les dépendances
npm install

# Lancer le serveur de développement
npm run dev
```

## 🌐 Déploiement

1. Ouvrir [Lovable](https://lovable.dev)
2. Cliquer sur **Share → Publish**

### Domaine personnalisé

Naviguer vers **Project → Settings → Domains** et connecter votre domaine.

---

*FactureGN v2.0.0 - © 2025 Pellel-Connect*
