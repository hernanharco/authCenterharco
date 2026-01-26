"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hasRole = exports.verifySession = void 0;
const authService_1 = require("../services/authService");
const permissionTypes_1 = require("../types/permissionTypes");
/**
 * ✅ MIDDLEWARE SIMPLIFICADO
 * Solo valida el access token. Si expira, el usuario debe hacer login de nuevo.
 * Esto es más simple y seguro que intentar refresh desde el backend.
 */
const verifySession = async (req, res, next) => {
    const token = req.cookies?.authToken;
    console.log("🔍 Verificando sesión - Cookie presente:", !!token);
    if (!token) {
        return res.status(401).json({
            success: false,
            message: "No autenticado - Se requiere login",
            requiresLogin: true
        });
    }
    try {
        // Validar el token
        req.user = await (0, authService_1.verifySupabaseToken)(token);
        console.log("✅ Sesión válida para:", req.user.email);
        return next();
    }
    catch (error) {
        console.warn(`⚠️ Token inválido o expirado: ${error}`);
        return res.status(401).json({
            success: false,
            message: "Sesión expirada - Vuelve a iniciar sesión",
            requiresLogin: true
        });
    }
};
exports.verifySession = verifySession;
/**
 * MIDDLEWARE DE AUTORIZACIÓN POR ROL
 */
const hasRole = (requiredRole) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "Usuario no autenticado."
            });
        }
        if ((0, permissionTypes_1.checkLevel)(req.user.role, requiredRole)) {
            return next();
        }
        return res.status(403).json({
            success: false,
            message: `Acceso denegado. Requiere rol ${requiredRole}.`
        });
    };
};
exports.hasRole = hasRole;
