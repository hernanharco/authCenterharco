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

const app = (0, express_1.default)();
const PORT = process.env.PORT || 4000;

/**
 * CONFIGURACIÓN DE CORS DINÁMICA
 * Extraemos los orígenes permitidos desde el .env
 */
const allowedOrigins = process.env.ALLOWED_ORIGINS 
    ? process.env.ALLOWED_ORIGINS.split(",").map(origin => origin.trim())
    : [];

app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        // 1. Permitir peticiones sin 'origin' (como Postman o Server-to-Server)
        // 2. Verificar si el origen del navegador está en nuestra lista blanca
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            console.error(`❌ Origen no permitido por CORS: ${origin}`);
            callback(new Error('Bloqueado por políticas de seguridad SaaS (CORS)'));
        }
    },
    credentials: true,
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express_1.default.json());
app.use((0, cookie_parser_1.default)());

/**
 * RUTAS
 */
app.use("/api", authRoutes_1.default);

app.get("/", (req, res) => {
    res.send("🚀 Servidor Express SaaS funcionando en Linux.");
});

app.listen(PORT, () => {
    console.log(`✅ Backend listo en puerto: ${PORT}`);
    console.log(`🌍 Orígenes permitidos: ${allowedOrigins.join(" | ")}`);
});