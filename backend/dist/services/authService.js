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
    // IMPORTANTE: En producción (Vercel/Render), siempre forzamos seguridad máxima
    // Solo relajamos si estamos explícitamente en localhost
    const origin = res.req.headers.origin || "";
    const isLocal = origin.includes('localhost');

    res.cookie(name, token, {
        httpOnly: true,
        // En Vercel/Render esto DEBE ser true. En local DEBE ser false.
        secure: isLocal ? false : true, 
        // 'none' es obligatorio para que Vercel (dominio A) acepte cookies de Render (dominio B)
        sameSite: isLocal ? "lax" : "none",
        path: "/",
        maxAge: name === 'refreshToken' ? 7 * 24 * 60 * 60 * 1000 : 60 * 60 * 1000,
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