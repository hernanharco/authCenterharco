import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import jwt, { JwtPayload } from "jsonwebtoken";
import { Response } from "express";

// -------------------- CONFIG --------------------
export const supabase = createClient(
  process.env.SUPABASE_URL as string,
  process.env.SUPABASE_KEY as string
);

const SUPABASE_JWT_SECRET = process.env.SUPABASE_JWT_SECRET as string;

// Expiraciones
const ACCESS_TOKEN_MAX_AGE = 60 * 60 * 1000; // 1 hora
const REFRESH_TOKEN_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 días

// -------------------- TIPOS --------------------
export interface SupabaseJwtPayload extends JwtPayload {
  sub?: string; // ID del usuario
  role?: string;
}

// -------------------- FUNCIONES --------------------

/**
 * Verifica un JWT emitido por Supabase
 */
export async function verifySupabaseToken(token: string): Promise<SupabaseJwtPayload> {
  if (!token) throw new Error("No se proporcionó token.");
  try {
    return jwt.verify(token, SUPABASE_JWT_SECRET) as SupabaseJwtPayload;
  } catch {
    throw new Error("Token inválido o expirado.");
  }
}

/**
 * Obtiene el rol real del usuario desde Supabase
 */
export async function getUserRole(userId: string): Promise<string> {
  if (!userId) return "unauthenticated";

  const { data, error } = await supabase
    .from("users")
    .select("role")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    console.error("Error al consultar rol:", error);
    return "authenticated";
  }

  return data?.role ?? "authenticated";
}

/**
 * Establece cookies HttpOnly para autenticación
 */
export function setAuthCookie(
  res: Response,
  token: string,
  name: "authToken" | "refreshToken" = "authToken"
) {
  const maxAge = name === "refreshToken" ? REFRESH_TOKEN_MAX_AGE : ACCESS_TOKEN_MAX_AGE;

  res.cookie(name, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge,
  });
}

/**
 * Limpia las cookies de autenticación
 */
export function clearAuthCookie(res: Response) {
  const expiredOptions = {
    httpOnly: true,
    expires: new Date(0),
    sameSite: "strict" as const,
  };

  res.cookie("authToken", "", expiredOptions);
  res.cookie("refreshToken", "", expiredOptions);
}

/**
 * Renueva la sesión usando solo el refresh token
 */
export async function refreshAuthToken(refreshToken: string) {
  if (!refreshToken) throw new Error("No se proporcionó el Refresh Token.");

  // Supabase v2: usamos refreshSession
  const { data, error } = await supabase.auth.refreshSession({ refresh_token: refreshToken });

  if (error) throw error;
  if (!data.session) throw new Error("Sesión vacía de Supabase.");

  return data.session;
}
