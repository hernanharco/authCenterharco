"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hasRole = void 0;
exports.authenticateToken = authenticateToken;
const authService_1 = require("@/services/authService");
async function authenticateToken(req, res, next) {
    const token = req.cookies?.authToken;
    if (!token)
        return res.status(401).json({ message: "No autenticado" });
    try {
        const payload = await (0, authService_1.verifySupabaseToken)(token);
        const role = await (0, authService_1.getUserRole)(payload.sub);
        req.user = {
            id: payload.sub,
            email: payload.email,
            role,
        };
        next();
    }
    catch (err) {
        return res.status(401).json({ message: "Token inválido" });
    }
}
const hasRole = (requiredRole) => (req, res, next) => {
    if (req.user?.role !== requiredRole) {
        return res.status(403).json({
            message: `Se requiere rol ${requiredRole}`,
        });
    }
    next();
};
exports.hasRole = hasRole;
