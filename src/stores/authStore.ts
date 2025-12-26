import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type PlatformRole = 'platform_owner' | 'company_admin' | 'company_manager' | 'company_user';

interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  is_platform_owner: boolean;
  created_at: string;
  updated_at: string;
}

interface CompanyMembership {
  id: string;
  company_id: string;
  role: PlatformRole;
  is_active: boolean;
  company?: {
    id: string;
    name: string;
    status: 'pending' | 'approved' | 'suspended' | 'rejected';
    logo_url: string | null;
  };
}

interface User {
  id: string;
  email: string;
}

interface Session {
  token: string;
  refreshToken: string;
}

interface AuthState {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  companyMembership: CompanyMembership | null;
  loading: boolean;
  initialized: boolean;
}

interface AuthActions {
  setUser: (user: User | null) => void;
  setSession: (session: Session | null) => void;
  setProfile: (profile: Profile | null) => void;
  setCompanyMembership: (membership: CompanyMembership | null) => void;
  setLoading: (loading: boolean) => void;
  setInitialized: (initialized: boolean) => void;
  reset: () => void;
  
  // Computed getters
  isPlatformOwner: () => boolean;
  companyId: () => string | null;
  companyRole: () => PlatformRole | null;
  isCompanyApproved: () => boolean;
  hasCompanyRole: (roles: PlatformRole[]) => boolean;
  canManageCompany: () => boolean;
}

const initialState: AuthState = {
  user: null,
  session: null,
  profile: null,
  companyMembership: null,
  loading: true,
  initialized: false,
};

export const useAuthStore = create<AuthState & AuthActions>()(
  (set, get) => ({
    ...initialState,

    setUser: (user) => set({ user }),
    setSession: (session) => set({ session }),
    setProfile: (profile) => set({ profile }),
    setCompanyMembership: (membership) => set({ companyMembership: membership }),
    setLoading: (loading) => set({ loading }),
    setInitialized: (initialized) => set({ initialized }),
    
    reset: () => set(initialState),

    // Computed getters
    isPlatformOwner: () => get().profile?.is_platform_owner ?? false,
    companyId: () => get().companyMembership?.company_id ?? null,
    companyRole: () => get().companyMembership?.role ?? null,
    isCompanyApproved: () => get().companyMembership?.company?.status === 'approved',
    
    hasCompanyRole: (roles) => {
      const role = get().companyMembership?.role;
      if (!role) return false;
      return roles.includes(role);
    },
    
    canManageCompany: () => {
      const role = get().companyMembership?.role;
      if (!role) return false;
      return ['company_admin', 'company_manager'].includes(role);
    },
  })
);
