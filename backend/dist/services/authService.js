"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllUsersFromAuth = exports.verifySupabaseToken = exports.supabaseAdmin = exports.supabase = void 0;
exports.setAuthCookie = setAuthCookie;
exports.clearAuthCookies = clearAuthCookies;
exports.refreshAuthToken = refreshAuthToken;
exports.updateUserRole = updateUserRole;
require("dotenv/config");
const supabase_js_1 = require("@supabase/supabase-js");
// * =================================================
//    CLIENTES SUPABASE (SDK CONFIGURATION)
// ================================================= *//
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
exports.supabase = (0, supabase_js_1.createClient)(supabaseUrl, supabaseAnonKey);
exports.supabaseAdmin = (0, supabase_js_1.createClient)(supabaseUrl, supabaseServiceKey);
/* =================================================
   VALIDACIÓN DE TOKENS (STATELESS VERIFICATION)
================================================= */
/**
 * ✅ VERSIÓN CORREGIDA
 * Valida un JWT de Supabase creando un cliente temporal con el token.
 * Esto resuelve el error "Auth session missing!"
 */
const verifySupabaseToken = async (token) => {
    console.log("🛠️ URL de Supabase en uso:", process.env.SUPABASE_URL);
    try {
        // MÉTODO CORRECTO: Crear un cliente temporal con el token específico
        const tempClient = (0, supabase_js_1.createClient)(supabaseUrl, supabaseAnonKey, {
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
        const { data: profile, error: profileError } = await exports.supabase
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single();
        if (profileError) {
            console.warn("⚠️ No se pudo obtener perfil desde DB, usando metadata");
        }
        const userRole = profile?.role || user.app_metadata?.role || 'Viewer';
        console.log("✅ Token validado correctamente para:", user.email, "| Rol:", userRole);
        return {
            sub: user.id,
            email: user.email,
            role: userRole
        };
    }
    catch (error) {
        console.error("🔴 Fallo completo en verifySupabaseToken:", error);
        throw error;
    }
};
exports.verifySupabaseToken = verifySupabaseToken;
/* =================================================
   GESTIÓN DE COOKIES (HTTP-ONLY SECURITY)
================================================= */
function setAuthCookie(res, token, name) {
    // Detectamos el origen para saber si estamos en local o en producción
    const origin = res.req.headers.origin || "";
    const isLocal = origin.includes('localhost');
    // Detección estricta para producción Vercel + Render
    const isVercelProduction = origin.includes('.vercel.app') || origin.includes('.render.com');
    // Configuración estricta para producción cross-site
    const cookieConfig = {
        httpOnly: true,
        // Siempre true en producción (Vercel -> Render), false solo en localhost
        secure: isLocal ? false : true,
        // Siempre 'none' en producción cross-site, 'lax' solo en localhost
        sameSite: (isLocal ? "lax" : "none"),
        path: "/",
        // Si es el authToken dura 1 hora, si es refreshToken dura 1 semana
        maxAge: name === 'refreshToken' ? 7 * 24 * 60 * 60 * 1000 : 60 * 60 * 1000,
    };
    res.cookie(name, token, cookieConfig);
    console.log(`🍪 Cookie ${name} configurada:`);
    console.log(`   - Origen: ${origin}`);
    console.log(`   - Secure: ${cookieConfig.secure}`);
    console.log(`   - SameSite: ${cookieConfig.sameSite}`);
    console.log(`   - Es producción Vercel: ${isVercelProduction}`);
}
function clearAuthCookies(res) {
    // Detectamos el origen para saber si estamos en local o en producción
    const origin = res.req.headers.origin || "";
    const isLocal = origin.includes('localhost');
    // Configuración consistente con setAuthCookie
    const options = {
        httpOnly: true,
        expires: new Date(0),
        path: "/",
        sameSite: (isLocal ? "lax" : "none"),
        secure: !isLocal // true en producción, false en localhost
    };
    res.cookie("authToken", "", options);
    res.cookie("refreshToken", "", options);
    console.log("🗑️ Cookies eliminadas con configuración:", {
        origin,
        secure: options.secure,
        sameSite: options.sameSite
    });
}
/* =================================================
   REFRESCO DE SESIÓN (SILENT REFRESH LOGIC)
================================================= */
async function refreshAuthToken(refreshToken) {
    try {
        const { data, error } = await exports.supabase.auth.refreshSession({
            refresh_token: refreshToken
        });
        if (error || !data.session) {
            console.error("❌ Error en refresh:", error?.message);
            throw new Error("No se pudo renovar la sesión");
        }
        console.log("🔄 Sesión refrescada exitosamente");
        return data.session;
    }
    catch (error) {
        console.error("🔴 Fallo en refreshAuthToken:", error);
        throw error;
    }
}
/* =================================================
   ADMINISTRACIÓN (USER MANAGEMENT)
================================================= */
const getAllUsersFromAuth = async () => {
    const { data, error } = await exports.supabaseAdmin.auth.admin.listUsers();
    if (error) {
        throw error;
    }
    return data.users;
};
exports.getAllUsersFromAuth = getAllUsersFromAuth;
/**
 * ACTUALIZACIÓN DE ROLES (SYNC AUTH + PUBLIC TABLE)
 */
async function updateUserRole(userId, newRole) {
    try {
        // 1. Actualizar en la tabla users
        const { error: dbError } = await exports.supabase
            .from("users")
            .update({
            role: newRole,
            updated_at: new Date().toISOString()
        })
            .eq("id", userId);
        if (dbError)
            throw new Error(`Error en DB: ${dbError.message}`);
        // 2. Actualizar en Auth metadata
        const { error: authError } = await exports.supabaseAdmin.auth.admin.updateUserById(userId, {
            app_metadata: { role: newRole },
            user_metadata: { role: newRole }
        });
        if (authError) {
            console.warn("⚠️ Falló Auth, pero DB actualizada");
            throw new Error(`Error en Auth: ${authError.message}`);
        }
        console.log("✅ Rol actualizado correctamente:", newRole);
        return { success: true };
    }
    catch (error) {
        console.error("❌ Fallo en actualización de rol:", error);
        throw error;
    }
}
