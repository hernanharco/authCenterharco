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