import { Request, Response, NextFunction } from "express";
import { verifySupabaseToken } from "../services/authService";
import { UserRole, checkLevel } from "../types/permissionTypes";
import { AuthenticatedUser } from "../types/authTypes";

interface AuthRequest extends Request {
  user?: AuthenticatedUser;
}

/**
 * ✅ MIDDLEWARE SIMPLIFICADO
 * Solo valida el access token. Si expira, el usuario debe hacer login de nuevo.
 * Esto es más simple y seguro que intentar refresh desde el backend.
 */
export const verifySession = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const token = req.cookies?.authToken;

  console.log("🔍 Verificando sesión - Cookie presente:", !!token);

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "No autenticado - Se requiere login",
      requiresLogin: true
    });
  }

  try {
    // Validar el token
    req.user = await verifySupabaseToken(token);
    console.log("✅ Sesión válida para:", req.user.email);
    return next();

  } catch (error: unknown) {
    console.warn(`⚠️ Token inválido o expirado: ${error}`);

    return res.status(401).json({
      success: false,
      message: "Sesión expirada - Vuelve a iniciar sesión",
      requiresLogin: true
    });
  }
};

/**
 * MIDDLEWARE DE AUTORIZACIÓN POR ROL
 */
export const hasRole = (requiredRole: UserRole) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Usuario no autenticado."
      });
    }

    if (checkLevel(req.user.role, requiredRole)) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: `Acceso denegado. Requiere rol ${requiredRole}.`
    });
  };
};