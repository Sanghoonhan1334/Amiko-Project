'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';

export default function CronTestPage() {
  const { language } = useLanguage();
  const { token } = useAuth();
  const t = (ko: string, es: string) => language === 'ko' ? ko : es;

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    success?: boolean;
    message?: string;
    testResult?: Record<string, unknown>;
    results?: {
      total?: number;
      success?: number;
      failure?: number;
    };
  } | null>(null);
  const [error, setError] = useState<string>('');

  const testReminder = async () => {
    setLoading(true);
    setError('');
    setResult(null);

    try {
      console.log('🧪 리마인더 테스트 시작...');
      
      const response = await fetch('/api/cron/test-reminder', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
      });

      const data = await response.json();

      if (response.ok) {
        setResult(data);
        console.log('✅ 리마인더 테스트 성공:', data);
      } else {
        setError(data.error || t('테스트 실패', 'Prueba fallida'));
        console.error('❌ 리마인더 테스트 실패:', data);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : t('알 수 없는 오류', 'Error desconocido');
      setError(errorMessage);
      console.error('❌ 리마인더 테스트 중 오류:', err);
    } finally {
      setLoading(false);
    }
  };

  const runActualReminder = async () => {
    setLoading(true);
    setError('');
    setResult(null);

    try {
      console.log('🕒 실제 리마인더 실행 시작...');
      
      const response = await fetch('/api/cron/reminder', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
      });

      const data = await response.json();

      if (response.ok) {
        setResult(data);
        console.log('✅ 실제 리마인더 실행 성공:', data);
      } else {
        setError(data.error || t('실행 실패', 'Ejecución fallida'));
        console.error('❌ 실제 리마인더 실행 실패:', data);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : t('알 수 없는 오류', 'Error desconocido');
      setError(errorMessage);
      console.error('❌ 실제 리마인더 실행 중 오류:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold dark:text-white">🕒 {t('리마인더 스케줄러 테스트', 'Prueba del Programador de Recordatorios')}</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          {t('상담 리마인더 시스템을 테스트하고 수동으로 실행할 수 있습니다.', 'Puede probar y ejecutar manualmente el sistema de recordatorios de consultas.')}
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* 테스트 카드 */}
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 dark:text-white">
              🧪 {t('테스트 모드', 'Modo de Prueba')}
            </CardTitle>
            <CardDescription className="dark:text-gray-400">
              {t('리마인더 시스템의 동작을 테스트합니다.', 'Prueba el funcionamiento del sistema de recordatorios.')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={testReminder} 
              disabled={loading}
              className="w-full"
              variant="outline"
            >
              {loading ? t('테스트 실행 중...', 'Ejecutando prueba...') : `🧪 ${t('테스트 실행', 'Ejecutar Prueba')}`}
            </Button>
          </CardContent>
        </Card>

        {/* 실제 실행 카드 */}
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 dark:text-white">
              🚀 {t('실제 실행', 'Ejecución Real')}
            </CardTitle>
            <CardDescription className="dark:text-gray-400">
              {t('실제 리마인더를 발송합니다. (24시간 후 예약 대상)', 'Envía recordatorios reales. (Para reservas en las próximas 24 horas)')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={runActualReminder} 
              disabled={loading}
              className="w-full"
            >
              {loading ? t('실제 실행 중...', 'Ejecutando...') : `🚀 ${t('실제 리마인더 전송', 'Enviar Recordatorios')}`}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* 오류 표시 */}
      {error && (
        <Card className="mt-6 border-red-200 bg-red-50 dark:bg-red-900/30 dark:border-red-800">
          <CardHeader>
            <CardTitle className="text-red-600 dark:text-red-400 flex items-center gap-2">
              ❌ {t('오류 발생', 'Error')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-700 dark:text-red-300">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* 결과 표시 */}
      {result && (
        <Card className="mt-6 border-green-200 bg-green-50 dark:bg-green-900/30 dark:border-green-800">
          <CardHeader>
            <CardTitle className="text-green-600 dark:text-green-400 flex items-center gap-2">
              ✅ {t('실행 결과', 'Resultado')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="dark:text-gray-200"><strong>{t('성공', 'Éxito')}:</strong> {result.success ? '✅' : '❌'}</p>
              <p className="dark:text-gray-200"><strong>{t('메시지', 'Mensaje')}:</strong> {typeof result.message === 'string' ? result.message : t('메시지 없음', 'Sin mensaje')}</p>
              
              {result.testResult && typeof result.testResult === 'object' && (
                <div className="mt-4 p-4 bg-white dark:bg-gray-800 rounded border dark:border-gray-700">
                  <h4 className="font-semibold mb-2 dark:text-white">📊 {t('상세 결과', 'Resultados Detallados')}:</h4>
                  <pre className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                    {JSON.stringify(result.testResult, null, 2)}
                  </pre>
                </div>
              )}
              
              {result.results && typeof result.results === 'object' && (
                <div className="mt-4 p-4 bg-white dark:bg-gray-800 rounded border dark:border-gray-700">
                  <h4 className="font-semibold mb-2 dark:text-white">📊 {t('통계', 'Estadísticas')}:</h4>
                  <ul className="space-y-1 dark:text-gray-200">
                    <li><strong>{t('전체', 'Total')}:</strong> {typeof result.results.total === 'number' ? result.results.total : 0} {t('건', 'registros')}</li>
                    <li><strong>{t('성공', 'Éxito')}:</strong> {typeof result.results.success === 'number' ? result.results.success : 0} {t('건', 'registros')}</li>
                    <li><strong>{t('실패', 'Fallidas')}:</strong> {typeof result.results.failure === 'number' ? result.results.failure : 0} {t('건', 'registros')}</li>
                  </ul>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 설명 */}
      <Card className="mt-6 dark:bg-gray-800 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="dark:text-white">📋 {t('리마인더 시스템 정보', 'Información del Sistema de Recordatorios')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold dark:text-white">🎯 {t('동작 방식', 'Funcionamiento')}:</h4>
            <ul className="list-disc list-inside space-y-1 mt-2 text-sm dark:text-gray-300">
              <li>{t('상담 24시간 전에 자동 리마인더 발송', 'Envío automático de recordatorio 24 horas antes de la consulta')}</li>
              <li>{t('고객과 상담사 모두에게 푸시 알림 + 이메일', 'Notificación push + correo electrónico tanto al cliente como al consultor')}</li>
              <li>{t('중복 발송 방지 (reminder_sent 플래그)', 'Prevención de envíos duplicados (flag reminder_sent)')}</li>
              <li>{t('개별 예약별 독립적 처리', 'Procesamiento independiente por cada reserva')}</li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold dark:text-white">⚙️ {t('자동화 설정', 'Configuración Automática')}:</h4>
            <ul className="list-disc list-inside space-y-1 mt-2 text-sm dark:text-gray-300">
              <li>{t('매일 오전 9시 cron job 실행 권장', 'Se recomienda ejecutar el cron job diariamente a las 9 AM')}</li>
              <li>{t('Vercel: vercel.json에 cron 설정', 'Vercel: configurar cron en vercel.json')}</li>
              <li>{t('로컬: crontab 또는 npm 스크립트 사용', 'Local: usar crontab o scripts de npm')}</li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold dark:text-white">🔍 {t('모니터링', 'Monitoreo')}:</h4>
            <ul className="list-disc list-inside space-y-1 mt-2 text-sm dark:text-gray-300">
              <li>{t('콘솔 로그에서 [CRON REMINDER] 태그 확인', 'Verificar la etiqueta [CRON REMINDER] en los logs de consola')}</li>
              <li>{t('성공/실패 통계 제공', 'Estadísticas de éxito/fallo proporcionadas')}</li>
              <li>{t('개별 예약별 상세 로그', 'Logs detallados por cada reserva individual')}</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
