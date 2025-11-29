import { Router, Request, Response } from "express";
import * as authService from "../services/authService";
import { authenticateToken, hasRole } from "../middleware/authMiddleware";

const router = Router();

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email?: string;
    role: string;
    sub?: string;
  };
}

// --- RUTAS ---
router.post("/set-cookie", async (req: Request, res: Response) => {
  const { access_token, refresh_token } = req.body;

  if (!access_token || !refresh_token) {
    return res.status(400).json({ message: "Tokens requeridos." });
  }

  try {
    await authService.verifySupabaseToken(access_token);
    authService.setAuthCookie(res, access_token, "authToken");
    authService.setAuthCookie(res, refresh_token, "refreshToken");

    res.json({ message: "Cookies establecidas correctamente." });
  } catch (error: any) {
    console.error(error.message);
    res.status(401).json({ message: "Token inválido o error al establecer cookie." });
  }
});

router.post("/logout", (req: Request, res: Response) => {
  authService.clearAuthCookie(res);
  res.json({ message: "Sesión cerrada exitosamente." });
});

router.get("/perfil", authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  res.json({
    message: "Acceso concedido",
    userData: req.user,
  });
});

router.get("/admin-data", authenticateToken, hasRole("admin"), (req: Request, res: Response) => {
  res.json({
    message: "Eres administrador",
    secretData: "Datos confidenciales",
  });
});

router.post("/refresh-session", async (req: Request, res: Response) => {
  const refreshToken = req.cookies?.refreshToken;
  if (!refreshToken)
    return res.status(401).json({ message: "Token de refresco faltante." });

  try {
    const newSession = await authService.refreshAuthToken(refreshToken);
    authService.setAuthCookie(res, newSession.access_token, "authToken");
    authService.setAuthCookie(res, newSession.refresh_token, "refreshToken");

    res.json({ message: "Sesión renovada." });
  } catch (error: any) {
    console.error(error.message);
    authService.clearAuthCookie(res);
    res.status(401).json({ message: "Sesión expirada." });
  }
});

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
