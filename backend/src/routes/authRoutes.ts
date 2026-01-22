import { Router, Request, Response } from 'express';
import {
  verifySupabaseToken,
  setAuthCookie,
  clearAuthCookies,
  refreshAuthToken,
  getAllUsersFromAuth
} from '@/services/authService';
import { authenticateToken, hasRole } from '@/middleware/authMiddleware';
import { supabase } from '@/services/authService';

const router = Router();

/* =================================================
   AUTENTICACIÓN Y COOKIES (Seguridad Máxima)
================================================= */

// POST /api/set-cookie
router.post('/set-cookie', async (req: Request, res: Response) => {
  // Usamos req.body para seguridad (no exponer en URL)
  // El ?. evita el error "TypeError: Cannot destructure..." si el body viene vacío
  const access_token = req.body?.access_token;
  const refresh_token = req.body?.refresh_token;

  if (!access_token || !refresh_token) {
    return res.status(400).json({
      success: false,
      message: 'Tokens requeridos en el cuerpo de la petición (JSON).'
    });
  }

  try {
    const payload = await verifySupabaseToken(access_token);

    // Seteamos las cookies (httponly para evitar ataques XSS)
    setAuthCookie(res, access_token, 'authToken');
    setAuthCookie(res, refresh_token, 'refreshToken');

    res.json({
      success: true,
      message: 'Sesión iniciada y cookies configuradas',
      email: payload.email,
    });
  } catch (error: any) {
    console.error('❌ Error en set-cookie:', error.message);
    res.status(401).json({ message: 'Token inválido', error: error.message });
  }
});

// POST /api/logout
router.post('/logout', (_req, res) => {
  clearAuthCookies(res);
  res.json({ message: 'Sesión cerrada correctamente' });
});

/* =================================================
   GESTIÓN DE PERFILES Y ROLES (Rama: rol)
================================================= */

// GET /api/profiles
router.get(
  '/profiles',
  authenticateToken,
  //hasRole('Admin'),
  async (req: any, res: Response) => {
    try {
      const isCountOnly = req.query.count === 'true';

      // 1. Lógica de Conteo (KPI para el Dashboard)
      if (isCountOnly) {
        const { count, error } = await supabase
          .from('users')
          .select('*', { count: 'exact', head: true });

        if (error) throw error;

        return res.json({
          success: true,
          total: count || 0,
        });
      }

      // 2. Lógica de Listado (Para la tabla de usuarios)
      const { data: profiles, error } = await supabase
        .from('users')
        .select('id, email, role, updated_at') // Seleccionamos solo columnas existentes
        .order('updated_at', { ascending: false, nullsFirst: false }); // Usamos updated_at

      if (error) throw error;

      res.json({
        success: true,
        profiles: profiles || [],
      });
    } catch (error: any) {
      console.error('Error al obtener perfiles:', error);
      res.status(500).json({
        success: false,
        message: 'Error al consultar la base de datos',
        debug: error.message
      });
    }
  },
);

// PATCH /api/profiles/:id/role
router.patch('/profiles/:id/role', authenticateToken, async (req: any, res: Response) => {
  const { id } = req.params;
  const { role } = req.body;

  try {
    // 1. ACTUALIZAR EN TU TABLA (Lo que ya hacías)
    const { error: tableError } = await supabase
      .from('users') 
      .update({ role: role, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (tableError) throw tableError;

    // 2. ACTUALIZAR EN SUPABASE AUTH (Lo que falta)
    // Esto hace que el cambio se vea en /admin/all-users y en el token del usuario
    const { error: authError } = await supabase.auth.admin.updateUserById(
      id,
      { user_metadata: { role: role } } 
    );

    if (authError) {
      console.warn("⚠️ No se pudo actualizar la metadata de Auth, pero sí la tabla.");
    }

    res.json({ 
      success: true, 
      message: 'Rol actualizado en Tabla y Auth Metadata' 
    });

  } catch (error: any) {
    console.error("❌ Error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE /api/profiles/:id
// Solo un Admin o superior puede borrar, pero añadiremos una protección extra
router.delete('/profiles/:id', authenticateToken, hasRole('Admin'), async (req: any, res: Response) => {
  const { id } = req.params;
  const executorRole = req.user.role;

  try {
    // Protección: Un 'Admin' no puede borrar a un 'SuperAdmin' o 'Owner'
    const { data: targetUser } = await supabase.from('users').select('role').eq('id', id).single();
    
    if (targetUser && (targetUser.role === 'Owner' || targetUser.role === 'SuperAdmin')) {
       if (executorRole === 'Admin') {
         return res.status(403).json({ message: "No tienes nivel suficiente para borrar a este usuario." });
       }
    }

    // 1. Eliminar de la tabla pública
    const { error: tableError } = await supabase.from('users').delete().eq('id', id);
    if (tableError) throw tableError;

    // 2. Eliminar de Supabase Auth
    const { error: authError } = await supabase.auth.admin.deleteUser(id);
    if (authError) console.warn("⚠️ Usuario borrado de tabla pero no de Auth");

    res.json({ success: true, message: 'Usuario eliminado correctamente' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/* =================================================
   RUTAS DE INFORMACIÓN Y ADMIN
================================================= */

// GET /api/perfil - Datos del usuario logueado
router.get('/perfil', authenticateToken, (req: any, res: Response) => {
  res.json({
    success: true,
    user: req.user,
  });
});

// GET /api/admin/all-users
// Ahora, gracias al nuevo middleware, si eres SuperAdmin u Owner pasarás aunque pida 'Admin'
router.get('/admin/all-users', authenticateToken, hasRole('Admin'), async (_req, res) => {
  try {
    const users = await getAllUsersFromAuth();
    res.json({ success: true, data: users });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;