import { ReactNode, useEffect } from 'react';
import { useAuthInterceptor } from '@/hooks/useAuthInterceptor';

interface AuthGuardProps {
  children: ReactNode;
}

/**
 * Composant wrapper pour initialiser les intercepteurs d'authentification
 * Doit entourer l'application dans le router
 */
export function AuthGuard({ children }: AuthGuardProps) {
  useAuthInterceptor();
  return <>{children}</>;
}

