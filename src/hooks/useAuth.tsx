import { createContext, useContext, useEffect, ReactNode, useState } from 'react';
import { authApi, type ProfileResponse } from '@/lib/api/auth';
import { useAuthStore, PlatformRole } from '@/stores';

// Re-export PlatformRole for backward compatibility
export type { PlatformRole } from '@/stores';

interface User {
  id: string;
  email: string;
}

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

interface Session {
  token: string;
  refreshToken: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  isPlatformOwner: boolean;
  companyMembership: CompanyMembership | null;
  companyId: string | null;
  companyRole: PlatformRole | null;
  isCompanyApproved: boolean;
  hasCompanyRole: (roles: PlatformRole[]) => boolean;
  canManageCompany: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const {
    user,
    session,
    profile,
    companyMembership,
    loading,
    setUser,
    setSession,
    setProfile,
    setCompanyMembership,
    setLoading,
    setInitialized,
    reset,
    isPlatformOwner,
    companyId,
    companyRole,
    isCompanyApproved,
    hasCompanyRole,
    canManageCompany,
  } = useAuthStore();

  const [isInitialized, setIsInitialized] = useState(false);

  const fetchProfile = async () => {
    try {
      const data: ProfileResponse = await authApi.getProfile();
      
      const userData: User = {
        id: data.user.id,
        email: data.user.email,
      };
      
      setUser(userData);
      setProfile({
        id: data.user.id,
        email: data.user.email,
        full_name: data.user.full_name,
        phone: data.user.phone,
        avatar_url: data.user.avatar_url,
        is_platform_owner: data.user.is_platform_owner,
        created_at: '',
        updated_at: '',
      });

      if (data.company) {
        setCompanyMembership({
          id: '',
          company_id: data.company.id,
          role: data.company.role as PlatformRole,
          is_active: true,
          company: {
            id: data.company.id,
            name: data.company.name,
            status: data.company.status as any,
            logo_url: null,
          },
        });
      } else {
        setCompanyMembership(null);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      setUser(null);
      setProfile(null);
      setCompanyMembership(null);
    }
  };

  const refreshProfile = async () => {
    await fetchProfile();
  };

  useEffect(() => {
    const initAuth = async () => {
      setLoading(true);
      
      // Vérifier si un token existe
      const token = localStorage.getItem('auth_token');
      
      if (token) {
        try {
          await fetchProfile();
        } catch (error) {
          // Token invalide, nettoyer
          authApi.signOut();
          reset();
        }
      } else {
        reset();
      }
      
      setLoading(false);
      setInitialized(true);
      setIsInitialized(true);
    };

    initAuth();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const response = await authApi.signIn({ email, password });
      
      const userData: User = {
        id: response.user.id,
        email: response.user.email,
      };
      
      setUser(userData);
      setSession({
        token: response.token,
        refreshToken: response.refreshToken,
      });
      
      await fetchProfile();
      
      return { error: null };
    } catch (error: any) {
      return { error: error as Error };
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      const response = await authApi.signUp({ email, password, full_name: fullName });
      
      const userData: User = {
        id: response.user.id,
        email: response.user.email,
      };
      
      setUser(userData);
      setSession({
        token: response.token,
        refreshToken: response.refreshToken,
      });
      
      await fetchProfile();
      
      return { error: null };
    } catch (error: any) {
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    authApi.signOut();
    reset();
    // Redirection sera gérée par le composant qui appelle signOut
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      session, 
      profile,
      loading, 
      isPlatformOwner: isPlatformOwner(),
      companyMembership,
      companyId: companyId(),
      companyRole: companyRole(),
      isCompanyApproved: isCompanyApproved(),
      hasCompanyRole,
      canManageCompany: canManageCompany(),
      signIn, 
      signUp, 
      signOut,
      refreshProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
