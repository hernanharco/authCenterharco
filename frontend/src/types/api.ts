/**
 * Estructura para representar un perfil de usuario.
 * Reemplaza 'any' por los campos reales que devuelve tu base de datos.
 */
export interface UserProfile {
  id: string;
  email: string;
  role: string;
  updated_at?: string;
  created_at?: string;
}

/**
 * Interfaz genérica para respuestas de API.
 * <T> permite definir qué tipo de dato vendrá en la respuesta principal.
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  error?: string;
  profiles?: UserProfile[]; // Lista tipada en lugar de any[]
  total?: number;
  data?: T;                 // Para datos genéricos adicionales
}