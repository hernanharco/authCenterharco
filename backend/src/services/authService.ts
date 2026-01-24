import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { Response } from "express";
import { AuthenticatedUser } from "@/types/authTypes";
import { UserRole } from "@/types/permissionTypes";

// * =================================================
//    CLIENTES SUPABASE (SDK CONFIGURATION)
// ================================================= *//

const supabaseUrl = process.env.SUPABASE_URL as string;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY as string;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

/* =================================================
   VALIDACIÓN DE TOKENS (STATELESS VERIFICATION)
================================================= */

/**
 * ✅ VERSIÓN CORREGIDA
 * Valida un JWT de Supabase creando un cliente temporal con el token.
 * Esto resuelve el error "Auth session missing!"
 */
export const verifySupabaseToken = async (token: string): Promise<AuthenticatedUser> => {
  console.log("🛠️ URL de Supabase en uso:", process.env.SUPABASE_URL);

  try {
    // MÉTODO CORRECTO: Crear un cliente temporal con el token específico
    const tempClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    });

    // Ahora getUser() usará el token del header
    const { data: { user }, error } = await tempClient.auth.getUser();

    if (error) {
      console.error("❌ Error de Validación de Supabase:", {
        message: error.message,
        status: error.status
      });
      throw error;
    }

    if (!user) {
      throw new Error("Usuario no encontrado en el token");
    }

    // Obtener el rol desde la tabla users (más confiable que app_metadata)
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.warn("⚠️ No se pudo obtener perfil desde DB, usando metadata");
    }

    const userRole = profile?.role || (user.app_metadata?.role as UserRole) || 'Viewer';

    console.log("✅ Token validado correctamente para:", user.email, "| Rol:", userRole);

    return {
      sub: user.id,
      email: user.email!,
      role: userRole
    };
  } catch (error: any) {
    console.error("🔴 Fallo completo en verifySupabaseToken:", error.message);
    throw error;
  }
};

/* =================================================
   GESTIÓN DE COOKIES (HTTP-ONLY SECURITY)
================================================= */

export function setAuthCookie(
  res: Response,
  token: string,
  name: "authToken" | "refreshToken"
) {
  const isProd = process.env.NODE_ENV === "production";

  res.cookie(name, token, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    path: "/",
    maxAge: name === "refreshToken" ? 604800000 : 3600000
  });
}

export function clearAuthCookies(res: Response) {
  const isProd = process.env.NODE_ENV === "production";
  const options = {
    httpOnly: true,
    expires: new Date(0),
    path: "/",
    sameSite: (isProd ? "none" : "lax") as any,
    secure: isProd
  };
  res.cookie("authToken", "", options);
  res.cookie("refreshToken", "", options);
}

/* =================================================
   REFRESCO DE SESIÓN (SILENT REFRESH LOGIC)
================================================= */

export async function refreshAuthToken(refreshToken: string) {
  try {
    const { data, error } = await supabase.auth.refreshSession({
      refresh_token: refreshToken
    });

    if (error || !data.session) {
      console.error("❌ Error en refresh:", error?.message);
      throw new Error("No se pudo renovar la sesión");
    }

    console.log("🔄 Sesión refrescada exitosamente");
    return data.session;
  } catch (error: any) {
    console.error("🔴 Fallo en refreshAuthToken:", error.message);
    throw error;
  }
}

/* =================================================
   ADMINISTRACIÓN (USER MANAGEMENT)
================================================= */

export const getAllUsersFromAuth = async () => {
  const { data, error } = await supabaseAdmin.auth.admin.listUsers();

  if (error) {
    throw error;
  }

  return data.users;
};

/**
 * ACTUALIZACIÓN DE ROLES (SYNC AUTH + PUBLIC TABLE)
 */
export async function updateUserRole(userId: string, newRole: UserRole) {
  try {
    // 1. Actualizar en la tabla users
    const { error: dbError } = await supabase
      .from("users")
      .update({ 
        role: newRole, 
        updated_at: new Date().toISOString() 
      })
      .eq("id", userId);

    if (dbError) throw new Error(`Error en DB: ${dbError.message}`);

    // 2. Actualizar en Auth metadata
    const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      { 
        app_metadata: { role: newRole },
        user_metadata: { role: newRole }
      }
    );

    if (authError) {
      console.warn("⚠️ Falló Auth, pero DB actualizada");
      throw new Error(`Error en Auth: ${authError.message}`);
    }

    console.log("✅ Rol actualizado correctamente:", newRole);
    return { success: true };
  } catch (error: any) {
    console.error("❌ Fallo en actualización de rol:", error.message);
    throw error;
  }
}