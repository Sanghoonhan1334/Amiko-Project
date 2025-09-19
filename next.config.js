/** @type {import('next').NextConfig} */
const nextConfig = {
  // 환경변수 검증 (빌드 시 실행)
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
  experimental: {
    optimizePackageImports: ['lucide-react'],
    reactCompiler: false,
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
  // React 19 호환성 설정
  reactStrictMode: true,
  // 웹팩 설정
  webpack: (config, { dev, isServer }) => {
    // React 19 호환성을 위한 설정
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };
    
    // 빌드 시 환경변수 검증
    if (!dev && isServer) {
      try {
        require('./src/lib/env-guard');
      } catch (error) {
        console.error('환경변수 검증 중 오류 발생:', error);
        process.exit(1);
      }
    }
    
    return config;
  },
};

module.exports = nextConfig;
