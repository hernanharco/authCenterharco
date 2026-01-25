import { ApiResponse } from '@/types/api';

/**
 * URL base del backend de Express.
 * Sincronizado con tu configuración de Linux/Neon.
 */
const EXPRESS_URL = (process.env.NEXT_PUBLIC_EXPRESS_URL || 'http://localhost:4000/api').replace(/\/$/, '');

/**
 * Función genérica para llamadas a la API con soporte para cookies HttpOnly.
 */
export async function fetchApi<T = ApiResponse>(
  endpoint: string, 
  options: RequestInit = {}
): Promise<T> {
    
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    
    // Configuración base optimizada para tu arquitectura SaaS
    const defaultHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
    };

    const defaultOptions: RequestInit = {
        method: 'GET',
        credentials: 'include', // 🚨 Obligatorio para enviar authToken y refreshToken
        ...options,
        headers: {
            ...defaultHeaders,
            ...options.headers,
        },
    };
    
    if (options.body && typeof options.body !== 'string' && !(options.body instanceof FormData)) {
        defaultOptions.body = JSON.stringify(options.body);
    }

    try {
        const response = await fetch(`${EXPRESS_URL}${cleanEndpoint}`, defaultOptions);

        // 1. Manejo de Autorización (401/403)
        if (response.status === 401) {
            console.warn('⚠️ Sesión expirada. Intentando flujo de recuperación...');
            if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
                // Solo redirigimos si no estamos ya en el login para evitar bucles
                window.location.href = '/login?reason=expired';
            }
            throw new Error('Sesión expirada'); 
        }

        // 2. Manejo de Errores del Servidor
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ 
                message: `Error ${response.status}: ${response.statusText}` 
            }));

            console.error(`🔴 API Error [${response.status}] en ${cleanEndpoint}:`, errorData);
            throw new Error(errorData.message || errorData.error || `Error ${response.status}`);
        }

        // 3. Respuesta Exitosa
        return await response.json() as T;

    } catch (error: unknown) {
    // 1. Verificamos si es una instancia de Error para acceder a sus propiedades con seguridad
    if (error instanceof Error) {
        // En Node.js/Browsers, los errores de red suelen ser TypeErrors
        if (error.name === 'TypeError' && error.message.toLowerCase().includes('fetch')) {
            console.error('❌ El servidor Express en Linux no responde. ¿Está corriendo pnpm dev?');
            throw new Error('Servidor fuera de línea.');
        }
        
        // Si no es el error que buscamos, lanzamos el error original tipado
        throw error;
    }

    // 2. Si el error no es una instancia de Error (un string o null), 
    // lo convertimos en uno para mantener la consistencia al lanzar
    throw new Error(String(error));
}  
}