// backend/src/middleware/authMiddleware.ts
import { Request, Response, NextFunction } from 'express';
import { checkLevel, UserRole } from '@/types/permissionTypes';

export const hasRole = (roleRequerido: UserRole) => {
  return (req: any, res: Response, next: NextFunction) => {
    // El rol que viene del Token JWT (auth.users metadata)
    const userRole = req.user?.role;

    if (checkLevel(userRole, roleRequerido)) {
      return next();
    }

    return res.status(403).json({ 
      success: false, 
      message: `Acceso insuficiente. Se requiere ${roleRequerido}.` 
    });
  };
};