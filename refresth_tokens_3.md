# ⚡️ Próximo Nivel: Integrar Refresh Tokens (Mejora de UX)
Actualmente, las sesiones de tus usuarios caducan cuando el JWT expira (generalmente después de una hora). Esto obliga a los usuarios a volver a iniciar sesión.

Para evitar esto, puedes usar el refresh_token de Supabase:

1. Backend Express: Crea un nuevo endpoint (ej., /auth/refresh-session).

2. Frontend Next.js: Implementa un temporizador que, justo antes de que el JWT expire, llame al endpoint de Express.

3. Renovación Segura: El endpoint de Express llama a Supabase con el refresh token para obtener un nuevo JWT, que se intercambia nuevamente por una nueva HttpOnly cookie.

Esto mantiene a los usuarios logueados de forma indefinida sin comprometer la seguridad.
__
¡Absolutamente! Continuar con la Gestión de Sesiones (Refresh Tokens) es el paso crucial para mejorar la experiencia del usuario y hacer tu aplicación más robusta.

Este proceso requiere cambios en tres lugares:

1. **Backend Express:** Crear el nuevo endpoint /auth/refresh-session.

2. **Frontend Next.js:** Crear un temporizador que dispare la renovación antes de que expire el token.

3. **Cookies:** Asegurar que el refresh token se almacene de forma segura.
__
## 🛠️ Paso 1: Configuración en el Backend (Express)
Necesitas modificar tu servicio de autenticación (authService.js) para manejar la renovación y luego crear el endpoint que el frontend llamará.

### 1.1. Modificar authService.js (Añadir refreshAuthToken)
Abre backend/src/services/authService.js y añade la nueva función que utilizará el cliente de Supabase para renovar la sesión.
```
// ./src/services/authService.js

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const jwt = require('jsonwebtoken');

// 1. Inicialización de Supabase con clave de SERVICIO
// Usamos la Service Role Key para tener acceso de alto nivel para verificar tokens.
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_KEY
);

// Clave Secreta para verificar los tokens emitidos por Supabase
const SUPABASE_JWT_SECRET = process.env.SUPABASE_JWT_SECRET;

// Tiempo de expiración de la cookie (1 hora en ms, debe coincidir con el token de Supabase)
const COOKIE_MAX_AGE = 60 * 60 * 1000; 

/**
 * Verifica si un JWT es válido y obtiene los datos del usuario.
 * @param {string} token - El JWT de Supabase.
 * @returns {object} Los datos del payload del token si es válido.
 */
async function verifySupabaseToken(token) {
    if (!token) {
        throw new Error("No se proporcionó token.");
    }
    
    try {
        // Usamos jsonwebtoken para verificar la firma del token con la clave secreta de Supabase.
        const decoded = jwt.verify(token, SUPABASE_JWT_SECRET);
        
        // Opcional: Podrías hacer una verificación adicional llamando a Supabase aquí 
        // para asegurar que el usuario aún existe, pero verificar la firma ya es muy fuerte.
        
        return decoded;
    } catch (error) {
        // Token inválido o expirado
        throw new Error("Token inválido o expirado.");
    }
}

/**
 * Establece el token como una HttpOnly Cookie en la respuesta.
 * @param {object} res - Objeto de respuesta de Express.
 * @param {string} token - El JWT a establecer.
 */
function setAuthCookie(res, token) {
    res.cookie('authToken', token, {
        httpOnly: true,
        // En producción, debe ser 'true'. Aquí lo ajustamos según el entorno si es necesario.
        secure: process.env.NODE_ENV === 'production', 
        sameSite: 'strict',
        maxAge: COOKIE_MAX_AGE,
    });
}

/**
 * Elimina la HttpOnly Cookie de la respuesta.
 * @param {object} res - Objeto de respuesta de Express.
 */
function clearAuthCookie(res) {
    res.cookie('authToken', '', {
        httpOnly: true,
        expires: new Date(0), // Expira inmediatamente
        sameSite: 'strict',
    });
}

/**
 * Utiliza el refresh token almacenado en la cookie para obtener un nuevo par (access_token, refresh_token).
 * @param {string} refreshToken - El token de refresco del usuario.
 * @returns {object} El objeto de sesión renovado.
 */
async function refreshAuthToken(refreshToken) {
    if (!refreshToken) {
        throw new Error("No se proporcionó el Refresh Token.");
    }
    
    // Llamada directa a Supabase para renovar la sesión
    const { data, error } = await supabase.auth.setSession({ refresh_token: refreshToken });

    if (error) {
        throw error;
    }

    if (!data.session) {
        throw new Error("Respuesta de sesión vacía de Supabase.");
    }

    return data.session;
}

module.exports = {
    verifySupabaseToken,
    setAuthCookie,
    clearAuthCookie,
    refreshAuthToken,
    supabase // Exportamos el cliente Supabase para otras interacciones si es necesario
};
```
### 1.2. Modificar authRoutes.js (Crear la Ruta de Renovación)
Abre backend/src/routes/authRoutes.js y añade una nueva ruta. Esta ruta es crítica: debe leer el refresh token de una cookie separada, renovar el JWT y **actualizar ambas cookies.**

**Recomendación de Seguridad:** Para manejar el refresh_token de forma segura, vamos a almacenarlo en una cookie **separada** y también HttpOnly.

- **Cookie 1 (Sesión):** authToken (Contiene el JWT, caduca pronto).

- **Cookie 2 (Renovación):** refreshToken (Contiene el Refresh Token, caduca a largo plazo).

**Asegúrate de que tus funciones** setAuthCookie y clearAuthCookie **puedan manejar el** refreshToken **también.**
```
// backend/src/routes/authRoutes.js (Añade esta nueva ruta al final)

// 5. RUTA DE RENOVACIÓN DE SESIÓN
// Usa el refresh token para obtener un nuevo JWT sin que el usuario inicie sesión de nuevo.
router.post('/refresh-session', async (req, res) => {
    // 1. Obtener el Refresh Token de la cookie
    const refreshToken = req.cookies.refreshToken; 
    
    if (!refreshToken) {
        // Si no hay refresh token, la sesión ha expirado completamente
        return res.status(401).json({ message: 'No se encontró el token de refresco. Por favor, inicie sesión.' });
    }

    try {
        // 2. Renovar la sesión con Supabase
        const newSession = await authService.refreshAuthToken(refreshToken);
        
        // 3. Establecer las nuevas HttpOnly Cookies (JWT y Refresh Token)
        authService.setAuthCookie(res, newSession.access_token, 'authToken');
        authService.setAuthCookie(res, newSession.refresh_token, 'refreshToken'); // ¡Importante!

        res.json({ message: "Sesión renovada exitosamente." });
    } catch (error) {
        console.error('Error al renovar el token:', error.message);
        
        // 4. Limpiar cookies si la renovación falla (refresh token expirado o inválido)
        authService.clearAuthCookie(res, 'authToken');
        authService.clearAuthCookie(res, 'refreshToken');
        
        return res.status(401).json({ message: 'Sesión expirada. Vuelva a iniciar sesión.' });
    }
});
```
Nota Importante: Para que el código anterior funcione, tu authService.js debe manejar el nombre de la cookie y tu flujo de set-cookie (ruta 1) debe también almacenar el refresh_token en la primera sesión.
________
## 🛠️ Paso 2: Almacenar el Refresh Token Inicial (Ajuste en la Ruta 1)
Cuando el usuario inicia sesión por primera vez, Supabase devuelve el access_token y el refresh_token. Debemos capturar ambos.

**Ajuste 1: Modificar** authService.js **para aceptar el nombre de la cookie**

Necesitas modificar tu setAuthCookie para que acepte el nombre de la cookie a establecer.
```
// backend/src/services/authService.js (Ajuste en setAuthCookie)

function setAuthCookie(res, token, name = 'authToken') { // Acepta el nombre de la cookie
    // ... (Tu implementación de la cookie HttpOnly)
    res.cookie(name, token, {
        httpOnly: true,
        // ... (Otras opciones como secure y expiry)
    });
}
```
**Ajuste 2: Modificar** authRoutes.js **(Ruta 1) para guardar el Refresh Token**

Cuando el frontend llama a /set-cookie, debe enviar **ambos tokens** si es un login fresco.
```
// backend/src/routes/authRoutes.js (Ruta 1, CORREGIDA para recibir refresh_token)

// 1. RUTA DE INTERCAMBIO DE TOKEN (CRÍTICA)
router.post("/set-cookie", async (req, res) => {
    const { access_token, refresh_token } = req.body; // <-- Recibe ambos tokens

    if (!access_token || !refresh_token) {
        return res.status(400).json({ message: "Tokens requeridos." });
    }

    try {
        // ... (Verificar el access_token)

        // Establecer HttpOnly Cookies (¡Ambas!)
        authService.setAuthCookie(res, access_token, 'authToken');
        authService.setAuthCookie(res, refresh_token, 'refreshToken'); // <-- Guardar el refresh token

        res.json({ message: "Cookies de sesión establecidas correctamente." });
    } catch (error) {
        // ...
    }
});
```
_______
## ⚛️ Paso 3: Implementación en el Frontend (Next.js)
Ahora, en el frontend, debes:

1. **Capturar ambos tokens** después del login.

2. **Llamar a** /auth/set-cookie con ambos tokens.

### 3.1. Modificar AuthForm.js (Capturar y Enviar Ambos Tokens)
Cuando el login/registro es exitoso, debes obtener ambos tokens de authResponse.data.session.
```
// frontend/src/components/AuthForm.js (Segmento de handleSubmit CORREGIDO)

// ...

// Dentro de handleSubmit después del éxito de authResponse:
// 2. Extraer ambos tokens
const accessToken = authResponse.data.session?.access_token;
const refreshToken = authResponse.data.session?.refresh_token; // <-- ¡NUEVO!

if (accessToken && refreshToken) {
    // 3. ¡CRÍTICO!: Intercambio de Tokens con Express
    await fetchApi('/auth/set-cookie', {
        method: 'POST',
        // ¡Ahora enviamos AMBOS TOKENS!
        body: { 
            access_token: accessToken,
            refresh_token: refreshToken 
        } 
    });
    
    // 4. Redirigir al dashboard
    router.push('/dashboard');
}

// ...
```
### 3.2. Implementar el Temporizador de Renovación
Crea un hook o un componente que se ejecute en el dashboard para renovar la sesión periódicamente.
```
// frontend/src/hooks/useSessionRefresher.js (Archivo nuevo)
"use client";

import { useEffect } from 'react';
import { fetchApi } from '@/utils/api'; 
import { useRouter } from 'next/navigation';

const REFRESH_INTERVAL_MS = 5 * 60 * 1000; // Renovar cada 5 minutos (300,000 ms)

export function useSessionRefresher() {
    const router = useRouter();

    useEffect(() => {
        const refreshSession = async () => {
            try {
                // Llamar al nuevo endpoint de Express
                const response = await fetchApi('/auth/refresh-session', {
                    method: 'POST',
                    // No necesita body, Express lee el refreshToken de la cookie
                });
                
                if (response.message) {
                    console.log('Sesión renovada:', response.message);
                }

            } catch (error) {
                console.error('Renovación de sesión fallida:', error.message);
                
                // Si el refresh token falla (401), forzamos el logout.
                router.push('/'); 
            }
        };

        // Iniciar el temporizador
        const intervalId = setInterval(refreshSession, REFRESH_INTERVAL_MS);

        // Limpiar el temporizador al desmontar el componente
        return () => clearInterval(intervalId);
    }, [router]);
}
```