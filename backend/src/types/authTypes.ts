// src/types/authTypes.ts
import { UserRole } from "@/types/permissionTypes";

export interface AuthenticatedUser {
  sub: string;
  email?: string;
  role: UserRole;
}
