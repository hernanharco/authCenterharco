import { Router, Response } from 'express';
import {
  verifySupabaseToken,
  setAuthCookie,
  clearAuthCookies,
  getAllUsersFromAuth,
  updateUserRole,
  refreshAuthToken,
  supabase,
  supabaseAdmin,
} from '../services/authService';
import { verifySession, hasRole } from '../middleware/authMiddleware';
import { AuthRequest } from '../types/authTypes';
import { UserRole } from '../types/permissionTypes';

const router = Router();

/**
 * 🔧 RUTAS CON PARÁMETROS (DEBEN IR PRIMERO)
 */

/**
 * ACTUALIZAR ROL DE USUARIO
 */
router.patch('/profiles/:userId/role', verifySession, hasRole('Admin'), async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    if (!role || !['SuperAdmin', 'Owner', 'Admin', 'Editor', 'Viewer'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Rol inválido' });
    }

    await updateUserRole(userId as string, role as UserRole);

    res.json({
      success: true,
      message: `Rol actualizado a ${role}`
    });
  } catch (error: any) {
    console.error("Error actualizando rol:", error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar rol'
    });
  }
});

/**
 * ELIMINAR USUARIO
 */
router.delete('/profiles/:userId', verifySession, hasRole('Admin'), async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;

    // Eliminar de Supabase Auth y Neon
    await supabaseAdmin.auth.admin.deleteUser(userId as string);
    await supabase.from('users').delete().eq('id', userId as string);

    res.json({
      success: true,
      message: 'Usuario eliminado correctamente'
    });
  } catch (error: any) {
    console.error("Error eliminando usuario:", error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar usuario'
    });
  }
});

/**
 * 👥 GESTIÓN DE PERFILES CON AVATAR
 */
router.get('/profiles', verifySession, hasRole('Admin'), async (req: AuthRequest, res: Response) => {
  try {
    const { data: supaProfiles } = await supabaseAdmin.from('users').select('*');
    const { data: { users: authUsers } } = await supabaseAdmin.auth.admin.listUsers();

    // 🔍 LOGS DE CONTROL
    console.log(`📊 Supabase: ${supaProfiles?.length} | Auth: ${authUsers?.length}`);
    
    const enrichedProfiles = supaProfiles?.map(profile => {
      const authUser = authUsers.find(u => u.id === profile.id);
      
      // 🔍 Verificar si encontramos coincidencia
      if (!authUser) console.log(`⚠️ No se encontró metadata para: ${profile.email}`);

      return {
        ...profile,
        avatar_url: authUser?.user_metadata?.avatar_url || 'https://via.placeholder.com/150'
      };
    });

    res.json({ success: true, profiles: enrichedProfiles });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * 🔄 RUTAS ESTÁTICAS (DEBEN IR DESPUÉS)
 */

/**
 * 🔄 SINCRO DE SESIÓN
 */
router.post('/set-cookie', async (req: AuthRequest, res: Response) => {
  try {
    const { access_token, refresh_token } = req.body;

    console.log("📥 Recibido en /set-cookie:", {
      access: !!access_token,
      refresh: !!refresh_token
    });

    if (!access_token) {
      console.error("❌ Error: No llegó el access_token al backend");
      return res.status(400).json({ success: false, message: 'Access token requerido.' });
    }

    // Intentamos validar el token y obtener el rol
    const user = await verifySupabaseToken(access_token);
    console.log("✅ Usuario verificado con éxito:", user.email, "Rol:", user.role);

    setAuthCookie(res, access_token, 'authToken');

    if (refresh_token) {
      setAuthCookie(res, refresh_token, 'refreshToken');
    }

    return res.json({
      success: true,
      user: { email: user.email, role: user.role }
    });

  } catch (error: any) {
    // 🔍 ESTO APARECERÁ EN TU CONSOLA DE LINUX
    console.error("🔥 ERROR CRÍTICO EN BACKEND:");
    console.error("Mensaje:", error.message);
    if (error.stack) console.error("Stack:", error.stack);

    return res.status(500).json({
      success: false,
      message: 'Error interno en la validación de sesión',
      error: error.message
    });
  }
});

/**
 * 👤 PERFIL ACTUAL
 */
router.get('/perfil', verifySession, (req: AuthRequest, res: Response) => {
  res.json({
    success: true,
    user: req.user
  });
});

/**
 * LOGOUT
 */
router.post('/logout', (req: AuthRequest, res: Response) => {
  clearAuthCookies(res);
  res.json({ success: true, message: 'Sesión cerrada' });
});

export default router;