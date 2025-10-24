'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/layout/Header'
import BottomTabNavigation from '@/components/layout/BottomTabNavigation'
import CreateRoomForm from '@/components/main/app/community/fanzone/CreateRoomForm'

/**
 * CreateRoomPage - Página para crear un nuevo FanRoom
 */
export default function CreateRoomPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Header */}
      <Header />
      
      {/* Contenido principal */}
      <main className="max-w-2xl mx-auto px-4 pt-4 pb-20 md:pt-24 md:pb-6">
        <CreateRoomForm />
      </main>
      
      {/* Navegación móvil */}
      <BottomTabNavigation />
    </div>
  )
}
