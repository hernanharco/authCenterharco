// ./src/middleware/authMiddleware.js

const authService = require('../services/authService');

/**
 * Middleware para proteger rutas.
 * 1. Extrae el JWT de la HttpOnly Cookie.
 * 2. Verifica la validez del token usando authService.
 * 3. Adjunta los datos del usuario a req.user si es válido.
 */
async function authenticateToken(req, res, next) {
    // 1. Obtener el token de las cookies
    const token = req.cookies.authToken; 

    if (!token) {
        return res.status(401).json({ message: 'Acceso denegado. No se proporcionó token de sesión authMiddleware.js.' });
    }

    try {
        // 2. Verificar el token usando el servicio
        const userData = await authService.verifySupabaseToken(token);

        // 3. Adjuntar datos del usuario (el payload decodificado)
        req.user = userData;
        
        // Continuar con la ruta
        next(); 
    } catch (error) {
        // Token inválido o expirado
        console.error('Error de verificación de token:', error.message);
        authService.clearAuthCookie(res); // Limpia la cookie por seguridad si falla
        return res.status(403).json({ message: 'Sesión expirada o token inválido. Por favor, inicie sesión de nuevo.' });
    }
}

module.exports = {
    authenticateToken
};