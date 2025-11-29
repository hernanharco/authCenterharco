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
