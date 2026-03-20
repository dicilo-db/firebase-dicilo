// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { dev, isServer }) => {
    // Desactiva la recarga en caliente de webpack en desarrollo para evitar errores de ChunkLoadError
    // en ciertos entornos de red complejos como los de los workstations en la nube.
    // if (dev && !isServer) {
    //   config.watchOptions = {
    //     poll: 1000,
    //     aggregateTimeout: 300,
    //   };
    // }
    // Prevent pdf-parse from being bundled by webpack (it uses fs and dynamic requires)
    config.externals.push({
      'pdf-parse': 'commonjs pdf-parse',
    });
    
    // Enable WebAssembly for firebase-admin dependencies like farmhash-modern
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
    };

    // Ignore Node.js built-in modules on the client side
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        child_process: false,
        dns: false,
        os: false,
        http2: false,
        'node:events': false,
        'node:util': false,
        'node:path': false,
        'node:crypto': false,
        'node:stream': false,
      };
    }

    return config;
  },
  transpilePackages: ['react-markdown', 'remark-gfm', 'recharts'],
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
    serverActions: {
      bodySizeLimit: '100mb',
    },
    serverComponentsExternalPackages: [
      'require-in-the-middle',
      '@opentelemetry/instrumentation',
      '@genkit-ai/core',
      'firebase-admin',
      'farmhash-modern'
    ]
  }
};

module.exports = nextConfig;
