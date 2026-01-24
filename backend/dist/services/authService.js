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
function setAuthCookie(res, token, name) {
    const isProd = process.env.NODE_ENV === "production";
    res.cookie(name, token, {
        httpOnly: true,
        secure: isProd,
        sameSite: isProd ? "none" : "lax",
        path: "/",
        domain: "localhost", // Asegura que todos los puertos de localhost compartan la cookie
        maxAge: name === "refreshToken" ? 604800000 : 3600000,
    });
}
function clearAuthCookies(res) {
    const options = { httpOnly: true, path: "/", domain: "localhost" };
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
