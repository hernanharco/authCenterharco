// src/types/express.d.ts
import "express-serve-static-core";

export type AuthenticatedUser = {
  id: string;
  email?: string;
  role: string;
  [key: string]: any;
};

declare module "express-serve-static-core" {
  interface Request {
    user?: AuthenticatedUser;
  }
}