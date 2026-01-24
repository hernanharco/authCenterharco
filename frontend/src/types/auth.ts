// src/types/auth.ts

export interface SupabaseError {
  message: string;
}

export interface TrackingData {
  sourceApp: string;
  timestamp: string;
  status: string;
}

/**
 * Representa la estructura simplificada de la sesión de Supabase
 * que necesitamos para nuestro flujo.
 */
export interface AuthSession {
  access_token: string;
  refresh_token: string;
  user: {
    id: string;
    email?: string;
    user_metadata: {
      role?: string;
      source_app?: string;
      [key: string]: any;
    };
  };
}

/**
 * Respuesta personalizada para nuestras llamadas de autenticación
 */
export interface AuthSessionResponse {
  error: SupabaseError | null;
  data: {
    session: AuthSession | null;
  };
}