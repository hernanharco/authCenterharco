// frontend/src/utils/api.js

const EXPRESS_URL = process.env.NEXT_PUBLIC_EXPRESS_URL;

/**
 * Función genérica para hacer llamadas a la API de Express, incluyendo cookies.
 */
export async function fetchApi(endpoint, options = {}) {
    
    const defaultOptions = {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
        // CRÍTICO: 'include' asegura que la cookie 'authToken' se envíe automáticamente.
        credentials: 'include', 
        ...options,
    };
    
    if (options.body && typeof options.body !== 'string') {
        defaultOptions.body = JSON.stringify(options.body);
    }

    const response = await fetch(`${EXPRESS_URL}${endpoint}`, defaultOptions);

    if (response.status === 401 || response.status === 403) {
        // Lanza un error para que el componente lo capture y redirija
        throw new Error('Sesión expirada o no válida. Redirigiendo a login.'); 
    }

    if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Error de red/servidor' }));
        throw new Error(error.message || `Error ${response.status}`);
    }

    return response.json();
}