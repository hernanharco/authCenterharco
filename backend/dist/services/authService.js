"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllUsersFromAuth = exports.supabaseAdmin = exports.supabase = void 0;
exports.verifySupabaseToken = verifySupabaseToken;
exports.setAuthCookie = setAuthCookie;
exports.clearAuthCookies = clearAuthCookies;
require("dotenv/config");
const supabase_js_1 = require("@supabase/supabase-js");

exports.supabase = (0, supabase_js_1.createClient)(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
exports.supabaseAdmin = (0, supabase_js_1.createClient)(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function verifySupabaseToken(token) {
    const { data: { user }, error } = await exports.supabase.auth.getUser(token);
    if (error || !user)
        throw new Error(error?.message || 'Token inválido');
    return user;
}

/**
 * MEJORA ARQUITECTÓNICA: Manejo dinámico de Cookies para SaaS
 */
function setAuthCookie(res, token, name) {
    // Si la petición viene de un localhost, relajamos la seguridad para pruebas
    const isLocalRequest = res.req.headers.origin?.includes('localhost');

    res.cookie(name, token, {
        httpOnly: true,
        // Si es local, secure debe ser false, si es producción real, true
        secure: isLocalRequest ? false : true, 
        // SameSite 'none' requiere HTTPS. Si es local usamos 'lax'
        sameSite: isLocalRequest ? "lax" : "none",
        path: "/",
        maxAge: name === "refreshToken" ? 604800000 : 3600000,
    });
}

function clearAuthCookies(res) {
    const isProd = process.env.NODE_ENV === "production";
    
    const options = { 
        httpOnly: true, 
        path: "/",
        secure: isProd,
        sameSite: isProd ? "none" : "lax"
    };
    
    res.clearCookie("authToken", options);
    res.clearCookie("refreshToken", options);
}

const getAllUsersFromAuth = async () => {
    const { data, error } = await exports.supabaseAdmin.auth.admin.listUsers();
    if (error)
        throw error;
    return data.users;
};
exports.getAllUsersFromAuth = getAllUsersFromAuth;