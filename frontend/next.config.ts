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
    domains: [
      // Añade este dominio para las imágenes de perfil de Google
      'lh3.googleusercontent.com', 
      // Añade también los dominios de los mocks si los vas a usar:
      'i.pravatar.cc'
    ],
  },
};

export default nextConfig;