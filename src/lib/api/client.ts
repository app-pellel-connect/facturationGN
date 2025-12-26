const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Type pour les intercepteurs
type RequestInterceptor = (config: RequestInit) => RequestInit | Promise<RequestInit>;
type ResponseInterceptor = (response: Response) => Response | Promise<Response>;
type ErrorInterceptor = (error: Error, response?: Response) => Error | Promise<Error>;

class ApiClient {
  private baseUrl: string;
  private token: string | null = null;
  private requestInterceptors: RequestInterceptor[] = [];
  private responseInterceptors: ResponseInterceptor[] = [];
  private errorInterceptors: ErrorInterceptor[] = [];
  private refreshTokenPromise: Promise<string> | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
    // Récupérer le token depuis localStorage
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('auth_token');
    }

    // Intercepteur de requête par défaut pour ajouter le token
    this.requestInterceptors.push((config) => {
      const headers = new Headers(config.headers);
      
      if (this.token) {
        headers.set('Authorization', `Bearer ${this.token}`);
      }

      return {
        ...config,
        headers,
      };
    });

    // Intercepteur de réponse par défaut pour gérer les erreurs d'authentification
    this.responseInterceptors.push(async (response) => {
      if (response.status === 401) {
        // Tentative de rafraîchir le token
        const refreshed = await this.handleUnauthorized();
        if (!refreshed) {
          // Si le rafraîchissement échoue, rediriger vers la page de connexion
          if (typeof window !== 'undefined') {
            this.setToken(null);
            // Déclencher un événement personnalisé pour que l'application réagisse
            window.dispatchEvent(new CustomEvent('auth:logout'));
          }
        }
      }
      return response;
    });

    // Intercepteur d'erreur par défaut
    this.errorInterceptors.push((error, response) => {
      if (response?.status === 401) {
        return new Error('Session expirée. Veuillez vous reconnecter.');
      }
      if (response?.status === 403) {
        return new Error('Accès refusé. Vous n\'avez pas les permissions nécessaires.');
      }
      if (response?.status === 404) {
        return new Error('Ressource non trouvée.');
      }
      if (response?.status === 500) {
        return new Error('Erreur serveur. Veuillez réessayer plus tard.');
      }
      return error;
    });
  }

  // Ajouter un intercepteur de requête
  addRequestInterceptor(interceptor: RequestInterceptor) {
    this.requestInterceptors.push(interceptor);
  }

  // Ajouter un intercepteur de réponse
  addResponseInterceptor(interceptor: ResponseInterceptor) {
    this.responseInterceptors.push(interceptor);
  }

  // Ajouter un intercepteur d'erreur
  addErrorInterceptor(interceptor: ErrorInterceptor) {
    this.errorInterceptors.push(interceptor);
  }

  setToken(token: string | null) {
    this.token = token;
    if (token && typeof window !== 'undefined') {
      localStorage.setItem('auth_token', token);
    } else if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('refresh_token');
    }
  }

  getToken(): string | null {
    return this.token;
  }

  private async handleUnauthorized(): Promise<boolean> {
    // Éviter plusieurs tentatives simultanées de rafraîchissement
    if (this.refreshTokenPromise) {
      return this.refreshTokenPromise.then(() => true).catch(() => false);
    }

    const refreshToken = typeof window !== 'undefined' 
      ? localStorage.getItem('refresh_token') 
      : null;

    if (!refreshToken) {
      return false;
    }

    this.refreshTokenPromise = (async () => {
      try {
        const response = await fetch(`${this.baseUrl}/auth/refresh`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ refreshToken }),
        });

        if (!response.ok) {
          throw new Error('Token refresh failed');
        }

        const data = await response.json();
        this.setToken(data.token);
        
        // Sauvegarder le nouveau refresh token s'il est fourni
        if (data.refreshToken && typeof window !== 'undefined') {
          localStorage.setItem('refresh_token', data.refreshToken);
        }

        return data.token;
      } catch (error) {
        this.setToken(null);
        throw error;
      } finally {
        this.refreshTokenPromise = null;
      }
    })();

    try {
      await this.refreshTokenPromise;
      return true;
    } catch {
      return false;
    }
  }

  private async applyRequestInterceptors(config: RequestInit): Promise<RequestInit> {
    let processedConfig = config;
    for (const interceptor of this.requestInterceptors) {
      processedConfig = await interceptor(processedConfig);
    }
    return processedConfig;
  }

  private async applyResponseInterceptors(response: Response): Promise<Response> {
    let processedResponse = response;
    for (const interceptor of this.responseInterceptors) {
      processedResponse = await interceptor(processedResponse);
    }
    return processedResponse;
  }

  private async applyErrorInterceptors(error: Error, response?: Response): Promise<Error> {
    let processedError = error;
    for (const interceptor of this.errorInterceptors) {
      processedError = await interceptor(processedError, response);
    }
    return processedError;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    // Préparer les headers de base
    const headers = new Headers(options.headers);
    if (!headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }

    // Appliquer les intercepteurs de requête
    const config = await this.applyRequestInterceptors({
      ...options,
      headers,
    });

    try {
      const response = await fetch(url, config);
      
      // Appliquer les intercepteurs de réponse
      const processedResponse = await this.applyResponseInterceptors(response);

      // Parser le JSON
      const contentType = processedResponse.headers.get('content-type');
      let data: any;
      
      if (contentType && contentType.includes('application/json')) {
        try {
          data = await processedResponse.json();
        } catch {
          data = null;
        }
      }

      if (!processedResponse.ok) {
        const errorMessage = data?.error || `HTTP error! status: ${processedResponse.status}`;
        const error = new Error(errorMessage);
        throw await this.applyErrorInterceptors(error, processedResponse);
      }

      return data as T;
    } catch (error) {
      if (error instanceof Error) {
        throw await this.applyErrorInterceptors(error);
      }
      throw await this.applyErrorInterceptors(new Error('Une erreur est survenue'));
    }
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

export const apiClient = new ApiClient(API_URL);

