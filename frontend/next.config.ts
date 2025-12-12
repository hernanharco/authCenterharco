import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* Opciones de configuración del compilador (si las tienes) */
  reactCompiler: true, // Mantienes esta opción si la estás usando

  // ⚠️ CONFIGURACIÓN DE IMÁGENES AGREGADA AQUÍ
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'i.pravatar.cc',
        // Opcionalmente, puedes añadir port: '' si fuera necesario, 
        // pero para i.pravatar.cc no lo es.
      },
    ],
  },
};

export default nextConfig;