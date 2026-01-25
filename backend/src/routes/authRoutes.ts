import { Router, Request, Response } from 'express';
import {
  verifySupabaseToken,
  setAuthCookie,
  clearAuthCookies,
  getAllUsersFromAuth,
  updateUserRole, // Importante añadir esta
  supabase,
  supabaseAdmin, // Necesario para el DELETE  
} from '../services/authService';
import { verifySession, hasRole } from '../middleware/authMiddleware';

const router = Router();

/* =================================================
   1. AUTENTICACIÓN Y COOKIES
================================================= */

// Reemplaza el endpoint /set-cookie

router.post('/set-cookie', async (req: Request, res: Response) => {
  const access_token = req.body?.access_token;

  console.log("\n🔄 === SINCRONIZANDO TOKEN ===");
  console.log("Access Token presente:", !!access_token);

  if (!access_token) {
    return res.status(400).json({
      success: false,
      message: 'Access token requerido.'
    });
  }

  // Validación del Access Token (debe ser JWT)
  const isValidJWT = (token: string) => token.split('.').length === 3;

  if (!isValidJWT(access_token)) {
    console.error("❌ Access token NO es un JWT válido");
    return res.status(400).json({
      success: false,
      message: 'Access token inválido (no es JWT)'
    });
  }

  try {
    // Validar el access token
    const payload = await verifySupabaseToken(access_token);

    console.log("✅ Access token validado para:", payload.email);

    // ✅ SOLUCIÓN: Solo establecemos el access token como cookie
    // La cookie tendrá una duración de 1 hora (igual que el token)
    setAuthCookie(res, access_token, 'authToken');

    console.log("✅ Cookie de sesión actualizada");
    console.log("⏰ Próxima renovación automática en ~50 minutos");
    console.log("=================================\n");

    return res.json({
      success: true,
      message: 'Sesión sincronizada',
      email: payload.email,
      role: payload.role
    });
  } catch (error: unknown) {
    console.error("❌ Error al validar access token:", error);
    return res.status(401).json({
      success: false,
      message: 'Access token inválido',
      details: error
    });
  }
});

/* =================================================
   2. GESTIÓN DE PERFILES (Dashboard)
================================================= */
// GET /api/profiles - Listado de usuarios para la tabla
router.get('/profiles', verifySession, hasRole('Admin'), async (req: any, res: Response) => {
  try {
    const isCountOnly = req.query.count === 'true';

    if (isCountOnly) {
      const { count, error } = await supabase.from('users').select('*', { count: 'exact', head: true });
      if (error) throw error;
      return res.json({ success: true, total: count || 0 });
    }

    const { data: profiles, error } = await supabase
      .from('users')
      .select('id, email, role, updated_at')
      .order('updated_at', { ascending: false });

    if (error) throw error;
    res.json({ success: true, profiles: profiles || [] });
  } catch (error: unknown) {
    res.status(500).json({ success: false, message: 'Error en base de datos', error: error});
  }
});

// PATCH /api/profiles/:id/role - Actualización de rango con jerarquía
router.patch('/profiles/:id/role', verifySession, hasRole('Admin'), async (req: any, res: Response) => {
  const { id } = req.params;
  const { role } = req.body;
  const executorRole = req.user.role;

  try {
    // Protección de jerarquía: Un Admin no puede crear SuperAdmins/Owners
    if ((role === 'SuperAdmin' || role === 'Owner') && executorRole === 'Admin') {
      return res.status(403).json({ success: false, message: "No puedes asignar un rango superior al tuyo." });
    }

    await updateUserRole(id, role);
    res.json({ success: true, message: 'Rol actualizado en todo el sistema' });
  } catch (error: unknown) {
    res.status(500).json({ success: false, message: error});
  }
});

// DELETE /api/profiles/:id - Eliminación completa
router.delete('/profiles/:id', verifySession, hasRole('Admin'), async (req: any, res: Response) => {
  const { id } = req.params;
  const executorRole = req.user.role;

  try {
    const { data: targetUser } = await supabase.from('users').select('role').eq('id', id).single();

    if (targetUser && (targetUser.role === 'Owner' || targetUser.role === 'SuperAdmin')) {
      if (executorRole === 'Admin') {
        return res.status(403).json({ message: "No puedes borrar a un superior." });
      }
    }

    // Borramos de la tabla pública
    await supabase.from('users').delete().eq('id', id);
    // Borramos de Auth usando el cliente Admin
    await supabaseAdmin.auth.admin.deleteUser(id);

    res.json({ success: true, message: 'Usuario eliminado permanentemente' });
  } catch (error: unknown) {
    res.status(500).json({ success: false, message: error});
  }
});

/* =================================================
   3. INFORMACIÓN DE USUARIO Y AUDITORÍA
================================================= */

router.get('/perfil', verifySession, (req: any, res: Response) => {
  res.json({ success: true, user: req.user });
});

/* =================================================
   4. TODOS LOS CLIENTES DE SUPABASE
================================================= */

router.get('/admin/all-users', verifySession, hasRole('Admin'), async (req, res) => {
  try {
    const users = await getAllUsersFromAuth();
    res.json({ success: true, data: users });
  } catch (error: unknown) {
    res.status(500).json({ success: false, error: "Error al obtener usuarios de Auth" });
  }
});

/* =================================================
   5. CERRAR SESIÓN (LOGOUT)
================================================= */

// El frontend llama a /api/logout (asumiendo que el prefijo en app.ts es /api)
router.post('/logout', (req: Request, res: Response) => {
  try {
    console.log("🔐 Cerrando sesión y limpiando cookies...");

    // Función que ya tienes importada para limpiar cookies del navegador
    clearAuthCookies(res);

    return res.json({
      success: true,
      message: 'Sesión cerrada correctamente en el servidor'
    });
  } catch (error: unknown) {
    console.error("❌ Error en logout:", error);
    return res.status(500).json({
      success: false,
      message: 'Error al cerrar sesión'
    });
  }
});

export default router;