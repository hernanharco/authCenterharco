import { Request as ExpressRequest } from "express";
import { AuthenticatedUser } from "./express";

export interface AuthRequest extends ExpressRequest {
  user?: AuthenticatedUser;
}
