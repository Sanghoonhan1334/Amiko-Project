/** @type {import('next').NextConfig} */
const nextConfig = {
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
    
    // 개발 환경에서 청크 분할 비활성화 (모듈 에러 방지)
    if (dev) {
      config.optimization = {
        ...config.optimization,
        splitChunks: false,
      };
    }
    return config;
  },
};

module.exports = nextConfig;
