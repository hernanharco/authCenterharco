// Define la estructura de datos que esperamos del backend
export interface UserData {
  id: string;
  email: string;
  role: string; // 'admin', 'authenticated', etc.
}

// Lee la URL de Express desde las variables de entorno
const EXPRESS_BASE_URL = process.env.NEXT_PUBLIC_EXPRESS_URL || "http://localhost:3000";

/**
 * Clase de servicio para interactuar con las rutas protegidas por Rol de Administrador
 * en el backend Express.
 */
export class AdminService {
  private static URL_USERS = `${EXPRESS_BASE_URL}/api/users`;

  /**
   * Ejecuta la consulta protegida 'GET /auth/users' para obtener la lista de usuarios.
   * Requiere rol 'admin' y cookies de sesión activas (authToken).
   * @returns Una promesa que resuelve con la lista de objetos UserData.
   */
  public static async getAllUsers(): Promise<UserData[]> {
    try {
      const response = await fetch(AdminService.URL_USERS, {
        method: 'GET',
        // CLAVE: 'include' asegura que las cookies (authToken, refreshToken) se envíen
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        // 'no-store' o SSR son importantes para datos sensibles o que cambian rápido
        cache: 'no-store' 
      });

      if (!response.ok) {
        // Manejar errores de autorización o rol insuficiente (401/403)
        const errorData = await response.json().catch(() => ({ message: 'Error desconocido del servidor.' }));
        
        if (response.status === 401) {
          throw new Error(`[401] No autenticado. Sesión expirada o faltante.`);
        }
        if (response.status === 403) {
          throw new Error(`[403] Acceso denegado. Se requiere el rol 'admin'.`);
        }
        
        throw new Error(`Error ${response.status}: ${errorData.message}`);
      }

      const data = await response.json();
      // El backend devuelve { message: string, users: UserData[] }
      return data.users as UserData[]; 

    } catch (error) {
      console.error("Error en AdminService.getAllUsers:", error);
      throw error;
    }
  }
}