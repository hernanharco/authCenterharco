import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import jwt, { JwtPayload } from "jsonwebtoken";
import { Response } from "express";

// 🛑 IMPORTACIÓN CLAVE: Usamos el tipo centralizado
import { AuthenticatedUser } from "@/types/express.d";

// -------------------- CONFIG --------------------
// Asegúrate de que tus variables de entorno estén configuradas
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
  // Propiedades adicionales de JWT (como email, iss, aud, iat, exp, etc.)
  [key: string]: any;
}

// -------------------- FUNCIONES --------------------

/**
 * Verifica un JWT emitido por Supabase
 */
export async function verifySupabaseToken(
  token: string
): Promise<SupabaseJwtPayload> {
  if (!token) throw new Error("No se proporcionó token.");
  try {
    return jwt.verify(token, SUPABASE_JWT_SECRET) as SupabaseJwtPayload;
  } catch {
    throw new Error("Token inválido o expirado.");
  }
}

/**
 * Obtiene los datos clave del usuario (rol, nombre, avatar, email) desde la DB.
 * Combinamos datos de auth.users (metadata) y la tabla de perfiles (Users).
 */
export async function getUserDashboardData(
  userId: string
): Promise<
  Pick<AuthenticatedUser, "role" | "name" | "avatar" | "email" | "id">
> {
  if (!userId) {
    return {
      id: "",
      role: "unauthenticated",
      name: "Invitado",
      avatar: "",
      email: null,
    };
  }

  // 1. Obtener Metadatos de auth.users (donde están name y avatar)
  // Usamos el cliente admin para acceder a auth.users de forma segura
  const { data: userDataAuth, error: errorAuth } =
    await supabase.auth.admin.getUserById(userId);

  if (errorAuth || !userDataAuth.user) {
    console.error("Error al consultar auth.users por ID:", errorAuth?.message);
    // Fallback si falla la autenticación (no deberia pasar despues de verifySupabaseToken)
    return {
      id: userId,
      role: "authenticated",
      name: "Usuario",
      avatar: "",
      email: null,
    };
  }

  const metadata = userDataAuth.user.user_metadata || {};
  const authEmail = userDataAuth.user.email ?? null;
  const authRole = userDataAuth.user.role ?? "authenticated"; // Rol de Supabase (e.g., authenticated)

  // Fallback para name y avatar desde metadata
  const nameFromMeta =
    metadata.full_name ||
    metadata.name ||
    authEmail?.split("@")[0] ||
    "Usuario";
  const avatarFromMeta = metadata.picture || metadata.avatar_url || "";

  // ----------------------------------------------------------------------
  // 2. Obtener Rol Personalizado de la tabla pública (Users)
  // IMPORTANTE: Aquí se espera el nombre de tabla 'Users'
  const { data: profileData, error: errorProfile } = await supabase
    .from("Users") // 🟢 CORRECCIÓN: Usando 'Users' (Mayúscula y Plural)
    .select("role")
    .eq("id", userId)
    .maybeSingle();

  if (errorProfile) {
    console.error(
      "Error al consultar tabla de perfiles (Users):",
      errorProfile
    );
    // Continuamos con el rol de Supabase si la consulta falla
  }

  // 3. Combinar y Retornar
  const result: Pick<
    AuthenticatedUser,
    "role" | "name" | "avatar" | "email" | "id"
  > = {
    id: userId,
    // Usamos el rol de la tabla 'Users' si existe, sino el de Supabase (authRole)
    role: profileData?.role ?? authRole,
    name: nameFromMeta,
    avatar: avatarFromMeta,
    email: authEmail,
  };

  return result;
}

/**
 * Obtiene el rol real del usuario desde Supabase
 * (Aún requiere corrección de nomenclatura de tabla)
 */
export async function getUserRole(userId: string): Promise<string> {
  if (!userId) return "unauthenticated";

  // 🟢 CORRECCIÓN: Usando 'Users'
  const { data, error } = await supabase
    .from("Users")
    .select("role")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    console.error("Error al consultar rol:", error);
    // Si la tabla personalizada falla, consulta el usuario de auth.users para el rol de fallback
    const { data: authData } = await supabase.auth.admin.getUserById(userId);
    return authData?.user?.role ?? "authenticated";
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
  const maxAge =
    name === "refreshToken" ? REFRESH_TOKEN_MAX_AGE : ACCESS_TOKEN_MAX_AGE;

  res.cookie(name, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
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
    sameSite: "lax" as const,
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
  const { data, error } = await supabase.auth.refreshSession({
    refresh_token: refreshToken,
  });

  if (error) throw error;
  if (!data.session) throw new Error("Sesión vacía de Supabase.");

  return data.session;
}

/**
 * Consulta y devuelve los datos completos de todos los usuarios.
 * Requiere una clave con privilegios (como service_role).
 */
export const getAllUsers = async (): Promise<AuthenticatedUser[]> => {
  // Usamos supabase.auth.admin para acceder a la lista de usuarios
  const { data, error } = await supabase.auth.admin.listUsers();

  if (error) {
    console.error("Error al obtener la lista de usuarios:", error.message);
    throw new Error("Error en la consulta de usuarios.");
  }

  // Mapeamos para obtener el formato AuthenticatedUser
  return data.users.map((user) => {
    // 1. CORRECCIÓN DE TIPOS: Aseguramos que el email sea string | null
    const email: string | null = user.email ?? null;

    // 2. Lógica de Fallback para nombre y avatar
    const name =
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      email?.split("@")[0] ||
      "Usuario";
    const avatar =
      user.user_metadata?.picture || user.user_metadata?.avatar_url || "";

    const authenticatedUser: AuthenticatedUser = {
      // 3. CORRECCIÓN TS2783: Spread primero (para [key: string]: any)
      ...user,

      // 4. Sobrescribimos propiedades clave con los valores corregidos/garantizados
      id: user.id,
      email: email,
      role: user.role || "authenticated",
      name,
      avatar,
      // Opcional: limpiar metadatos de Supabase si no son necesarios
      user_metadata: user.user_metadata,
    };

    return authenticatedUser;
  });
};
