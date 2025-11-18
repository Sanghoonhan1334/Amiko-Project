'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { AlertTriangle, Shield } from 'lucide-react'
import { useLanguage } from '@/context/LanguageContext'

interface AuthConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: string
  description?: string
  confirmText?: string
  cancelText?: string
}

export default function AuthConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmText,
  cancelText
}: AuthConfirmDialogProps) {
  const router = useRouter()
  const { t } = useLanguage()

  const handleConfirm = () => {
    onOpenChange(false)
    router.push('/verification-center')
  }

  const handleCancel = () => {
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm bg-white border-2 border-gray-200 shadow-xl">
        <DialogHeader className="text-center pb-1">
          <div className="flex justify-center mb-1">
            <AlertTriangle className="w-6 h-6 text-orange-500" />
          </div>
          <DialogTitle className="text-lg">{title || t('auth.authRequired')}</DialogTitle>
          <DialogDescription className="text-sm">
            {description || t('auth.authRequiredDescription')}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-1">
          <Button 
            onClick={handleConfirm}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white py-2 text-base rounded-lg shadow-md hover:shadow-lg transform hover:scale-102 transition-all duration-200"
          >
            <div className="flex items-center justify-center gap-2">
              <Shield className="w-4 h-4" />
              {confirmText || t('auth.goToAuthCenter')}
            </div>
          </Button>
          <Button 
            variant="outline" 
            onClick={handleCancel}
            className="w-full py-2 text-base"
          >
            {cancelText || t('buttons.cancel')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
