import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { JwtPayload } from 'jsonwebtoken';
import { Response } from 'express';

/* =================================================
   1. CONFIGURACIÓN DE CLIENTES (SDK)
================================================= */

/**
 * Cliente Estándar: Se usa para operaciones de usuario (login, perfil, refresh).
 * Utiliza la ANON_KEY, respetando las políticas de seguridad (RLS).
 */
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
);

/**
 * Cliente Maestro (Admin): SE USA SOLO EN EL BACKEND.
 * Utiliza la SERVICE_ROLE_KEY para saltar el RLS y acceder a esquemas protegidos como 'auth'.
 */
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string 
);

export interface SupabaseJwtPayload extends JwtPayload {
  sub: string;
  email?: string;
  role?: string;
}

/* =================================================
   2. SEGURIDAD Y VALIDACIÓN DE TOKENS
================================================= */

/**
 * Verifica si un token JWT es válido consultando directamente a Supabase.
 * Es más seguro que 'jsonwebtoken' local porque valida contra el estado real de la sesión.
 */
export async function verifySupabaseToken(token: string): Promise<SupabaseJwtPayload> {
  if (!token) throw new Error('Token no proporcionado');

  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    console.error("❌ [AuthService] Error de validación Supabase:", error?.message);
    throw new Error(error?.message || 'Token inválido o expirado');
  }

  return {
    sub: user.id,
    email: user.email,
    role: (user.app_metadata?.role as string) || 'authenticated'
  } as SupabaseJwtPayload;
}

/**
 * Obtiene el rol específico de un usuario desde la tabla 'public.users'.
 * Utilizado para control de acceso (RBAC) en rutas protegidas.
 */
export async function getUserRole(userId: string): Promise<string> {
  if (!userId) return "unauthenticated";
  
  const { data, error } = await supabase
    .from("users")
    .select("role")
    .eq("id", userId)
    .maybeSingle();

  if (error) console.warn("⚠️ [AuthService] No se pudo obtener el rol:", error.message);
  return data?.role || "authenticated";
}

/* =================================================
   3. GESTIÓN DE COOKIES (MIDDLEWARE DE SESIÓN)
================================================= */

/**
 * Configura cookies HttpOnly seguras en el navegador.
 * HttpOnly evita que el JS del frontend acceda al token (Protección anti-XSS).
 */
export function setAuthCookie(res: Response, token: string, name: "authToken" | "refreshToken") {
  res.cookie(name, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production", // Solo HTTPS en producción
    sameSite: "lax",
    path: "/",
    // El Refresh Token dura 7 días, el Auth Token 1 hora
    maxAge: name === "refreshToken" ? 604800000 : 3600000,
  });
}

/**
 * Elimina las cookies de sesión del navegador (Logout).
 */
export function clearAuthCookies(res: Response) {
  const options = { httpOnly: true, expires: new Date(0), path: "/", sameSite: "lax" as const };
  res.cookie("authToken", "", options);
  res.cookie("refreshToken", "", options);
}

/**
 * Solicita a Supabase un nuevo token de acceso usando el token de refresco.
 */
export async function refreshAuthToken(refreshToken: string) {
  const { data, error } = await supabase.auth.refreshSession({ refresh_token: refreshToken });
  if (error || !data.session) throw new Error("No se pudo renovar la sesión");
  return data.session;
}

/* =================================================
   4. ADMINISTRACIÓN DE DATOS (CRUD GLOBAL)
================================================= */

/**
 * Lista TODOS los usuarios registrados en el sistema de autenticación de Supabase.
 * Fuente: Esquema Interno (auth.users). Requiere supabaseAdmin.
 */
export const getAllUsersFromAuth = async () => {
  const { data, error } = await supabaseAdmin.auth.admin.listUsers();
  
  if (error) {
    console.error("❌ [AuthService] Error en getAllUsersFromAuth:", error.message);
    throw error;
  }
  return data.users;
};