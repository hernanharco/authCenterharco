import { ApiResponse } from '@/types/api';

/**
 * 🎯 DETECCIÓN DE ENTORNO DINÁMICA
 * En producción (Vercel): Usamos /api/v1 para activar el Rewrite del next.config.js
 * En desarrollo: Usamos el puerto 4000 directo.
 */
export const EXPRESS_URL = process.env.NODE_ENV === 'production'
    ? '/api/v1'  
    : (process.env.NEXT_PUBLIC_EXPRESS_URL || 'http://localhost:4000/api').replace(/\/$/, '');

export async function fetchApi<T = ApiResponse>(
    endpoint: string,
    options: RequestInit = {}
): Promise<T> {
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

    const defaultOptions: RequestInit = {
        method: 'GET',
        credentials: 'include', // 🚨 OBLIGATORIO: Para que viajen las cookies HttpOnly
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...options.headers,
        },
    };

    if (options.body && typeof options.body !== 'string') {
        defaultOptions.body = JSON.stringify(options.body);
    }

    try {
        const response = await fetch(`${EXPRESS_URL}${cleanEndpoint}`, defaultOptions);

        if (response.status === 401) {
            console.warn('⚠️ Sesión expirada o inválida');
            if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
                window.location.href = '/login?reason=expired';
            }
            throw new Error('Sesión expirada');
        }

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'Error en servidor' }));
            throw new Error(errorData.message || `Error ${response.status}`);
        }

        return await response.json() as T;
    } catch (error: unknown) {
        console.error(`🔴 API Error en ${cleanEndpoint}:`, error);
        throw error;
    }
}