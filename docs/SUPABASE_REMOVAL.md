# Suppression de Supabase

## ✅ Fichiers supprimés

- ❌ `src/integrations/supabase/client.ts`
- ❌ `src/integrations/supabase/types.ts`
- ❌ `supabase/` (dossier complet)
- ❌ `@supabase/supabase-js` (dépendance npm)

## ⚠️ Fichiers à mettre à jour

Les fichiers suivants utilisent encore Supabase et doivent être migrés vers le nouveau backend :

### Pages
1. **`src/pages/admin/AdminDashboard.tsx`**
   - Utilise `supabase.from('companies')`, `supabase.from('profiles')`, etc.
   - À migrer vers : `companiesApi`, `dashboardApi`

2. **`src/pages/CompanyRegister.tsx`**
   - Utilise `supabase.rpc('register_company')`
   - À migrer vers : `companiesApi.create()`

### Hooks
3. **`src/hooks/useInvoices.ts`**
   - Utilise `supabase.from('invoices')`
   - ⚠️ Déjà partiellement migré, mais certaines fonctions utilisent encore Supabase
   - À compléter avec : `invoicesApi`

4. **`src/hooks/usePayments.ts`**
   - Utilise `supabase.from('payments')`
   - À migrer vers : `paymentsApi`

5. **`src/hooks/useTeamMembers.ts`**
   - Utilise `supabase.functions.invoke('create-team-member')` et `supabase.from('company_members')`
   - À migrer vers : `teamApi`

### Composants
6. **`src/components/settings/TeamManagement.tsx`**
   - Utilise `supabase.auth.signUp()` et `supabase.from('company_members')`
   - À migrer vers : `teamApi` et `authApi`

### Utilitaires
7. **`src/lib/seedDemoData.ts`**
   - Utilise `supabase.from()` pour créer des données de démonstration
   - À migrer vers les APIs correspondantes ou supprimer si non utilisé

## 📝 Notes

- Le store `authStore.ts` a été corrigé pour ne plus dépendre de Supabase
- Le hook `useAuth.tsx` a déjà été migré vers le nouveau backend
- Le hook `useClients.ts` a déjà été migré vers le nouveau backend

## 🔄 Prochaines étapes

1. Migrer les fichiers listés ci-dessus vers les nouvelles APIs
2. Tester chaque fonctionnalité après migration
3. Supprimer les imports Supabase restants
4. Mettre à jour la documentation technique

