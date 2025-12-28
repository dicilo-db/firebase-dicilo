// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { dev, isServer }) => {
    // Desactiva la recarga en caliente de webpack en desarrollo para evitar errores de ChunkLoadError
    // en ciertos entornos de red complejos como los de los workstations en la nube.
    if (dev && !isServer) {
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
      };
    }
    // Prevent pdf-parse from being bundled by webpack (it uses fs and dynamic requires)
    config.externals.push({
      'pdf-parse': 'commonjs pdf-parse',
    });
    return config;
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**',
        port: '',
        pathname: '/**',
      },
    ],
  },
  experimental: {
    serverComponentsExternalPackages: [
      'require-in-the-middle',
      '@opentelemetry/instrumentation',
      '@genkit-ai/core'
    ]
  }
};

module.exports = nextConfig;
