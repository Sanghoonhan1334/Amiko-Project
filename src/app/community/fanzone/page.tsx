'use client'

import React from 'react'
import Header from '@/components/layout/Header'
import BottomTabNavigation from '@/components/layout/BottomTabNavigation'
import FanZoneHomeSimple from '@/components/main/app/community/fanzone/FanZoneHomeSimple'

/**
 * FanZone Main Page
 * Página principal de FanZone con exploración y mis comunidades
 */
export default function FanzonePage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Header con búsqueda */}
      <Header />
      
      {/* Contenido principal */}
      <main className="max-w-6xl mx-auto px-0 pt-20 pb-20 md:px-4 md:pt-40 md:pb-6">
        <FanZoneHomeSimple />
      </main>
      
      {/* Navegación móvil */}
      <BottomTabNavigation />
    </div>
  )
}
