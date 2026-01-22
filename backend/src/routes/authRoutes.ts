import { Router, Request, Response } from 'express';
import {
  verifySupabaseToken,
  setAuthCookie,
  clearAuthCookies,
  refreshAuthToken,
  getAllUsersFromAuth
} from '../services/authService';
import { authenticateToken, hasRole } from '../middleware/authMiddleware';
import { supabase } from '../services/authService';

const router = Router();

/* =================================================
   AUTENTICACIÓN Y COOKIES
================================================= */

// POST /auth/set-cookie
router.post('/set-cookie', async (req: Request, res: Response) => {
  const { access_token, refresh_token } = req.body;

  if (!access_token || !refresh_token) {
    return res.status(400).json({ message: 'Tokens requeridos' });
  }

  try {
    const payload = await verifySupabaseToken(access_token);

    setAuthCookie(res, access_token, 'authToken');
    setAuthCookie(res, refresh_token, 'refreshToken');

    res.json({
      message: 'Sesión iniciada',
      email: payload.email,
    });
  } catch (error: any) {
    console.error('❌ Error en set-cookie:', error.message);
    res.status(401).json({ message: 'Token inválido', error: error.message });
  }
});

// POST /auth/logout
router.post('/logout', (_req, res) => {
  clearAuthCookies(res);
  res.json({ message: 'Sesión cerrada' });
});

/* =================================================
   RUTAS PROTEGIDAS (USUARIO)
================================================= */

// GET /auth/perfil (La que buscabas)
router.get('/perfil', authenticateToken, (req: any, res: Response) => {
  res.json({
    success: true,
    message: 'Perfil cargado correctamente',
    user: req.user,
  });
});

// GET /auth/me
router.get('/me', authenticateToken, (req: any, res: Response) => {
  res.json({ user: req.user });
});

/* =================================================
   ADMINISTRACIÓN Y REFRESH
================================================= */

// GET /auth/admin
router.get('/admin', authenticateToken, hasRole('admin'), (_req, res) => {
  res.json({ secret: '🧠 Datos ultra secretos del servidor' });
});

// POST /auth/refresh
router.post('/refresh', async (req: Request, res: Response) => {
  const refreshToken = req.cookies?.refreshToken;

  if (!refreshToken)
    return res.status(401).json({ message: 'No hay refresh token' });

  try {
    const session = await refreshAuthToken(refreshToken);
    setAuthCookie(res, session.access_token, 'authToken');
    setAuthCookie(res, session.refresh_token, 'refreshToken');
    res.json({ message: 'Sesión renovada' });
  } catch {
    clearAuthCookies(res);
    res.status(401).json({ message: 'Sesión expirada' });
  }
});

/* =================================================
   ADMINISTRACIÓN DE PERFILES
================================================= */

// GET /auth/profiles - Listar todos los perfiles (solo admin)
router.get(
  '/profiles',
  authenticateToken,
  hasRole('admin'),
  async (_req: any, res: Response) => {
    try {
      const { data: profiles, error } = await supabase
        .from('users')
        .select('id, email, role, created_at, updated_at')
        .order('created_at', { ascending: false });

      if (error) throw error;

      res.json({
        success: true,
        profiles: profiles || [],
      });
    } catch (error: any) {
      console.error('Error al obtener perfiles:', error);
      res.status(500).json({ message: 'Error al obtener perfiles' });
    }
  },
);

// PUT /auth/profiles/:id/role - Actualizar rol de usuario (solo admin)
router.put(
  '/profiles/:id/role',
  authenticateToken,
  hasRole('admin'),
  async (req: any, res: Response) => {
    const { id } = req.params;
    const { role } = req.body;

    if (!role || !['user', 'admin', 'moderator'].includes(role)) {
      return res.status(400).json({ message: 'Rol inválido' });
    }

    try {
      const { data, error } = await supabase
        .from('users')
        .update({ role, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      res.json({
        success: true,
        message: 'Rol actualizado correctamente',

        user: data,
      });
    } catch (error: any) {
      console.error('Error al actualizar rol:', error);
      res.status(500).json({ message: 'Error al actualizar rol' });
    }
  },
);

// DELETE /auth/profiles/:id - Eliminar usuario (solo admin)
router.delete(
  '/profiles/:id',
  authenticateToken,
  hasRole('admin'),
  async (req: any, res: Response) => {
    const { id } = req.params;

    // Evitar que un admin se elimine a sí mismo
    if (req.user.id === id) {
      return res
        .status(400)
        .json({ message: 'No puedes eliminar tu propio usuario' });
    }

    try {
      // Eliminar de Supabase Auth
      const { error: authError } = await supabase.auth.admin.deleteUser(id);
      if (authError) throw authError;

      // Eliminar de la tabla users
      const { error: dbError } = await supabase
        .from('users')
        .delete()
        .eq('id', id);

      if (dbError) throw dbError;

      res.json({
        success: true,
        message: 'Usuario eliminado correctamente',
      });
    } catch (error: any) {
      console.error('Error al eliminar usuario:', error);
      res.status(500).json({ message: 'Error al eliminar usuario' });
    }
  },
);

// PUT /auth/profile - Actualizar perfil propio
router.put('/profile', authenticateToken, async (req: any, res: Response) => {
  const { email } = req.body;
  const userId = req.user.id;

  if (!email) {
    return res.status(400).json({ message: 'Email es requerido' });
  }

  try {
    const { data, error } = await supabase
      .from('users')
      .update({ email, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      message: 'Perfil actualizado correctamente',
      user: data,
    });
  } catch (error: any) {
    console.error('Error al actualizar perfil:', error);
    res.status(500).json({ message: 'Error al actualizar perfil' });
  }
});

// Para llamar toda la Informacion
router.get('/admin/all-users', async (req, res) => {
  try {
    const users = await getAllUsersFromAuth();
    res.json({ success: true, data: users });
  } catch (error: any) {
    // ESTO ES CLAVE: Imprime el error real en tu terminal de Linux
    console.error("ERROR REAL EN EL BACKEND:", error); 
    
    res.status(500).json({ 
      success: false, 
      message: "Error al obtener usuarios",
      debug: error.message // Esto te dirá en Postman qué falló exactamente
    });
  }
});

export default router;
