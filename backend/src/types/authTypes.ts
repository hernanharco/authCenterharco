// src/types/authTypes.ts
import { UserRole } from "./permissionTypes";

export interface AuthenticatedUser {
  sub: string;
  email?: string;
  role: UserRole;
}
