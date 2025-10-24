'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Plus, Sparkles } from 'lucide-react'
import fanzoneEs from '@/i18n/community/es'

interface CreateFanzoneFABProps {
  onCreateClick: () => void
}

/**
 * CreateFanzoneFAB - Botón flotante para crear FanRoom
 * Posicionado fixed en la esquina inferior derecha
 */
export default function CreateFanzoneFAB({ onCreateClick }: CreateFanzoneFABProps) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div className="fixed bottom-20 right-4 z-50 md:bottom-6">
      {/* Tooltip */}
      {isHovered && (
        <div className="absolute bottom-full right-0 mb-2 bg-gray-900 text-white text-sm px-3 py-2 rounded-lg shadow-lg whitespace-nowrap">
          Crear FanRoom
          <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
        </div>
      )}

      {/* FAB Principal */}
      <Button
        size="lg"
        onClick={onCreateClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="w-14 h-14 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 active:scale-95"
      >
        <Plus className="w-6 h-6 text-white" />
      </Button>

      {/* Efecto de brillo sutil */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 opacity-20 animate-pulse"></div>
      
      {/* Partículas decorativas (opcional) */}
      <div className="absolute -top-1 -right-1">
        <Sparkles className="w-4 h-4 text-purple-400 animate-bounce" />
      </div>
    </div>
  )
}
