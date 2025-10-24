'use client'

import React, { ReactNode } from 'react'

/**
 * ClientProviders - Proveedores de contexto para FanZone
 * Contiene toda la lógica del lado del cliente
 */
export default function ClientProviders({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {children}
    </div>
  )
}
