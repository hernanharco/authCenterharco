export type UserRole = 'SuperAdmin' | 'Owner' | 'Viewer' | 'Admin' | 'Editor';

// En src/lib/types.ts o similar
export interface User {  
  id: string;
  name: string;
  email: string;
  role: UserRole;
  project_slug: string;
  avatar_url?: string;  
  picture?: string;
}
