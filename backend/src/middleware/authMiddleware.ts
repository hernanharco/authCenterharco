import { Response, NextFunction } from "express";
import { AuthRequest } from "@/types/authReques";

import { verifySupabaseToken, getUserRole } from "../services/authService";

export async function authenticateToken(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  const token = req.cookies?.authToken;

  if (!token)
    return res.status(401).json({ message: "No autenticado" });

  try {
    const payload = await verifySupabaseToken(token);
    const role = await getUserRole(payload.sub);

    req.user = {
      id: payload.sub,
      email: payload.email,
      role,
    };

    next();
  } catch (err) {
    return res.status(401).json({ message: "Token inválido" });
  }
}

export const hasRole =
  (requiredRole: string) =>
  (req: AuthRequest, res: Response, next: NextFunction) => {
    if (req.user?.role !== requiredRole) {
      return res.status(403).json({
        message: `Se requiere rol ${requiredRole}`,
      });
    }
    next();
  };
