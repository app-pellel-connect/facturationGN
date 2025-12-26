import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '@/lib/api/auth';
import { useAuthStore } from '@/stores';

/**
 * Hook pour initialiser les intercepteurs d'authentification
 * Doit être utilisé dans le composant racine de l'application
 */
export function useAuthInterceptor() {
  const navigate = useNavigate();
  const reset = useAuthStore((state) => state.reset);

  useEffect(() => {
    // Écouter l'événement de déconnexion déclenché par l'intercepteur
    const handleLogout = () => {
      authApi.signOut();
      reset();
      navigate('/auth');
    };

    window.addEventListener('auth:logout', handleLogout);

    return () => {
      window.removeEventListener('auth:logout', handleLogout);
    };
  }, [navigate, reset]);
}

