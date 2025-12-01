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

export default router;
