import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

interface ProtectedRouteProps {
  children: ReactNode;
  requireAuth?: boolean;
  requireCompany?: boolean;
  requireApprovedCompany?: boolean;
  requirePlatformOwner?: boolean;
  requireRoles?: string[];
}

export function ProtectedRoute({
  children,
  requireAuth = true,
  requireCompany = false,
  requireApprovedCompany = false,
  requirePlatformOwner = false,
  requireRoles = [],
}: ProtectedRouteProps) {
  const { user, loading, companyMembership, companyRole, isPlatformOwner } = useAuth();
  const location = useLocation();

  // En cours de chargement
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 rounded-lg gradient-primary flex items-center justify-center animate-pulse">
            <div className="h-5 w-5 text-primary-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  // Vérifier l'authentification
  if (requireAuth && !user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Vérifier le propriétaire de la plateforme
  if (requirePlatformOwner && !isPlatformOwner) {
    return <Navigate to="/" replace />;
  }

  // Vérifier l'appartenance à une entreprise
  if (requireCompany && !companyMembership) {
    return <Navigate to="/register-company" replace />;
  }

  // Vérifier que l'entreprise est approuvée
  if (requireApprovedCompany && companyMembership?.company?.status !== 'approved') {
    const status = companyMembership?.company?.status;
    if (status === 'pending') {
      return <Navigate to="/" replace />; // La page Index redirigera vers PendingApproval
    }
    if (status === 'rejected') {
      return <Navigate to="/" replace />; // La page Index redirigera vers CompanyRejected
    }
    if (status === 'suspended') {
      return <Navigate to="/" replace />; // La page Index redirigera vers CompanySuspended
    }
  }

  // Vérifier les rôles
  if (requireRoles.length > 0 && companyRole && !requireRoles.includes(companyRole)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

