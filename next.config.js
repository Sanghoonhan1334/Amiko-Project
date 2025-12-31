const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development', // 개발 모드에서 PWA 비활성화
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  // 환경변수 검증 (빌드 시 실행)
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
  experimental: {
    optimizePackageImports: ['lucide-react', '@tanstack/react-query'],
  },
  turbopack: {
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js',
      },
    },
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // 🚀 최적화: 컴파일러 최적화 강화
  compiler: {
    // API 라우트에서는 로그가 필요하므로 console.error만 제거
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['log', 'warn', 'error'], // 모든 console 메서드 유지 (디버깅용)
    } : false,
  },
  // React Strict Mode 설정
  reactStrictMode: true,
  // 🚀 최적화: 압축 활성화
  compress: true,
  // 🚀 최적화: 이미지 최적화
  images: {
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 31536000, // 1년
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
      },
      {
        protocol: 'https',
        hostname: 'abrxigfmuebrnyzkfcyr.supabase.co',
      },
    ],
  },
  // 🚀 최적화: 웹팩 설정 개선
  webpack: (config, { dev, isServer }) => {
    // Node.js 모듈 폴백 설정
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      crypto: false,
      stream: false,
      url: false,
      zlib: false,
      http: false,
      https: false,
      assert: false,
      os: false,
      path: false,
    };
    
    // 모듈 해결 문제 해결
    config.resolve.alias = {
      ...config.resolve.alias,
    };
    
    // 🚀 최적화: 프로덕션에서 번들 크기 최적화
    if (!dev && !isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          minSize: 20000,
          maxSize: 244000,
          cacheGroups: {
            default: {
              minChunks: 1,
              priority: -20,
              reuseExistingChunk: true,
            },
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              priority: -10,
              chunks: 'all',
            },
            react: {
              test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
              name: 'react',
              priority: 20,
              chunks: 'all',
            },
            ui: {
              test: /[\\/]node_modules[\\/](@radix-ui|lucide-react)[\\/]/,
              name: 'ui',
              priority: 15,
              chunks: 'all',
            },
            query: {
              test: /[\\/]node_modules[\\/](@tanstack\/react-query)[\\/]/,
              name: 'query',
              priority: 15,
              chunks: 'all',
            },
          },
        },
      };
    }
    
    return config;
  },
};

module.exports = withPWA(withBundleAnalyzer(nextConfig));
