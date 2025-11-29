import { Response, NextFunction } from "express";
import { AuthRequest } from "../types/authReques";
import { verifySupabaseToken, getUserRole } from "../services/authService";

export const authenticateToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authToken = req.cookies?.authToken;

  if (!authToken) {
    return res.status(401).json({ message: "No autenticado. Cookie faltante." });
  }

  try {
    const userPayload = await verifySupabaseToken(authToken);
    const userId = userPayload.sub;

    if (!userId) return res.status(401).json({ message: "Token inválido." });

    const userRole = await getUserRole(userId);

    req.user = {
      id: userId,
      email: userPayload.email,
      role: userRole,
      ...userPayload,
    };

    next();
  } catch (error: any) {
    console.error("Fallo de verificación:", error.message);
    return res.status(401).json({ message: "Token inválido o expirado." });
  }
};

export const hasRole =
  (requiredRole: string) =>
  (req: AuthRequest, res: Response, next: NextFunction) => {
    const userRole = req.user?.role;

    if (!userRole) {
      return res.status(403).json({ message: "Rol de usuario no encontrado." });
    }

    if (userRole === requiredRole) return next();

    return res.status(403).json({
      message: `Se requiere rol '${requiredRole}', tu rol es '${userRole}'`,
    });
  };
