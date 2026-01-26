import "dotenv/config";

export const IS_PROD = process.env.NODE_ENV === 'production';

export const ENV_CONFIG = {
  IS_PROD,
  PORT: process.env.PORT || 4000,
  SUPABASE: {
    URL: process.env.SUPABASE_URL as string,
    ANON_KEY: process.env.SUPABASE_ANON_KEY as string,
    SERVICE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY as string,
  },
  CORS: {
    ALLOWED_ORIGINS: (process.env.ALLOWED_ORIGINS || "").split(",").map(o => o.trim()).filter(Boolean),
  },
  COOKIES: {
    // Configuración dinámica: None/Secure para Render, Lax/Insecure para Local
    SAME_SITE: (IS_PROD ? "none" : "lax") as "none" | "lax",
    SECURE: IS_PROD,
  }
};