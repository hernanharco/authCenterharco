import { Request } from "express";
import { UserRole } from "./permissionTypes";

export interface AuthenticatedUser {
  sub: string;
  email: string;
  role: UserRole;
}

// Exportamos explícitamente AuthRequest extendiendo el Request de Express
export interface AuthRequest extends Request {
  user?: AuthenticatedUser;
}