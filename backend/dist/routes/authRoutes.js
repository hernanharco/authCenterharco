"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authService_1 = require("../services/authService");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = (0, express_1.Router)();
/* =================================================
   1. AUTENTICACIÓN Y COOKIES
================================================= */
router.post('/set-cookie', async (req, res) => {
    // 1. Extraemos los tokens (refresh_token ahora es opcional)
    const { access_token, refresh_token } = req.body;
    console.log("\n🔄 === SINCRONIZANDO TOKEN EN RENDER ===");
    if (!access_token) {
        return res.status(400).json({ success: false, message: 'Access token requerido.' });
    }
    try {
        // 2. Validar el token con Supabase
        const user = await (0, authService_1.verifySupabaseToken)(access_token);
        console.log("✅ Token validado para:", user.email);
        // 3. CREAR LAS COOKIES (Aquí es donde ocurre la magia)
        // Pasamos el objeto 'res' para que setAuthCookie pueda inyectar el header
        (0, authService_1.setAuthCookie)(res, access_token, 'authToken');
        // Solo si el frontend nos mandó refresh_token, creamos esa cookie
        if (refresh_token) {
            (0, authService_1.setAuthCookie)(res, refresh_token, 'refreshToken');
        }
        return res.json({
            success: true,
            message: 'Sesión sincronizada y cookies creadas',
            user: { email: user.email }
        });
    }
    catch (error) {
        console.error("❌ Error en sincronización:", error.message);
        return res.status(401).json({ success: false, message: 'Token inválido' });
    }
});
/* =================================================
   2. GESTIÓN DE PERFILES (Dashboard)
================================================= */
// GET /api/profiles - Listado de usuarios para la tabla
router.get('/profiles', authMiddleware_1.verifySession, (0, authMiddleware_1.hasRole)('Admin'), async (req, res) => {
    try {
        const isCountOnly = req.query.count === 'true';
        if (isCountOnly) {
            const { count, error } = await authService_1.supabase.from('users').select('*', { count: 'exact', head: true });
            if (error)
                throw error;
            return res.json({ success: true, total: count || 0 });
        }
        const { data: profiles, error } = await authService_1.supabase
            .from('users')
            .select('id, email, role, updated_at')
            .order('updated_at', { ascending: false });
        if (error)
            throw error;
        res.json({ success: true, profiles: profiles || [] });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Error en base de datos', error: error });
    }
});
// PATCH /api/profiles/:id/role - Actualización de rango con jerarquía
router.patch('/profiles/:id/role', authMiddleware_1.verifySession, (0, authMiddleware_1.hasRole)('Admin'), async (req, res) => {
    const { id } = req.params;
    const { role } = req.body;
    const executorRole = req.user.role;
    try {
        // Protección de jerarquía: Un Admin no puede crear SuperAdmins/Owners
        if ((role === 'SuperAdmin' || role === 'Owner') && executorRole === 'Admin') {
            return res.status(403).json({ success: false, message: "No puedes asignar un rango superior al tuyo." });
        }
        await (0, authService_1.updateUserRole)(id, role);
        res.json({ success: true, message: 'Rol actualizado en todo el sistema' });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error });
    }
});
// DELETE /api/profiles/:id - Eliminación completa
router.delete('/profiles/:id', authMiddleware_1.verifySession, (0, authMiddleware_1.hasRole)('Admin'), async (req, res) => {
    const { id } = req.params;
    const executorRole = req.user.role;
    try {
        const { data: targetUser } = await authService_1.supabase.from('users').select('role').eq('id', id).single();
        if (targetUser && (targetUser.role === 'Owner' || targetUser.role === 'SuperAdmin')) {
            if (executorRole === 'Admin') {
                return res.status(403).json({ message: "No puedes borrar a un superior." });
            }
        }
        // Borramos de la tabla pública
        await authService_1.supabase.from('users').delete().eq('id', id);
        // Borramos de Auth usando el cliente Admin
        await authService_1.supabaseAdmin.auth.admin.deleteUser(id);
        res.json({ success: true, message: 'Usuario eliminado permanentemente' });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error });
    }
});
/* =================================================
   3. INFORMACIÓN DE USUARIO Y AUDITORÍA
================================================= */
router.get('/perfil', authMiddleware_1.verifySession, (req, res) => {
    res.json({ success: true, user: req.user });
});
/* =================================================
   4. TODOS LOS CLIENTES DE SUPABASE
================================================= */
router.get('/admin/all-users', authMiddleware_1.verifySession, (0, authMiddleware_1.hasRole)('Admin'), async (req, res) => {
    try {
        const users = await (0, authService_1.getAllUsersFromAuth)();
        res.json({ success: true, data: users });
    }
    catch (error) {
        res.status(500).json({ success: false, error: "Error al obtener usuarios de Auth" });
    }
});
/* =================================================
   5. CERRAR SESIÓN (LOGOUT)
================================================= */
// El frontend llama a /api/logout (asumiendo que el prefijo en app.ts es /api)
router.post('/logout', (req, res) => {
    try {
        console.log("🔐 Cerrando sesión y limpiando cookies...");
        // Función que ya tienes importada para limpiar cookies del navegador
        (0, authService_1.clearAuthCookies)(res);
        return res.json({
            success: true,
            message: 'Sesión cerrada correctamente en el servidor'
        });
    }
    catch (error) {
        console.error("❌ Error en logout:", error);
        return res.status(500).json({
            success: false,
            message: 'Error al cerrar sesión'
        });
    }
});
exports.default = router;
