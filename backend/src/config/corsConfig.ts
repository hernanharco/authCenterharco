import { CorsOptions } from 'cors';

/**
 * Orígenes permitidos para desarrollo y producción
 */
const allowedOrigins = [
  process.env.FRONTEND_URL,          // AuthCenter (localhost:3000)
  process.env.AUTH_FRONTEND_URL,     // AuthCenter alternativo
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  
  // Tapicería - Desarrollo
  'http://localhost:9002',
  'http://127.0.0.1:9002',
  
  // Otras apps que uses
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  
  // Producción (cuando despliegues)
  process.env.TAPICERIA_PRODUCTION_URL, // Añadir en .env
].filter(Boolean) as string[];

export const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    // Permitir si no hay origen (Postman, requests del servidor)
    if (!origin) {
      return callback(null, true);
    }
    
    // Verificar si está en la lista de permitidos
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    // En desarrollo, permitir cualquier localhost
    if (process.env.NODE_ENV === 'development' && origin.includes('localhost')) {
      return callback(null, true);
    }

    console.warn(`❌ Origen bloqueado por CORS: ${origin}`);
    callback(new Error('No permitido por CORS'));
  },
  credentials: true, // ⬅️ CRÍTICO para cookies cross-origin
  methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  exposedHeaders: ["Set-Cookie"] // Permitir que el navegador vea las cookies
};