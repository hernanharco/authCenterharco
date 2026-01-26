import { CorsOptions } from 'cors';

// 1. Obtenemos la cadena de Render y la convertimos en Array
// 2. Usamos trim() para evitar errores de espacios como el que vimos antes
const allowedOrigins = (process.env.ALLOWED_ORIGINS || "")
  .split(",")
  .map(o => o.trim())
  .filter(Boolean);

export const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    // Permitir peticiones sin origen (como servidores o herramientas internas)
    if (!origin) return callback(null, true);

    // Verificación dinámica
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    // Comodín para desarrollo local si no quieres llenar el .env de localhost
    if (process.env.NODE_ENV === 'development' && 
       (origin.includes('localhost') || origin.includes('127.0.0.1'))) {
      return callback(null, true);
    }

    console.warn(`❌ Bloqueado por CORS: ${origin}`);
    callback(new Error('No permitido por CORS'));
  },
  credentials: true, // INDISPENSABLE para tus cookies de sesión
  methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept"],
  exposedHeaders: ["Set-Cookie"]
};