// frontend/src/utils/api.js

/**
 * URL base del backend de Express.
 * Se asegura de eliminar barras diagonales al final para evitar // en los endpoints.
 */
const EXPRESS_URL = process.env.NEXT_PUBLIC_EXPRESS_URL?.replace(/\/$/, '') || '';

/**
 * Función genérica para hacer llamadas a la API de Express, incluyendo cookies.
 * @param {string} endpoint - La ruta del recurso (ej: '/auth/login')
 * @param {Object} options - Opciones de fetch (method, body, headers, etc.)
 */
export async function fetchApi(endpoint, options = {}) {
    
    // Aseguramos que el endpoint comience con /
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    
    const defaultOptions = {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
        // CRÍTICO: 'include' asegura que la cookie 'authToken' se envíe automáticamente.
        // Esto es esencial para que tu arquitectura multi-tenant funcione correctamente.
        credentials: 'include', 
        ...options,
    };
    
    if (options.body && typeof options.body !== 'string') {
        defaultOptions.body = JSON.stringify(options.body);
    }

    try {
        const response = await fetch(`${EXPRESS_URL}${cleanEndpoint}`, defaultOptions);

        // Manejo específico de errores de sesión
        if (response.status === 401 || response.status === 403) {
            console.warn('⚠️ Sesión expirada o no válida. Redirigiendo a login...');
            // Solo redirigir si estamos en el cliente (navegador)
            if (typeof window !== 'undefined') {
                window.location.href = '/login';
            }
            throw new Error('Sesión expirada o no válida.'); 
        }

        // Si la respuesta no es exitosa (400, 500, etc.)
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ 
                message: `Error del servidor (${response.status})` 
            }));

            // Imprimimos el error real en la consola de Linux/Navegador para debuggear
            console.error(`🔴 API Error [${response.status}] en ${cleanEndpoint}:`, errorData);

            // Lanzamos el error con el mensaje que viene del backend (ej: "missing OAuth secret")
            throw new Error(errorData.message || errorData.error || `Error ${response.status}`);
        }

        // Si todo está bien, parseamos el JSON una sola vez
        return await response.json();

    } catch (error) {
        // Captura errores de red (cuando el servidor Express está apagado)
        if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
            console.error('❌ No se pudo conectar con el servidor Express. ¿Está encendido?');
            throw new Error('No se pudo conectar con el servicio de autenticación.');
        }
        throw error;
    }
}