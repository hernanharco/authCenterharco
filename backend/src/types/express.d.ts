// src/types/express.d.ts
import "express-serve-static-core";

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
};

declare module "express-serve-static-core" {
  interface Request {
    user?: AuthenticatedUser;
  }
}