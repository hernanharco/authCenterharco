"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const corsConfig_1 = require("./config/corsConfig");
const validateEnv_1 = require("./utils/validateEnv"); // ⬅️ NUEVO
// ⚡ VALIDAR VARIABLES DE ENTORNO ANTES DE INICIAR
(0, validateEnv_1.initEnvValidation)();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 4000;
// 1. CONFIGURACIÓN DE CORS DINÁMICA
app.use((0, cors_1.default)(corsConfig_1.corsOptions));
// 2. MIDDLEWARES GENERALES
app.use(express_1.default.json());
app.use((0, cookie_parser_1.default)());
// 3. REGISTRO DE RUTAS
app.use("/api", authRoutes_1.default);
// Ruta base de salud
app.get("/", (req, res) => {
    res.send("🚀 API SaaS Online (Linux Server)");
});
// 4. MANEJO DE RUTAS NO ENCONTRADAS
app.use((req, res) => {
    res.status(404).json({
        message: `La ruta ${req.originalUrl} no existe.`
    });
});
app.use((err, req, res, next) => {
    const status = err.status || 500;
    const message = err.message || "Error interno del servidor";
    console.error(`\x1b[31m[ERROR] ${req.method} ${req.url}\x1b[0m`);
    console.error(err.stack);
    res.status(status).json({
        success: false,
        message,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack, details: err })
    });
});
// 6. INICIO DEL SERVIDOR
app.listen(PORT, () => {
    console.log(`✅ Servidor SaaS corriendo en: http://localhost:${PORT}`);
    console.log(`🏠 Orígenes permitidos: ${process.env.FRONTEND_URL} y ${process.env.AUTH_FRONTEND_URL}`);
}).on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`❌ El puerto ${PORT} está ocupado. Usa 'fuser -k ${PORT}/tcp'`);
    }
    else {
        console.error("❌ Error al arrancar:", err.message);
    }
});
