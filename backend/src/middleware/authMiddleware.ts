import { Response, NextFunction } from "express"; // Eliminamos Request de aquí
import { verifySupabaseToken, clearAuthCookies } from "../services/authService";
import { UserRole, checkLevel } from "../types/permissionTypes";
import { AuthRequest } from "../types/authTypes"; // 👈 Importación corregida

export const verifySession = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = req.cookies?.authToken;

  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: "No autenticado",
      requiresLogin: true 
    });
  }

  try {
    // verifySupabaseToken ya devuelve un AuthenticatedUser compatible
    req.user = await verifySupabaseToken(token);
    next();
  } catch (error) {
    clearAuthCookies(res);
    return res.status(401).json({ success: false, message: "Sesión expirada" });
  }
};

export const hasRole = (requiredRole: UserRole) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    // Verificamos si existe el usuario y su nivel de jerarquía
    if (!req.user || !checkLevel(req.user.role, requiredRole)) {
      return res.status(403).json({ 
        success: false, 
        message: `Permisos insuficientes. Se requiere nivel: ${requiredRole}` 
      });
    }
    next();
  };
};