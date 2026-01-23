// frontend/src/utils/api.ts
import { ApiResponse } from '@/types/api';

/**
 * URL base del backend de Express.
 * Se obtiene de las variables de entorno o usa el puerto 4000 por defecto.
 */
const EXPRESS_URL = (process.env.NEXT_PUBLIC_EXPRESS_URL || 'http://localhost:4000/api').replace(/\/$/, '');

/**
 * Función genérica para hacer llamadas a la API de Express con soporte para TypeScript.
 * * @template T - Tipo esperado de la respuesta (por defecto ApiResponse)
 * @param {string} endpoint - La ruta del recurso (ej: '/auth/login' o '/profiles')
 * @param {RequestInit} options - Opciones nativas de fetch (method, body, headers, etc.)
 * @returns {Promise<T>} - Promesa con los datos tipados de la respuesta
 */
export async function fetchApi<T = ApiResponse>(
  endpoint: string, 
  options: RequestInit = {}
): Promise<T> {
    
    // Normalización del endpoint: asegurar que empiece con /
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    
    const defaultOptions: RequestInit = {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
        // CRÍTICO: 'include' asegura que las cookies (como el JWT) se envíen automáticamente.
        // Esencial para que el backend reconozca tu sesión de Admin en Neon.
        credentials: 'include', 
        ...options,
    };
    
    // Si el body es un objeto, lo convertimos automáticamente a JSON string
    if (options.body && typeof options.body !== 'string') {
        defaultOptions.body = JSON.stringify(options.body);
    }

    try {
        const response = await fetch(`${EXPRESS_URL}${cleanEndpoint}`, defaultOptions);

        // 1. Manejo de Sesión Expirada (401/403)
        if (response.status === 401 || response.status === 403) {
            console.warn('⚠️ Sesión expirada o permisos insuficientes. Redirigiendo...');
            if (typeof window !== 'undefined') {
                window.location.href = '/login';
            }
            throw new Error('Sesión expirada o no autorizada.'); 
        }

        // 2. Manejo de Errores del Servidor (4xx, 5xx)
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ 
                message: `Error del servidor (${response.status})` 
            }));

            // Log detallado para desarrollo en Linux
            console.error(`🔴 API Error [${response.status}] en ${cleanEndpoint}:`, errorData);

            throw new Error(errorData.message || errorData.error || `Error ${response.status}`);
        }

        // 3. Respuesta Exitosa
        const data = await response.json();
        return data as T;

    } catch (error: any) {
        // Manejo de errores de red (Server offline o CORS)
        if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
            console.error('❌ Error de conexión: El servidor Express no responde.');
            throw new Error('No se pudo establecer conexión con el servidor.');
        }
        
        // Re-lanzar el error para que el componente (Dashboard) pueda manejarlo
        throw error;
    }    
}

