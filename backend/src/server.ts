import "dotenv/config";
import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRoutes from "@/routes/authRoutes";
import { corsOptions } from "@/config/corsConfig";
import { initEnvValidation } from "@/utils/validateEnv"; // ⬅️ NUEVO

// ⚡ VALIDAR VARIABLES DE ENTORNO ANTES DE INICIAR
initEnvValidation();

const app = express();
const PORT = process.env.PORT || 4000;

// 1. CONFIGURACIÓN DE CORS DINÁMICA
app.use(cors(corsOptions));

// 2. MIDDLEWARES GENERALES
app.use(express.json());
app.use(cookieParser());

// 3. REGISTRO DE RUTAS
app.use("/api", authRoutes); 

// Ruta base de salud
app.get("/", (req: Request, res: Response) => {
  res.send("🚀 API SaaS Online (Linux Server)");
});

// 4. MANEJO DE RUTAS NO ENCONTRADAS
app.use((req: Request, res: Response) => {
  res.status(404).json({ 
    message: `La ruta ${req.originalUrl} no existe.` 
  });
});

// 5. MANEJO DE ERRORES GLOBAL
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
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
}).on('error', (err: any) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ El puerto ${PORT} está ocupado. Usa 'fuser -k ${PORT}/tcp'`);
  } else {
    console.error("❌ Error al arrancar:", err.message);
  }
});