import React from 'react'

interface SeedIconProps {
  className?: string
  size?: number
}

export default function SeedIcon({ className = '', size = 20 }: SeedIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* 씨앗 본체 - 타원형, 약간 기울어진 형태 */}
      <ellipse
        cx="12"
        cy="14"
        rx="5"
        ry="7"
        fill="#8B4513"
        stroke="#654321"
        strokeWidth="1.5"
        transform="rotate(-15 12 14)"
      />
      {/* 씨앗 윗부분 하이라이트 */}
      <ellipse
        cx="11"
        cy="12"
        rx="3"
        ry="4"
        fill="#A0522D"
        transform="rotate(-15 11 12)"
      />
      {/* 씨앗 중간 라인 (세로) */}
      <path
        d="M 11 9 Q 11 14 11 19"
        stroke="#654321"
        strokeWidth="1.2"
        fill="none"
        strokeLinecap="round"
      />
      {/* 씨앗 좌측 라인 (곡선) */}
      <path
        d="M 7 12 Q 9 14 11 16"
        stroke="#654321"
        strokeWidth="0.8"
        fill="none"
        strokeLinecap="round"
      />
      {/* 씨앗 우측 라인 (곡선) */}
      <path
        d="M 15 12 Q 13 14 11 16"
        stroke="#654321"
        strokeWidth="0.8"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  )
}

