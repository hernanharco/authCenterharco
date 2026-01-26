/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  
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
  
  // 🎯 PROXY INVERSO: Todas las peticiones a /api/v1/* se redirigen a Render
  async rewrites() {
    console.log('🔧 Configurando rewrites del proxy...');
    
    return [
      {
        source: '/api/v1/:path*',
        destination: 'https://authcenterharco-1.onrender.com/api/:path*',
      },
    ];
  },
};

module.exports = nextConfig;