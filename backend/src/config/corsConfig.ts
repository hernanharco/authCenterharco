import { CorsOptions } from 'cors';
import { ENV_CONFIG } from './env.config';

export const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    // Permitir si no hay origen (Postman)
    if (!origin) return callback(null, true);

    const isAllowed = ENV_CONFIG.CORS.ALLOWED_ORIGINS.includes(origin);
    const isLocal = origin.includes('localhost') || origin.includes('127.0.0.1');

    // Si es producción, solo permitimos la lista oficial
    // Si es desarrollo, permitimos local + lista oficial
    if (isAllowed || (!ENV_CONFIG.IS_PROD && isLocal)) {
      callback(null, true);
    } else {
      console.warn(`🚫 CORS bloqueado para: ${origin}`);
      callback(new Error('No permitido por CORS'));
    }
  },
  credentials: true, // Vital para recibir cookies de Vercel
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "Accept", "X-Requested-With", "Origin"],
  exposedHeaders: ["Set-Cookie"]
};