"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.hasRole = exports.verifySession = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const permissionTypes_1 = require("@/types/permissionTypes");
/**
 * MIDDLEWARE: verifySession
 * Este es el primer filtro. Revisa si existe la cookie 'authToken'
 * y si es un token legítimo emitido por Supabase.
 */
const verifySession = (req, res, next) => {
    // Intentamos leer la cookie que configuramos en el servicio de auth
    const token = req.cookies.authToken;
    // Si no hay token, cortamos la petición con un 401 (No autorizado)
    if (!token) {
        return res.status(401).json({
            success: false,
            message: "No autorizado: No se encontró una sesión activa."
        });
    }
    try {
        /**
         * Verificamos la firma del JWT.
         * Usamos el SUPABASE_JWT_SECRET para asegurarnos de que el token no haya sido manipulado.
         */
        const decoded = jsonwebtoken_1.default.verify(token, process.env.SUPABASE_JWT_SECRET);
        /**
         * Inyectamos el usuario en el objeto 'req'.
         * Esto permite que las siguientes funciones (como hasRole) sepan quién hace la petición.
         */
        req.user = {
            id: decoded.sub,
            email: decoded.email,
            // Buscamos el rol en app_metadata (donde Supabase suele guardar roles de admin)
            role: decoded.app_metadata?.role || decoded.user_metadata?.role || 'Viewer',
            user_metadata: decoded.user_metadata
        };
        // Todo correcto, pasamos al siguiente middleware o ruta
        next();
    }
    catch (error) {
        console.error("❌ [AuthMiddleware] Error al validar el token:", error);
        return res.status(401).json({
            success: false,
            message: "Sesión inválida o expirada. Por favor, inicia sesión de nuevo."
        });
    }
};
exports.verifySession = verifySession;
/**
 * MIDDLEWARE: hasRole
 * Segundo filtro opcional. Se usa para rutas que requieren un permiso específico.
 * @param roleRequerido Ejemplo: 'Admin', 'SuperAdmin', 'Owner'
 */
const hasRole = (roleRequerido) => {
    return (req, res, next) => {
        // Seguridad extra: verificamos que verifySession se haya ejecutado antes
        if (!req.user) {
            return res.status(401).json({ success: false, message: "Usuario no identificado." });
        }
        /**
         * Utilizamos tu lógica de jerarquía (checkLevel).
         * Si el rol del usuario tiene un nivel igual o superior al requerido, le dejamos pasar.
         */
        if ((0, permissionTypes_1.checkLevel)(req.user.role, roleRequerido)) {
            return next();
        }
        // Si el nivel es insuficiente, devolvemos un 403 (Prohibido)
        res.status(403).json({
            success: false,
            message: `Acceso denegado. Tu nivel (${req.user.role}) no es suficiente para esta acción (Se requiere: ${roleRequerido}).`
        });
    };
};
exports.hasRole = hasRole;
