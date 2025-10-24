'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { CommunityItem } from './communityItems'

interface CommunityCardProps {
  item: CommunityItem
  isNavigating: boolean
  onNavigate: (route: string) => void
}

/**
 * CommunityCard - Card individual del grid de comunidad
 * Weverse-inspired design con glow effect para items nuevos
 */
export default function CommunityCard({ item, isNavigating, onNavigate }: CommunityCardProps) {
  const isImage = item.icon.startsWith('/')

  return (
    <button
      onClick={() => onNavigate(item.route)}
      disabled={isNavigating}
      role="button"
      aria-label={`${item.title}${item.microcopy ? `: ${item.microcopy}` : ''}`}
      className={`
        group relative
        flex flex-col items-center justify-center
        md:bg-white md:dark:bg-gray-800
        md:border md:border-[#F3F4F6] md:dark:border-gray-700
        md:rounded-2xl
        p-2 md:p-5
        transition-all duration-200 ease-out
        md:hover:scale-[1.03] md:hover:shadow-[0_8px_24px_rgba(139,92,246,0.16)]
        active:scale-[0.98]
        focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2
        ${isNavigating ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}
        ${
          item.isNew
            ? 'md:shadow-[0_2px_8px_rgba(0,0,0,0.04),0_0_0_2px_rgba(139,92,246,0.12),0_0_24px_rgba(139,92,246,0.08)]'
            : 'md:shadow-[0_2px_8px_rgba(0,0,0,0.04)]'
        }
      `}
      style={{
        // Glow animation solo para items nuevos (2 ciclos) - solo en desktop
        animation: item.isNew ? 'glow-pulse 2s ease-in-out 2' : undefined,
      }}
    >
      {/* Badge "NUEVO" - Solo para items marcados como nuevos */}
      {item.isNew && item.badge && (
        <div className="absolute top-2 right-2 bg-[#8B5CF6] text-white text-[10px] font-bold px-2 py-1 rounded shadow-sm z-10">
          {item.badge}
        </div>
      )}

      {/* Icono with background container - Fixed height for alignment */}
      <div className="mb-2 md:mb-3 flex items-center justify-center h-20 md:h-auto">
        <div className="relative">
          {/* Background container - only on mobile */}
          <div className="md:hidden">
            <div 
              className="w-16 h-16 rounded-xl flex items-center justify-center border-2 border-gray-200 dark:border-gray-600 transition-all duration-200 group-hover:border-gray-400 dark:group-hover:border-gray-400 group-hover:shadow-md group-hover:scale-110"
            >
              {isImage ? (
                <img
                  src={item.icon}
                  alt={item.title}
                  className="w-8 h-8 object-contain"
                  loading="eager"
                  decoding="async"
                />
              ) : (
                <div className="text-2xl">{item.icon}</div>
              )}
            </div>
          </div>
          
          {/* Desktop - no background container */}
          <div className="hidden md:flex items-center justify-center">
            {isImage ? (
              <img
                src={item.icon}
                alt={item.title}
                className="w-14 h-14 object-contain"
                loading="eager"
                decoding="async"
              />
            ) : (
              <div className="text-5xl">{item.icon}</div>
            )}
          </div>
        </div>
      </div>

      {/* Título - Fixed height for alignment */}
      <div className="h-8 md:h-auto flex items-center justify-center mb-0 md:mb-1">
        <h3 className="text-xs md:text-base font-semibold text-[#111827] dark:text-gray-100 text-center leading-tight">
          {item.title}
        </h3>
      </div>

      {/* Microcopy (opcional) - Solo en desktop */}
      {item.microcopy && (
        <p className="hidden md:block text-xs text-[#6B7280] dark:text-gray-400 text-center leading-[1.4] max-w-[90%]">
          {item.microcopy}
        </p>
      )}

      {/* Hover effect indicator - Solo en desktop */}
      <div
        className="absolute inset-0 md:rounded-2xl opacity-0 md:group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"
        style={{
          background: `linear-gradient(135deg, ${item.accentColor}08 0%, ${item.accentColor}04 100%)`,
        }}
      />
    </button>
  )
}

/**
 * CSS para la animación de glow (agregar al global.css o tailwind.config)
 * 
 * @keyframes glow-pulse {
 *   0%, 100% {
 *     box-shadow: 0 2px 8px rgba(0,0,0,0.04),
 *                 0 0 0 2px rgba(139,92,246,0.12),
 *                 0 0 24px rgba(139,92,246,0.08);
 *   }
 *   50% {
 *     box-shadow: 0 2px 8px rgba(0,0,0,0.04),
 *                 0 0 0 2px rgba(139,92,246,0.2),
 *                 0 0 32px rgba(139,92,246,0.16);
 *   }
 * }
 */

