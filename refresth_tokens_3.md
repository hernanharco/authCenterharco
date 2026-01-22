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
//src/services/authService.js
require("dotenv").config();
const { createClient } = require("@supabase/supabase-js");
const jwt = require("jsonwebtoken");

// 1. Inicialización de Supabase con clave de SERVICIO
// Usamos la Service Role Key (SUPABASE_KEY) para tener acceso de alto nivel para verificar tokens.
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// Clave Secreta para verificar los tokens emitidos por Supabase
const SUPABASE_JWT_SECRET = process.env.SUPABASE_JWT_SECRET;

// Tiempos de expiración en milisegundos
const ACCESS_TOKEN_MAX_AGE = 60 * 60 * 1000; // 1 hora
const REFRESH_TOKEN_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 días (o lo que configure Supabase)

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
 * @param {string} name - Nombre de la cookie ('authToken' o 'refreshToken').
 */
function setAuthCookie(res, token, name = "authToken") {
  let maxAge = ACCESS_TOKEN_MAX_AGE;

  // CRÍTICO: El refresh token debe durar más que el access token
  if (name === "refreshToken") {
    maxAge = REFRESH_TOKEN_MAX_AGE;
  }

  res.cookie(name, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: maxAge, // Usa la duración definida
  });
}

/**
 * Elimina ambas HttpOnly Cookies de la respuesta.
 * @param {object} res - Objeto de respuesta de Express.
 */
function clearAuthCookie(res) {
  const expiredOptions = {
    httpOnly: true,
    expires: new Date(0), // Expira inmediatamente
    sameSite: "strict",
  };

  // CRÍTICO: Eliminar el access token
  res.cookie("authToken", "", expiredOptions);

  // CRÍTICO: Eliminar el refresh token
  res.cookie("refreshToken", "", expiredOptions);
}

/**
 * Utiliza el refresh token almacenado en la cookie para obtener un nuevo par (access_token, refresh_token).
 * @param {string} refreshToken - El token de refresco del usuario.
 * @returns {object} El objeto de sesión renovado.
 */
async function refreshAuthToken(refreshToken) {
  if (!refreshToken) {
    throw new Error("No se proporcionó el Refresh Token.");
  } // Llamada directa a Supabase para renovar la sesión
  const { data, error } = await supabase.auth.setSession({
    refresh_token: refreshToken,
  });

  if (error) {
    throw error;
  }

  if (!data.session) {
    throw new Error("Respuesta de sesión vacía de Supabase.");
  }

  return data.session;
}

/**
 * Consulta la tabla de roles para obtener el rol real del usuario.
 * Nota: Si el rol está en auth.users, se debe consultar la tabla 'users'
 * Si el rol está en public.profiles, se debe consultar 'profiles'
 * * Basado en tu UPDATE a auth.users, consultaremos la tabla 'users' del esquema 'auth'.
 * @param {string} userId - El UUID del usuario (obtenido del JWT payload).
 * @returns {string} El rol del usuario ('admin', 'authenticated', etc.).
 */
async function getUserRole(userId) {
  if (!userId) {
    return "unauthenticated";
  } // Consulta CRÍTICA a la tabla 'users' del esquema 'auth' (solo posible con Service Key)

  const { data, error } = await supabase
    .from("users")
    .select("role") // Asume que el campo 'role' existe en auth.users
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    console.error("Error al consultar el rol en auth.users:", error);
    return "authenticated";
  } // Devuelve el rol encontrado o 'authenticated' si no hay coincidencia

  return data && data.role ? data.role : "authenticated";
}

module.exports = {
  verifySupabaseToken,
  setAuthCookie,
  clearAuthCookie,
  refreshAuthToken,
  getUserRole,
  supabase,
};
```
### 1.2. Modificar authRoutes.js (Crear la Ruta de Renovación)
Abre backend/src/routes/authRoutes.js y añade una nueva ruta. Esta ruta es crítica: debe leer el refresh token de una cookie separada, renovar el JWT y **actualizar ambas cookies.**

**Recomendación de Seguridad:** Para manejar el refresh_token de forma segura, vamos a almacenarlo en una cookie **separada** y también HttpOnly.

- **Cookie 1 (Sesión):** authToken (Contiene el JWT, caduca pronto).

- **Cookie 2 (Renovación):** refreshToken (Contiene el Refresh Token, caduca a largo plazo).

**Asegúrate de que tus funciones** setAuthCookie y clearAuthCookie **puedan manejar el** refreshToken **también.**
```
//backend/src/routes/authRoutes.js
const express = require("express");
const router = express.Router();
const authService = require("../services/authService");
const { authenticateToken, hasRole } = require("../middleware/authMiddleware");

// 1. RUTA DE INTERCAMBIO DE TOKEN (CRÍTICA)
router.post("/set-cookie", async (req, res) => {
  const { access_token, refresh_token } = req.body;

  if (!access_token || !refresh_token) {
    return res
      .status(400)
      .json({ message: "Tokens (access_token y refresh_token) requeridos." });
  }

  try {
    // 1. Verificar el access_token antes de establecerlo
    await authService.verifySupabaseToken(access_token); // 2. Establecer HttpOnly Cookies (¡Ambas!)

    authService.setAuthCookie(res, access_token, "authToken");
    authService.setAuthCookie(res, refresh_token, "refreshToken");

    res.json({ message: "Cookie de sesión establecida correctamente." });
  } catch (error) {
    console.error("Error en set-cookie:", error.message);
    res
      .status(401)
      .json({ message: "Token inválido o error al establecer la cookie." });
  }
});

// 2. RUTA DE LOGOUT
router.post("/logout", async (req, res) => {
  // 1. Limpiar AMBAS cookies (authToken y refreshToken)
  authService.clearAuthCookie(res);

  res.json({ message: "Sesión cerrada exitosamente." });
});

// 3. RUTA PROTEGIDA (ejemplo /perfil)
router.get("/perfil", authenticateToken, (req, res) => {
  // req.user ya contiene el rol, id y email adjuntados por authenticateToken
  const userRole = req.user.role || "default_user";
  const userId = req.user.id;
  const userEmail = req.user.email;

  res.json({
    message: "¡Acceso Concedido a la información privada!",
    userData: {
      id: userId,
      email: userEmail,
      role: userRole,
    },
  });
});

// 4. RUTA PROTEGIDA POR ROL (Solo para 'admin')
router.get("/admin-data", authenticateToken, hasRole("admin"), (req, res) => {
  res.json({
    message: "¡Acceso Concedido! Eres un administrador.",
    secretData: "Datos confidenciales del administrador.",
  });
});

// 5. RUTA DE RENOVACIÓN DE SESIÓN
router.post("/refresh-session", async (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken) {
    return res.status(401).json({
      message: "No se encontró el token de refresco. Por favor, inicie sesión.",
    });
  }

  try {
    // 1. Renovar la sesión con Supabase
    const newSession = await authService.refreshAuthToken(refreshToken); // 2. Establecer las nuevas HttpOnly Cookies (JWT y Refresh Token)

    authService.setAuthCookie(res, newSession.access_token, "authToken");
    authService.setAuthCookie(res, newSession.refresh_token, "refreshToken");

    res.json({ message: "Sesión renovada exitosamente." });
  } catch (error) {
    console.error("Error al renovar el token:", error.message); // 3. Limpiar AMBAS cookies si la renovación falla
    authService.clearAuthCookie(res);
    return res
      .status(401)
      .json({ message: "Sesión expirada. Vuelva a iniciar sesión." });
  }
});

module.exports = router;

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
_____________
# Clases para tener encuenta ya que estaba sacando un error
```
///backend/src/middleware/authMiddleware.js

const authService = require('../services/authService');

const authenticateToken = async (req, res, next) => {
    const authToken = req.cookies.authToken; 

    if (!authToken) {
        return res.status(401).json({ message: 'No autenticado. Cookie de sesión faltante.' });
    }

    try {
        // 1. Verificar el JWT (obtiene el payload)
        const userPayload = await authService.verifySupabaseToken(authToken); 
        
        // El ID del usuario en Supabase JWT es 'sub'
        const userId = userPayload.sub; 

        // 2. CRÍTICO: Buscar el rol en la base de datos (Opción 1)
        const userRole = await authService.getUserRole(userId); 
        
        // 3. Adjuntar el payload COMPLETO con el rol VERDADERO a req.user
        req.user = {
            id: userId,
            email: userPayload.email,
            role: userRole, // ¡ESTE es el rol que usará hasRole!
            // ... otros datos del payload si los necesitas
        };
        
        next();

    } catch (error) {
        console.error("Fallo de verificación/Rol:", error.message);
        
        // Si el JWT es inválido/expirado, devolvemos 401 para que el frontend intente renovar
        return res.status(401).json({ message: 'Token de sesión inválido o expirado.' });
    }
};

const hasRole = (requiredRole) => (req, res, next) => {
    // Esta función ahora solo necesita leer req.user.role
    const userRole = req.user?.role;
    
    if (!userRole) {
        // Esto solo pasaría si authenticateToken no se ejecutó, lo cual no debería ocurrir aquí
        return res.status(403).json({ message: 'Acceso denegado. Rol de usuario no encontrado.' });
    }

    if (userRole === requiredRole) {
        return next();
    }
    
    // Si el rol no coincide
    return res.status(403).json({ 
        message: `Acceso denegado. Se requiere el rol '${requiredRole}'. Tu rol es '${userRole}'.` 
    });
};

module.exports = { authenticateToken, hasRole };
```

```
// Este es un ejemplo. Si tu archivo principal se llama app.js, úsalo.
//backend/server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser'); // NECESARIO
const authRoutes = require('./src/routes/authRoutes');

const app = express();
const PORT = process.env.PORT || 3000;
const FRONTEND_URL = process.env.NEXT_PUBLIC_FRONTEND_URL; // Usar la URL del frontend (e.g., http://localhost:3001)

// --- CRÍTICO: CONFIGURACIÓN CORS PARA PERMITIR COOKIES ---
app.use(cors({
    origin: FRONTEND_URL, // Permite el origen de tu frontend
    credentials: true, // ¡ESTO ES CRÍTICO! Permite el intercambio de HttpOnly Cookies
}));

// Middleware para parsear el body de las peticiones JSON
app.use(express.json());

// --- CRÍTICO: HABILITAR EL PARSEO DE COOKIES ---
app.use(cookieParser());

// Rutas de autenticación
app.use('/auth', authRoutes);

// Ruta de prueba
app.get('/', (req, res) => {
    res.send('Servidor de autenticación Express OK.');
});

app.listen(PORT, () => {
    console.log(`Express server running on port ${PORT}`);
    console.log(`CORS habilitado para: ${FRONTEND_URL}`);
});
```

## Unas de la cosas mas importante el frontend debe de llamar los dos tokens
```
//frontend/src/app/auth/callback/page.js
'use client'; 

import { useEffect, useState } from 'react';
import { supabase } from '@/utils/supabase'; // Importa tu cliente de Supabase
import { fetchApi } from '@/utils/api'; 
import { useRouter } from 'next/navigation';

export default function AuthCallbackPage() {
    const router = useRouter();
    const [status, setStatus] = useState("Procesando autenticación...");

    useEffect(() => {
        const handleOAuthToken = async () => {
            setStatus("Obteniendo sesión de Supabase...");
            
            // 1. Obtener la sesión actual de Supabase (el token está en el hash de la URL)
            const { data: { session }, error } = await supabase.auth.getSession();

            // Verificar si la sesión y los tokens existen
            // CRÍTICO: Necesitamos ambos tokens para el backend de Express.
            if (error || !session?.access_token || !session?.refresh_token) {
                console.error("No se pudo obtener la sesión de Supabase o faltan tokens:", error || "Tokens faltantes");
                setStatus("Fallo en la autenticación. Redirigiendo...");
                router.push('/'); // Redirigir a Home/Login si falla
                return;
            }
            
            // 2. Extraemos ambos tokens para el intercambio
            const accessToken = session.access_token;
            const refreshToken = session.refresh_token;

            try {
                setStatus("Intercambiando tokens con Express...");
                
                // 3. Intercambio de Tokens con Express
                // Envía AMBOS TOKENS a Express, ya que son requeridos por tu ruta /auth/set-cookie
                await fetchApi('/auth/set-cookie', {
                    method: 'POST',
                    body: { 
                        access_token: accessToken, 
                        refresh_token: refreshToken 
                    }
                });

                // 4. Éxito: Redirección final al Dashboard
                setStatus("Éxito. Redirigiendo al Dashboard...");
                router.push('/dashboard');
                
            } catch (exchangeError) {
                console.error("Error al canjear token con Express:", exchangeError);
                // Si el backend falla, limpiamos la sesión del cliente y redirigimos
                await supabase.auth.signOut(); 
                setStatus(`Error: ${exchangeError.message}. Redirigiendo...`);
                router.push('/'); 
            }
        };
        
        handleOAuthToken();
        
    }, [router]);

    return (
        <div style={{ 
            padding: '40px', 
            textAlign: 'center', 
            backgroundColor: '#f9f9f9', 
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center'
        }}>
            <h1 style={{ color: '#0070f3', marginBottom: '10px' }}>🚀 OAuth en curso</h1>
            <p style={{ color: '#333' }}>{status}</p>
            <p style={{ marginTop: '20px', fontSize: 'small', color: '#666' }}>No cierres esta ventana.</p>
        </div>
    );
}
```

