import "dotenv/config";
<<<<<<< HEAD
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/authRoutes";

const app = express();
const PORT = process.env.PORT || 4000;

// 1. CONFIGURACIÓN DE CORS
// Permite que tu frontend (localhost:3000) envíe cookies al backend
app.use(cors({
  origin: "http://localhost:3000", 
  credentials: true,               
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

// 2. MIDDLEWARES GENERALES
app.use(express.json());
app.use(cookieParser());

// 3. REGISTRO DE RUTAS
// Todas las rutas dentro de authRoutes tendrán el prefijo /auth
app.use("/auth", authRoutes);

// Ruta base de salud
app.get("/", (req, res) => {
  res.send("🚀 API SaaS Online (Linux Server)");
});

// 4. MANEJO DE RUTAS NO ENCONTRADAS (Para evitar el 404 vacío)
app.use((req, res) => {
  res.status(404).json({ 
    message: `La ruta ${req.originalUrl} no existe en este servidor.` 
  });
});

// 5. INICIO DEL SERVIDOR
app.listen(PORT, () => {
  console.log(`✅ Servidor SaaS corriendo en: http://localhost:${PORT}`);
  console.log(`👉 Ruta perfil disponible en: http://localhost:${PORT}/auth/perfil`);
}).on('error', (err: any) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ El puerto ${PORT} está ocupado. Usa 'fuser -k ${PORT}/tcp'`);
  } else {
    console.error("❌ Error al arrancar:", err.message);
  }
});
=======
import express, { Request, Response } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/authRoutes";
//import "./types/express";

const app = express();
const PORT = process.env.PORT || 3000;
const FRONTEND_URL = process.env.NEXT_PUBLIC_FRONTEND_URL || "http://localhost:3001";

// --- CORS con cookies ---
app.use(
  cors({
    origin: FRONTEND_URL,
    credentials: true,
  })
);

// Body parser JSON
app.use(express.json());

// Parseo de cookies
app.use(cookieParser());

// Rutas
app.use("/auth", authRoutes);

// Ruta de prueba
app.get("/", (req: Request, res: Response) => {
  res.send("Servidor de autenticación Express + TypeScript funcionando.");
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
  console.log(`CORS habilitado para: ${FRONTEND_URL}`);
});
>>>>>>> ecf70a1023dc14ecb200f4d29839e2b82f107d0c
