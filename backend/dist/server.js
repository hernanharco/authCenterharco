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
 * CONFIGURACIÓN DE CORS
 * Permite que tus dos frontends (AuthCenter y Tapicería) hablen con el backend.
 */
const allowedOrigins = [
    "http://localhost:3000", // Proyecto AuthCenter
    "http://localhost:9002", // Proyecto Web-Tapicería
    "http://127.0.0.1:3000",
    "http://127.0.0.1:9002"
];
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        // Si el origen está en la lista o es una petición local (sin origin), permitir
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        }
        else {
            callback(new Error('Bloqueado por políticas de seguridad SaaS (CORS)'));
        }
    },
    credentials: true, // OBLIGATORIO: Permite recibir y enviar cookies HttpOnly
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));
// Middlewares para procesar JSON y Cookies
app.use(express_1.default.json());
app.use((0, cookie_parser_1.default)());
/**
 * RUTAS
 * Usamos el prefijo /api para mantener el estándar de arquitectura profesional.
 */
app.use("/api", authRoutes_1.default);
app.get("/", (req, res) => {
    res.send("🚀 Servidor Express SaaS funcionando en Linux.");
});
app.listen(PORT, () => {
    console.log(`✅ Backend listo en: http://localhost:${PORT}`);
});
