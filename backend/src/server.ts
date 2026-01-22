import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/authRoutes";

const app = express();
const PORT = process.env.PORT || 4000;

/// 1. CONFIGURACIÓN DE CORS
app.use(cors({
  origin: "http://localhost:3000", 
  credentials: true,               
  methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"], // Agregamos PATCH para los roles
  allowedHeaders: ["Content-Type", "Authorization"]
}));

// 2. MIDDLEWARES GENERALES
app.use(express.json());
app.use(cookieParser());

// 3. REGISTRO DE RUTAS CON PREFIJO GLOBAL /api
// Esto es estándar en arquitectura SaaS
app.use("/api", authRoutes); 

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
  console.log(`👉 Ruta perfil disponible en: http://localhost:${PORT}/api/perfil`);
}).on('error', (err: any) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ El puerto ${PORT} está ocupado. Usa 'fuser -k ${PORT}/tcp'`);
  } else {
    console.error("❌ Error al arrancar:", err.message);
  }
});
