"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authService_1 = require("@/services/authService");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = (0, express_1.Router)();
/**
 * RUTA: POST /api/set-cookie
 * Objetivo: Recibir los tokens del AuthCenter (puerto 3000) y transformarlos en cookies seguras.
 */
router.post('/set-cookie', async (req, res) => {
    const { access_token, refresh_token } = req.body;
    if (!access_token || !refresh_token) {
        return res.status(400).json({ message: 'Se requieren tokens de acceso y refresco.' });
    }
    try {
        // 1. Validamos que el token de Supabase sea real
        const user = await (0, authService_1.verifySupabaseToken)(access_token);
        // 2. Si es válido, guardamos las cookies HttpOnly en el navegador
        (0, authService_1.setAuthCookie)(res, access_token, 'authToken');
        (0, authService_1.setAuthCookie)(res, refresh_token, 'refreshToken');
        // 3. Respondemos éxito
        res.json({
            success: true,
            message: 'Sesión sincronizada con éxito.',
            user: { email: user.email }
        });
    }
    catch (error) {
        res.status(401).json({ message: "Error de autenticación", error: error.message });
    }
});
/**
 * RUTA: GET /api/perfil
 * Objetivo: Utilizada por la Web-Tapicería (puerto 9002) para saber quién está logueado.
 */
router.get('/perfil', authMiddleware_1.verifySession, (req, res) => {
    // Si verifySession pasó, tenemos los datos en req.user
    res.json({
        success: true,
        user: {
            name: req.user.user_metadata?.full_name || req.user.email,
            email: req.user.email,
            role: req.user.role
        }
    });
});
/**
 * RUTA: POST /api/logout
 * Objetivo: Borrar las cookies y cerrar la sesión por completo.
 */
router.post('/logout', (req, res) => {
    (0, authService_1.clearAuthCookies)(res);
    res.json({ success: true, message: 'Sesión cerrada correctamente.' });
});
/**
 * RUTA: GET /api/admin/all-users
 * Objetivo: Listar todos los usuarios. Solo para Administradores.
 */
router.get('/admin/all-users', authMiddleware_1.verifySession, (0, authMiddleware_1.hasRole)('Admin'), async (req, res) => {
    try {
        const users = await (0, authService_1.getAllUsersFromAuth)();
        res.json({ success: true, data: users });
    }
    catch (error) {
        res.status(500).json({ success: false, error: "Error al obtener la lista de usuarios." });
    }
});
exports.default = router;
