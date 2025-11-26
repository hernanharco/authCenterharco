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

module.exports = {
    verifySupabaseToken,
    setAuthCookie,
    clearAuthCookie,
    supabase // Exportamos el cliente Supabase para otras interacciones si es necesario
};