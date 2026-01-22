/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    dangerouslyAllowSVG: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.googleusercontent.com',
      },
      {
        protocol: 'http',
        hostname: '*.googleusercontent.com',
      },
    ],
  },
  // 🚨 ESTA ES LA PIEZA CLAVE PARA ELIMINAR EL 404
  async rewrites() {
    return [
      {
        // Cuando el frontend pida /api/profiles/..., 
        // Next.js lo pedirá al backend de Express automáticamente.
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_EXPRESS_URL}/api/:path*`,
      },
    ]
  },
};

export default nextConfig;