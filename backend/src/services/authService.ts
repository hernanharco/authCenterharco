import { createClient } from "@supabase/supabase-js";
import { Response } from "express";
import { ENV_CONFIG } from "../config/env.config";
import { AuthenticatedUser } from "../types/authTypes";
import { UserRole } from "../types/permissionTypes";

export const supabase = createClient(ENV_CONFIG.SUPABASE.URL, ENV_CONFIG.SUPABASE.ANON_KEY);
export const supabaseAdmin = createClient(ENV_CONFIG.SUPABASE.URL, ENV_CONFIG.SUPABASE.SERVICE_KEY);

export const verifySupabaseToken = async (token: string): Promise<AuthenticatedUser> => {
  try {
    const tempClient = createClient(ENV_CONFIG.SUPABASE.URL, ENV_CONFIG.SUPABASE.ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${token}` } }
    });

    const { data: { user }, error } = await tempClient.auth.getUser();
    if (error || !user) throw new Error("Token inválido");

    // 🐘 PERSISTENCIA POLÍGLOTA: 
    // Usamos supabaseAdmin para saltar RLS y asegurar la lectura en Neon
    const { data: profile, error: dbError } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    // Lógica de Prioridad: Neon > Supabase Metadata > Default
    const finalRole = profile?.role || (user.app_metadata?.role as UserRole) || 'Viewer';

    return {
      sub: user.id,
      email: user.email!,
      role: finalRole as UserRole
    };
  } catch (error: any) {
    console.error("🔴 Error en verifySupabaseToken:", error.message);
    throw error;
  }
};

export function setAuthCookie(res: Response, token: string, name: "authToken" | "refreshToken") {
  res.cookie(name, token, {
    httpOnly: true,
    secure: ENV_CONFIG.COOKIES.SECURE,
    sameSite: ENV_CONFIG.COOKIES.SAME_SITE,
    path: "/",
    maxAge: name === "refreshToken" ? 7 * 24 * 60 * 60 * 1000 : 60 * 60 * 1000,
  });
}

export function clearAuthCookies(res: Response) {
  const options = {
    httpOnly: true,
    secure: ENV_CONFIG.COOKIES.SECURE,
    sameSite: ENV_CONFIG.COOKIES.SAME_SITE,
    path: "/",
    expires: new Date(0),
  };
  res.cookie("authToken", "", options);
  res.cookie("refreshToken", "", options);
}

export async function updateUserRole(userId: string, newRole: UserRole) {
  // Sincronización Dual: Neon + Supabase Auth
  await supabase.from("users").update({ role: newRole }).eq("id", userId);
  await supabaseAdmin.auth.admin.updateUserById(userId, {
    app_metadata: { role: newRole }
  });
}

/**
 * Obtiene todos los usuarios directamente de Supabase Auth
 * (Solo para uso administrativo)
 */
export const getAllUsersFromAuth = async () => {
  const { data, error } = await supabaseAdmin.auth.admin.listUsers();
  if (error) {
    console.error("❌ Error al listar usuarios de Auth:", error.message);
    throw error;
  }
  return data.users;
};

/**
 * Renueva el token de acceso usando el refresh token
 */
export async function refreshAuthToken(refreshToken: string) {
  const { data, error } = await supabase.auth.refreshSession({
    refresh_token: refreshToken
  });

  if (error || !data.session) {
    throw new Error("No se pudo renovar la sesión");
  }
  return data.session;
}