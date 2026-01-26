import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { corsOptions } from './config/corsConfig';
import { ENV_CONFIG } from './config/env.config';
import authRoutes from './routes/authRoutes';

const app = express();

// 1. Middlewares Globales
// El orden es vital: CORS -> Parsers -> Rutas
app.use(cors(corsOptions));
app.use(cookieParser());
app.use(express.json()); // 👈 Resuelve el error 500 de req.body vacío
app.use(express.urlencoded({ extended: true }));

// 2. Logger de Depuración (Opcional, muy útil para ver el tráfico del proxy)
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} - Origin: ${req.headers.origin}`);
  next();
});

// 3. Rutas
app.use('/api', authRoutes);

// 4. Manejo de Errores Global
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("🔥 Error no manejado:", err.stack);
  res.status(500).json({ success: false, message: "Error interno en el servidor Express" });
});

app.listen(ENV_CONFIG.PORT, () => {
  console.log(`🚀 Servidor Políglota corriendo en http://localhost:${ENV_CONFIG.PORT}`);
  console.log(`🌍 Entorno: ${ENV_CONFIG.IS_PROD ? 'PRODUCCIÓN' : 'DESARROLLO'}`);
});