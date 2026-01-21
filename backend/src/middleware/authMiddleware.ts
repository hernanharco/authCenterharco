import { Response, NextFunction } from "express";
import { AuthRequest } from "../types/authReques"; // Asumo que es un typo y es AuthRequest
// 🛑 IMPORTAR FUNCIÓN ACTUALIZADA
import { verifySupabaseToken, getUserDashboardData } from "../services/authService"; 

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

    // 🛑 Paso 1: Obtener todos los datos obligatorios (incluyendo name y avatar) de la DB
    const userData = await getUserDashboardData(userId); 

    // 🛑 Paso 2: Construir req.user usando todos los campos OBLIGATORIOS
    // El spread del payload viene primero para satisfacer [key: string]: any
    req.user = {
      // 1. Spread del JWT (contiene iss, exp, iat, sub, etc.)
      ...userPayload,
      
      // 2. Sobrescribir con los datos limpios y obligatorios de la DB (userData)
      id: userId,
      email: userData.email, 
      role: userData.role,
      name: userData.name, 
      avatar: userData.avatar,
    };

    next();
  } catch (error: any) {
    console.error("Fallo de verificación:", error.message);
    // Si falla la verificación O la consulta de la DB, se considera no autorizado
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

    // Nota: Deberías considerar un mecanismo para roles anidados si usas, e.g., 'admin' > 'user'.
    if (userRole === requiredRole) return next();

    return res.status(403).json({
      message: `Se requiere rol '${requiredRole}', tu rol es '${userRole}'`,
    });
  };