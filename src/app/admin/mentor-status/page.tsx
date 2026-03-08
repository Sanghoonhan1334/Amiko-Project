'use client'

import MentorStatusManager from '@/components/admin/MentorStatusManager'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Shield, Users, Activity } from 'lucide-react'
import { useLanguage } from '@/context/LanguageContext'

export default function MentorStatusPage() {
  const { language } = useLanguage()
  const t = (ko: string, es: string) => language === 'ko' ? ko : es

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center">
          <Shield className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t('멘토 승인 관리', 'Aprobación de Mentores')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {t('멘토 상태 관리 시스템', 'Sistema de gestión de estado de mentores')}
          </p>
        </div>
      </div>

      {/* Feature cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="w-4 h-4 text-blue-500" />
              {t('멘토 상태 관리', 'Gestión de Estado')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {t(
                '멘토들의 현재 상태(온라인/다른 상담 중/오프라인)를 실시간으로 관리하고 모니터링할 수 있습니다.',
                'Gestione y monitoree en tiempo real el estado actual de los mentores (en línea/en otra consulta/fuera de línea).'
              )}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Activity className="w-4 h-4 text-green-500" />
              {t('자동 상태 변경', 'Cambio Automático de Estado')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {t(
                '멘토가 상담을 시작하면 자동으로 상태가 변경됩니다.',
                'El estado del mentor cambia automáticamente cuando inicia o finaliza una consulta.'
              )}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Shield className="w-4 h-4 text-purple-500" />
              {t('상태 로그', 'Registro de Estado')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {t(
                '모든 멘토 상태 변경 이력이 자동으로 기록됩니다.',
                'Todo el historial de cambios de estado de los mentores se registra automáticamente.'
              )}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Mentor status manager component */}
      <MentorStatusManager />

      {/* Usage guide */}
      <Card>
        <CardHeader>
          <CardTitle>{t('사용법 안내', 'Guía de Uso')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <h4 className="font-semibold text-blue-800 dark:text-blue-300 mb-1 text-sm">
                {t('1. 멘토 상태 확인', '1. Verificar estado del mentor')}
              </h4>
              <p className="text-sm text-blue-700 dark:text-blue-400">
                {t(
                  '상단의 요약 카드에서 현재 온라인, 다른 상담 중, 오프라인 멘토 수를 확인할 수 있습니다.',
                  'En las tarjetas resumen puede ver la cantidad de mentores en línea, en consulta y fuera de línea.'
                )}
              </p>
            </div>

            <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <h4 className="font-semibold text-green-800 dark:text-green-300 mb-1 text-sm">
                {t('2. 상태 변경', '2. Cambiar estado')}
              </h4>
              <p className="text-sm text-green-700 dark:text-green-400">
                {t(
                  '각 멘토의 상태 드롭다운에서 원하는 상태로 변경할 수 있습니다.',
                  'Puede cambiar el estado de cada mentor desde su menú desplegable.'
                )}
              </p>
            </div>

            <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
              <h4 className="font-semibold text-orange-800 dark:text-orange-300 mb-1 text-sm">
                {t('3. 활성화/비활성화', '3. Activar/Desactivar')}
              </h4>
              <p className="text-sm text-orange-700 dark:text-orange-400">
                {t(
                  '멘토를 일시적으로 비활성화할 수 있습니다.',
                  'Puede desactivar temporalmente a un mentor.'
                )}
              </p>
            </div>

            <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
              <h4 className="font-semibold text-purple-800 dark:text-purple-300 mb-1 text-sm">
                {t('4. 자동 상태 관리', '4. Gestión automática')}
              </h4>
              <p className="text-sm text-purple-700 dark:text-purple-400">
                {t(
                  '멘토가 실제 상담을 시작하거나 종료하면 시스템이 자동으로 상태를 업데이트합니다.',
                  'El sistema actualiza automáticamente el estado cuando el mentor inicia o finaliza una consulta.'
                )}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
