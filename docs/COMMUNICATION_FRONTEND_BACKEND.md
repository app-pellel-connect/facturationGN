# Communication Frontend ↔ Backend

## 📡 Architecture de Communication

Le frontend (React) et le backend (Express.js) communiquent via **HTTP REST API** avec authentification JWT.

```
┌─────────────────┐                    ┌─────────────────┐
│   FRONTEND      │                    │    BACKEND      │
│   (React)       │                    │   (Express.js)  │
│                 │                    │                 │
│  Port: 8080     │  HTTP/REST API    │  Port: 3001     │
│  (Vite Dev)     │◄──────────────────►│  (Node.js)      │
│                 │                    │                 │
│  - Hooks        │  JWT Bearer Token  │  - Routes       │
│  - API Client   │  JSON              │  - Middlewares  │
│  - Zustand      │                    │  - PostgreSQL   │
└─────────────────┘                    └─────────────────┘
```

## 🔄 Flux de Communication

### 1. **Client API** (`src/lib/api/client.ts`)

Le client API centralise toutes les requêtes HTTP :

```typescript
// Configuration de l'URL du backend
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Méthodes disponibles
apiClient.get('/endpoint')      // GET request
apiClient.post('/endpoint', data)  // POST request
apiClient.put('/endpoint', data)   // PUT request
apiClient.delete('/endpoint')      // DELETE request
```

**Fonctionnalités :**
- ✅ Gestion automatique du token JWT dans les headers
- ✅ Stockage du token dans `localStorage`
- ✅ Gestion des erreurs HTTP
- ✅ Headers JSON automatiques

### 2. **Modules API** (`src/lib/api/*.ts`)

Chaque module expose des fonctions spécifiques :

```typescript
// src/lib/api/auth.ts
authApi.signUp(data)
authApi.signIn(data)
authApi.getProfile()
authApi.signOut()

// src/lib/api/clients.ts
clientsApi.getAll(companyId)
clientsApi.create(data)
clientsApi.update(id, data)
clientsApi.delete(id)

// src/lib/api/invoices.ts
invoicesApi.getAll(companyId)
invoicesApi.create(data)
// etc.
```

### 3. **Hooks React** (`src/hooks/*.ts`)

Les hooks utilisent React Query pour gérer le cache et les états :

```typescript
// Exemple: useAuth.tsx
const { user, signIn, signOut } = useAuth();

// Exemple: useClients.ts
const { clients, createClient, updateClient } = useClients();
```

**Avantages :**
- ✅ Cache automatique des données
- ✅ Optimistic updates
- ✅ Gestion des erreurs
- ✅ Revalidation automatique

## 🔐 Authentification JWT

### Flux d'authentification

1. **Inscription/Connexion**
   ```
   Frontend → POST /api/auth/signup
   Backend → Génère JWT token
   Frontend → Stocke token dans localStorage
   ```

2. **Requêtes authentifiées**
   ```
   Frontend → Ajoute header: Authorization: Bearer <token>
   Backend → Vérifie token via middleware authenticate
   Backend → Extrait userId du token
   Backend → Exécute la requête
   ```

3. **Stockage du token**
   ```typescript
   // Le token est stocké dans localStorage
   localStorage.setItem('auth_token', token);
   
   // Ajouté automatiquement dans chaque requête
   headers['Authorization'] = `Bearer ${token}`;
   ```

## 📋 Exemple Complet

### Frontend → Backend : Créer un client

**1. Hook utilise l'API :**
```typescript
// src/hooks/useClients.ts
const createClient = useMutation({
  mutationFn: async (input: ClientInput) => {
    return clientsApi.create(input, companyId);
  }
});
```

**2. API Client fait la requête :**
```typescript
// src/lib/api/clients.ts
create: async (data, companyId) => {
  return apiClient.post('/clients', { ...data, company_id: companyId });
}
```

**3. Requête HTTP envoyée :**
```http
POST http://localhost:3001/api/clients
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "name": "Client ABC",
  "email": "client@example.com",
  "company_id": "uuid-here"
}
```

**4. Backend traite la requête :**
```typescript
// backend/src/routes/clients.ts
router.post('/', authenticate, validate(createClientSchema), async (req, res) => {
  // req.user contient les infos de l'utilisateur authentifié
  const client = await pool.query('INSERT INTO clients ...');
  res.json(client);
});
```

**5. Réponse retournée :**
```json
{
  "id": "uuid",
  "name": "Client ABC",
  "email": "client@example.com",
  "company_id": "uuid-here",
  "created_at": "2025-01-01T00:00:00Z"
}
```

## ⚙️ Configuration

### Frontend (`.env` à la racine)

```env
VITE_API_URL=http://localhost:3001/api
```

### Backend (`backend/.env`)

```env
PORT=3001
CORS_ORIGIN=http://localhost:8080
JWT_SECRET=your-secret-key
```

**Important :** Le `CORS_ORIGIN` du backend doit correspondre à l'URL du frontend.

## 🛡️ Sécurité

### Middlewares Backend

1. **CORS** - Autorise uniquement le frontend configuré
2. **Helmet** - Sécurise les headers HTTP
3. **Rate Limiting** - Limite les requêtes par IP
4. **JWT Authentication** - Vérifie le token sur chaque requête
5. **Input Validation** - Valide les données avec Zod

### Protection Frontend

- Token stocké dans `localStorage` (peut être amélioré avec httpOnly cookies)
- Token automatiquement ajouté dans chaque requête
- Gestion des erreurs 401 (déconnexion automatique)

## 📊 Structure des Requêtes

### Format Standard

**Requête :**
```http
METHOD /api/resource
Authorization: Bearer <token>
Content-Type: application/json

{ "data": "..." }
```

**Réponse Succès :**
```json
{
  "id": "...",
  "data": "..."
}
```

**Réponse Erreur :**
```json
{
  "error": "Message d'erreur",
  "details": [...]
}
```

## 🔄 États et Cache

### React Query

Les hooks utilisent React Query pour :
- **Cache** : Les données sont mises en cache automatiquement
- **Stale Time** : Durée avant revalidation (ex: 5 minutes)
- **Optimistic Updates** : Mise à jour immédiate de l'UI
- **Refetch** : Revalidation automatique après mutations

### Exemple de Cache

```typescript
// Données mises en cache pendant 5 minutes
staleTime: 5 * 60 * 1000

// Après une mutation, invalidation du cache
queryClient.invalidateQueries({ queryKey: ['clients', companyId] });
```

## 🚀 Démarrage

### 1. Démarrer le backend
```bash
cd backend
npm install
npm run dev  # Port 3001
```

### 2. Démarrer le frontend
```bash
npm install
npm run dev  # Port 8080
```

### 3. Vérifier la communication
```bash
# Health check
curl http://localhost:3001/health

# Test avec token
curl -H "Authorization: Bearer <token>" http://localhost:3001/api/auth/me
```

## 📝 Résumé

| Aspect | Frontend | Backend |
|--------|----------|---------|
| **Technologie** | React + TypeScript | Express.js + TypeScript |
| **Port** | 8080 (Vite) | 3001 |
| **Communication** | Fetch API | Express Routes |
| **Authentification** | JWT dans localStorage | JWT middleware |
| **Format** | JSON | JSON |
| **Cache** | React Query | PostgreSQL |
| **Validation** | Zod (via API) | Zod + Express Validator |

