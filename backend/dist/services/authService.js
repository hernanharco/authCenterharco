"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.supabase = void 0;
exports.verifySupabaseToken = verifySupabaseToken;
exports.setAuthCookie = setAuthCookie;
exports.clearAuthCookies = clearAuthCookies;
exports.refreshAuthToken = refreshAuthToken;
exports.getUserRole = getUserRole;
require("dotenv/config");
const supabase_js_1 = require("@supabase/supabase-js");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
// -------------------- CONFIGURACIÓN --------------------
exports.supabase = (0, supabase_js_1.createClient)(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
const SUPABASE_JWT_SECRET = process.env.SUPABASE_JWT_SECRET?.trim();
const ACCESS_TOKEN_MAX_AGE = 60 * 60 * 1000; // 1h
const REFRESH_TOKEN_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7d
// -------------------- FUNCIONES CORE --------------------
async function verifySupabaseToken(token) {
    if (!token)
        throw new Error('Token no proporcionado');
    const decoded = jsonwebtoken_1.default.decode(token, { complete: true });
    const alg = decoded?.header?.alg;
    console.log(`🔍 [AuthService] Detectado Algoritmo: ${alg}`);
    try {
        // Intentamos verificar con el algoritmo detectado
        return jsonwebtoken_1.default.verify(token, SUPABASE_JWT_SECRET, {
            algorithms: [alg || 'HS256', 'ES256'],
        });
    }
    catch (err) {
        console.log('🔄 [AuthService] Reintentando con Buffer Base64...');
        return jsonwebtoken_1.default.verify(token, Buffer.from(SUPABASE_JWT_SECRET, 'base64'), {
            algorithms: [alg || 'HS256', 'ES256'],
        });
    }
}
function setAuthCookie(res, token, name) {
    res.cookie(name, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: name === 'refreshToken' ? REFRESH_TOKEN_MAX_AGE : ACCESS_TOKEN_MAX_AGE,
    });
}
function clearAuthCookies(res) {
    const options = { expires: new Date(0), path: '/' };
    res.cookie('authToken', '', options);
    res.cookie('refreshToken', '', options);
}
async function refreshAuthToken(refreshToken) {
    const { data, error } = await exports.supabase.auth.refreshSession({
        refresh_token: refreshToken,
    });
    if (error || !data.session)
        throw new Error('Refresh inválido');
    return data.session;
}
async function getUserRole(userId) {
    const { data, error } = await exports.supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .single();
    if (error || !data) {
        console.warn(`⚠️ [AuthService] No se encontró rol para usuario ${userId}, asignando 'user' por defecto`);
        return 'user';
    }
    return data.role;
}
