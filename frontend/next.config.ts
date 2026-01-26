/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  
  images: {
    dangerouslyAllowSVG: true,
    remotePatterns: [
      { protocol: 'https', hostname: '*.googleusercontent.com' },
      { protocol: 'http', hostname: '*.googleusercontent.com' },
    ],
  },
  
  async rewrites() {
    const isDev = process.env.NODE_ENV === 'development';
    
    // 🔀 Selección dinámica de destino
    const backendUrl = isDev 
      ? 'http://127.0.0.1:4000/api' // Local (Linux)
      : 'https://authcenterharco-1.onrender.com/api'; // Producción (Render)

    console.log(`📡 Proxy activo: /api/v1/ -> ${backendUrl}`);

    return [
      {
        source: '/api/v1/:path*',
        destination: `${backendUrl}/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;