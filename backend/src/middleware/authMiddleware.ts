import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { checkLevel, UserRole } from '@/types/permissionTypes';

/**
 * 1. MIDDLEWARE DE AUTENTICACIÓN
 * Se encarga de transformar la cookie 'authToken' en un objeto 'req.user'
 */
export const verifySession = (req: any, res: Response, next: NextFunction) => {
  const token = req.cookies.authToken;

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "No autorizado: No se encontró sesión activa."
    });
  }

  try {
    // Decodificamos el JWT (Supabase usa este formato)
    const decoded = jwt.decode(token) as any;

    if (!decoded) {
      return res.status(401).json({ success: false, message: "Token inválido." });
    }

    // Guardamos el usuario decodificado en la request
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: "Error al validar sesión." });
  }
};

/**
 * 2. MIDDLEWARE DE AUTORIZACIÓN (Basado en tu jerarquía)
 * Usa tu función checkLevel para permitir o denegar el acceso.
 */
export const hasRole = (roleRequerido: UserRole) => {
  return (req: any, res: Response, next: NextFunction) => {

    // Verificamos que verifySession haya pasado primero
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Usuario no identificado." });
    }

    // Extraemos el rol real del usuario del JWT de Supabase
    // Priorizamos app_metadata porque ahí es donde tienes 'SuperAdmin'
    const userRole = req.user.app_metadata?.role || req.user.role;

    // USAMOS TU FUNCIÓN checkLevel
    if (checkLevel(userRole, roleRequerido)) {
      console.log(`[Auth] Acceso concedido: ${userRole} cumple con nivel ${roleRequerido}`);
      return next();
    }

    // Si no tiene nivel suficiente
    console.warn(`[Auth] Acceso denegado: ${userRole} no tiene nivel ${roleRequerido}`);
    return res.status(403).json({
      success: false,
      message: `Acceso insuficiente. Tu nivel (${userRole}) no permite realizar esta acción (Mínimo requerido: ${roleRequerido}).`
    });
  };
};