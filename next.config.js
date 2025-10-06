const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  // 환경변수 검증 (빌드 시 실행)
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
  experimental: {
    optimizePackageImports: ['lucide-react'],
    turbo: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js',
        },
      },
    },
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // 컴파일러 최적화
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  // React Strict Mode 설정
  reactStrictMode: true,
  // 웹팩 설정
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
    
    // 모듈 로딩 최적화 (vendors 설정 제거)
    // config.optimization = {
    //   ...config.optimization,
    //   splitChunks: {
    //     chunks: 'all',
    //     cacheGroups: {
    //       default: {
    //         minChunks: 1,
    //         priority: -20,
    //         reuseExistingChunk: true,
    //       },
    //       vendor: {
    //         test: /[\\/]node_modules[\\/]/,
    //         name: 'vendors',
    //         priority: -10,
    //         chunks: 'all',
    //       },
    //     },
    //   },
    // };
    
    return config;
  },
};

module.exports = withBundleAnalyzer(nextConfig);
