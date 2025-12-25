import { createContext, useContext, useEffect, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore, PlatformRole } from '@/stores';

// Re-export PlatformRole for backward compatibility
export type { PlatformRole } from '@/stores';

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

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    
    if (data) {
      setProfile(data as any);
    }
  };

  const fetchCompanyMembership = async (userId: string) => {
    const { data } = await supabase
      .from('company_members')
      .select(`
        *,
        company:companies(id, name, status, logo_url)
      `)
      .eq('user_id', userId)
      .eq('is_active', true)
      .maybeSingle();
    
    if (data) {
      setCompanyMembership(data as any);
    } else {
      setCompanyMembership(null);
    }
  };

  const refreshProfile = async () => {
    if (user?.id) {
      await Promise.all([
        fetchProfile(user.id),
        fetchCompanyMembership(user.id)
      ]);
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          setTimeout(() => {
            fetchProfile(session.user.id);
            fetchCompanyMembership(session.user.id);
          }, 0);
        } else {
          setProfile(null);
          setCompanyMembership(null);
        }
        
        setLoading(false);
        setInitialized(true);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchProfile(session.user.id);
        fetchCompanyMembership(session.user.id);
      }
      
      setLoading(false);
      setInitialized(true);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: { full_name: fullName }
      }
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    reset();
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
