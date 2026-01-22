"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authService_1 = require("../services/authService");
const router = (0, express_1.Router)();
router.post("/set-cookie", async (req, res) => {
    const { access_token, refresh_token } = req.body;
    if (!access_token || !refresh_token) {
        return res.status(400).json({ message: "Tokens requeridos" });
    }
    try {
        const payload = await (0, authService_1.verifySupabaseToken)(access_token);
        // Establecemos las cookies HttpOnly
        (0, authService_1.setAuthCookie)(res, access_token, "authToken");
        (0, authService_1.setAuthCookie)(res, refresh_token, "refreshToken");
        console.log(`✅ [AuthRoutes] Sesión iniciada para: ${payload.email}`);
        return res.json({
            success: true,
            message: "Sesión iniciada",
            email: payload.email
        });
    }
    catch (error) {
        console.error("❌ [AuthRoutes] Error en set-cookie:", error.message);
        return res.status(401).json({ message: "Token inválido o expirado" });
    }
});
router.post("/logout", (_req, res) => {
    (0, authService_1.clearAuthCookies)(res);
    res.json({ message: "Sesión cerrada" });
});
exports.default = router;
