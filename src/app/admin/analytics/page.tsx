'use client';

import AnalyticsDashboard from '@/components/admin/AnalyticsDashboard';
import { useLanguage } from '@/context/LanguageContext';

export default function AnalyticsPage() {
  const { language } = useLanguage();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {language === 'ko' ? '서비스 분석' : 'Análisis del Servicio'}
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          {language === 'ko'
            ? '뉴스, 사용자, 트렌드 분석'
            : 'Análisis de noticias, usuarios y tendencias'}
        </p>
      </div>
      <AnalyticsDashboard />
    </div>
  );
}
