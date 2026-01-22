<<<<<<< HEAD
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
=======
//backend/src/routes/authRoutes.ts

import { Router, Request, Response } from "express";
import * as authService from "../services/authService";
import { authenticateToken, hasRole } from "../middleware/authMiddleware";

const router = Router();

// Tipo opcional para el payload del usuario autenticado
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email?: string;
    role: string;
    sub?: string;
  };
}

// --- RUTAS ---

// 1. RUTA DE INTERCAMBIO DE TOKEN (establecer cookies de sesión)
router.post("/set-cookie", async (req: Request, res: Response) => {
  const { access_token, refresh_token } = req.body;

  if (!access_token || !refresh_token) {
    return res.status(400).json({ message: "Tokens requeridos." });
  }

  try {
    // Verifica que el token de Supabase sea válido
    await authService.verifySupabaseToken(access_token);

    // Establece cookies de sesión para el access_token y refresh_token
    authService.setAuthCookie(res, access_token, "authToken");
    authService.setAuthCookie(res, refresh_token, "refreshToken");

    res.json({ message: "Cookies establecidas correctamente." });
  } catch (error: any) {
    console.error(error.message);
    res.status(401).json({ message: "Token inválido o error al establecer cookie." });
  }
});

// 2. RUTA DE LOGOUT (limpia cookies de sesión)
router.post("/logout", (req: Request, res: Response) => {
  authService.clearAuthCookie(res);
  res.json({ message: "Sesión cerrada exitosamente." });
});

// 3. RUTA PROTEGIDA: Perfil de usuario
router.get("/perfil", authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  res.json({
    message: "Acceso concedido",
    userData: req.user, // Devuelve los datos del usuario autenticado
  });
});

// 4. RUTA PROTEGIDA POR ROL (solo administradores)
router.get("/admin-data", authenticateToken, hasRole("admin"), (req: Request, res: Response) => {
  res.json({
    message: "Eres administrador",
    secretData: "Datos confidenciales",
  });
});

// 5. RUTA DE RENOVACIÓN DE SESIÓN (refresh token)
router.post("/refresh-session", async (req: Request, res: Response) => {
  const refreshToken = req.cookies?.refreshToken;
  if (!refreshToken)
    return res.status(401).json({ message: "Token de refresco faltante." });

  try {
    // Renovar tokens usando el refresh token
    const newSession = await authService.refreshAuthToken(refreshToken);

    // Actualiza cookies con los nuevos tokens
    authService.setAuthCookie(res, newSession.access_token, "authToken");
    authService.setAuthCookie(res, newSession.refresh_token, "refreshToken");

    res.json({ message: "Sesión renovada." });
  } catch (error: any) {
    console.error(error.message);
    authService.clearAuthCookie(res);
    res.status(401).json({ message: "Sesión expirada." });
  }
});

// 6. RUTA INTERNA PARA VALIDACIÓN DE TOKEN (para otros microservicios)
router.post(
  "/internal/validate-token",
  authenticateToken,
  (req: AuthenticatedRequest, res: Response) => {
    res.json({
      isValid: true,
      id: req.user?.sub || req.user?.id,
      role: req.user?.role || "authenticated",
      email: req.user?.email,
    });
  }
);

// 7. RUTA PROTEGIDA POR ROL: Obtener lista de usuarios (solo administradores)
router.get(
  "/users",
  authenticateToken,
  hasRole("admin"),
  async (req: Request, res: Response) => {
    try {
      const users = await authService.getAllUsers();
      res.json({
        message: "Lista de usuarios obtenida exitosamente.",
        users: users,
      });
    } catch (error: any) {
      // Manejo de error si el servicio falla (e.g., error de DB)
      console.error(error.message);
      res.status(500).json({ message: "Error al recuperar la lista de usuarios." });
    }
  }
);
>>>>>>> ecf70a1023dc14ecb200f4d29839e2b82f107d0c

export default router;
