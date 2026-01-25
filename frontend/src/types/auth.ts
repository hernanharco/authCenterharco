// src/types/auth.ts

/**
 * Los errores de Supabase suelen incluir más que solo el mensaje.
 * Definirlo como unknown o string opcional ayuda a la validación.
 */
export interface SupabaseError {
  message: string;
  status?: number;
}

export interface TrackingData {
  sourceApp: string;
  timestamp: string;
  status: string;
}

/**
 * Definimos una interfaz para la metadata que sea predecible.
 * Reemplazamos 'any' por una estructura de registro seguro.
 */
export interface UserMetadata {
  role?: string;
  source_app?: string;
  // En lugar de any, usamos Record con unknown para forzar validación
  // si decides añadir más campos en el futuro.
  [key: string]: unknown; 
}

/**
 * Representa la estructura de la sesión.
 * El email es opcional porque Supabase permite logins anónimos o por teléfono,
 * pero para un SaaS, usualmente lo marcaremos como requerido si tu flujo lo exige.
 */
export interface AuthSession {
  access_token: string;
  refresh_token: string;
  user: {
    id: string;
    email?: string;
    user_metadata: UserMetadata;
  };
}

/**
 * Respuesta personalizada para nuestras llamadas de autenticación.
 */
export interface AuthSessionResponse {
  error: SupabaseError | null;
  data: {
    session: AuthSession | null;
  };
}