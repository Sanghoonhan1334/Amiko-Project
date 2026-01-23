'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Info } from 'lucide-react'
import { useLanguage } from '@/context/LanguageContext'

interface DanceGuideModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function DanceGuideModal({ isOpen, onClose }: DanceGuideModalProps) {
  const { t, language } = useLanguage()

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-md max-h-[85vh] overflow-y-auto bg-white dark:bg-gray-800">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <Info className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            {t('dance.guide.title')}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold text-sm">
                1
              </span>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                {t('dance.guide.step1')}
              </p>
            </div>
            
            <div className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold text-sm">
                2
              </span>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                {t('dance.guide.step2')}
              </p>
            </div>
            
            <div className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold text-sm">
                3
              </span>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                {t('dance.guide.step3')}
              </p>
            </div>
          </div>
          
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
              {t('dance.guide.footer')}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

