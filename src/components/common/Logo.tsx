import Image from "next/image";

interface LogoProps {
  className?: string;
  width?: number;
  height?: number;
  priority?: boolean;
}

export function Logo({ 
  className = "", 
  width = 192, 
  height = 64, 
  priority = false 
}: LogoProps) {
  return (
    <div className={`relative select-none ${className}`}>
      {/* 라이트 모드 로고 */}
      <Image
        src="/amiko-logo.png"
        alt="Amiko"
        width={width}
        height={height}
        priority={priority}
        className="block dark:hidden h-12 w-auto object-contain"
      />
      {/* 다크 모드 로고 */}
      <Image
        src="/amiko-logo-dark.png"
        alt="Amiko"
        width={width}
        height={height}
        priority={priority}
        className="hidden dark:block h-12 w-auto object-contain"
      />
    </div>
  );
}
