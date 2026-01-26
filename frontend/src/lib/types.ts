export type UserRole = 'SuperAdmin' | 'Owner' | 'Viewer' | 'Admin' | 'Editor';

export interface User {
  id: string;
  sub?: string; // Compatibilidad con el ID del JWT de Express
  email: string;
  role: UserRole;
  name?: string;
  avatar_url?: string;
  project_slug?: string;
  updated_at?: string;
}

export interface ProfileResponse {
  success: boolean;
  user?: {
    id: string;
    sub?: string;
    email: string;
    role: string;
    name?: string;
    project_slug?: string;
    avatar_url?: string;
  };
}

export interface AllUsersResponse {
  success: boolean;
  profiles: any[]; // Datos provenientes de Neon DB
}