// src/types/express.d.ts
import "express-serve-static-core";

<<<<<<< HEAD
export type AuthenticatedUser = {
  id: string;
  email?: string;
  role: string;
  [key: string]: any;
=======
// 🚀 TIPO CANÓNICO CENTRALIZADO
export type AuthenticatedUser = {
  id: string;
  email: string | null; // Cambiado para mayor robustez (email puede ser null)
  role: string;
  // CAMPOS AÑADIDOS
  name: string;
  avatar: string;
  // ------------------
  [key: string]: any; // Permite otras propiedades de Supabase (e.g., created_at)
>>>>>>> ecf70a1023dc14ecb200f4d29839e2b82f107d0c
};

declare module "express-serve-static-core" {
  interface Request {
    user?: AuthenticatedUser;
  }
<<<<<<< HEAD
}
=======
}
>>>>>>> ecf70a1023dc14ecb200f4d29839e2b82f107d0c
