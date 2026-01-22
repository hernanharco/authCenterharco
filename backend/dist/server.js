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
console.log("🚀 [DEBUG] Iniciando script server.ts...");
// CONFIGURACIÓN CRÍTICA DE CORS PARA COOKIES
app.use((0, cors_1.default)({
    origin: "http://localhost:3000", // Tu Frontend Next.js
    credentials: true, // PERMITE RECIBIR/ENVIAR COOKIES
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));
app.use(express_1.default.json());
app.use((0, cookie_parser_1.default)());
// Rutas
app.use("/auth", authRoutes_1.default);
app.get("/", (req, res) => {
    res.send("Backend SaaS Online");
});
app.listen(PORT, () => {
    console.log(`✅ Servidor SaaS corriendo en: http://localhost:${PORT}`);
}).on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`❌ El puerto ${PORT} está ocupado. Usa 'fuser -k ${PORT}/tcp'`);
    }
    else {
        console.error("❌ Error al arrancar:", err.message);
    }
});
