<<<<<<< HEAD
import { Request } from "express";

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email?: string;
    role: string;
  };
=======
import { Request as ExpressRequest } from "express";
import { AuthenticatedUser } from "./express";

export interface AuthRequest extends ExpressRequest {
  user?: AuthenticatedUser;
>>>>>>> ecf70a1023dc14ecb200f4d29839e2b82f107d0c
}
