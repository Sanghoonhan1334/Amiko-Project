'use client'

import { useState, useEffect } from 'react'
import { useLanguage } from '@/context/LanguageContext'
import { useAuth } from '@/context/AuthContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { 
  BarChart3, 
  Users, 
  Eye, 
  Globe, 
  TrendingUp,
  Calendar,
  MessageSquare,
  Star,
  ChevronDown,
  ChevronRight,
  TestTube,
  ShoppingCart,
  Mail,
  Shuffle,
  Shield,
  Activity,
  Zap,
  Target,
  PieChart
} from 'lucide-react'

interface NewsStats {
  totalNews: number
  koreanNews: number
  spanishNews: number
  totalViews: number
  popularNews: Array<{
    id: string
    title: string
    views: number
    language: string
  }>
}

interface UserStats {
  totalUsers: number
  koreanUsers: number
  latinUsers: number
  activeUsers: number
}

interface AnalyticsData {
  newsStats: NewsStats
  userStats: UserStats
  dailyTrends: Array<{
    date: string
    views: number
    users: number
  }>
}

export default function AnalyticsDashboard() {
  const { language } = useLanguage()
  const { token } = useAuth()
  const t = (ko: string, es: string) => language === 'ko' ? ko : es

  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)

  // 각 섹션의 펼침 상태 관리
  const [openSections, setOpenSections] = useState({
    overview: true,    // 기본적으로 펼쳐짐
    news: true,        // 뉴스 분석
    users: false,      // 사용자 분석
    abtest: false,     // AB 테스트
    commerce: false,   // 커머스 분석
    marketing: false,  // 마케팅 캠페인
    security: false,   // 보안 및 모니터링
    system: false      // 시스템 성능
  })

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  // 분석 데이터 가져오기
  const fetchAnalyticsData = async () => {
    try {
      setLoading(true)
      
      // 실제 API 호출 (기존 엔드포인트 사용)
      const [newsRes, usersRes] = await Promise.all([
        fetch('/api/news?limit=100', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch('/api/admin/stats/users', {
          headers: { Authorization: `Bearer ${token}` }
        })
      ])
      
      let newsData: { news: any[] } = { news: [] }
      let usersData: { stats: { totalUsers?: number; koreanUsers?: number; latinUsers?: number; activeUsers?: number } } = { stats: {} }
      
      try {
        if (newsRes.ok) {
          newsData = await newsRes.json()
        }
      } catch (e) {
        console.warn('뉴스 데이터 로드 실패:', e)
      }
      
      try {
        if (usersRes.ok) {
          usersData = await usersRes.json()
        }
      } catch (e) {
        console.warn('사용자 통계 로드 실패:', e)
      }
      
      // 실제 데이터 매핑
      const realData: AnalyticsData = {
        newsStats: {
          totalNews: newsData.news?.length || 0,
          koreanNews: newsData.news?.filter((n: any) => n.language === 'ko').length || 0,
          spanishNews: newsData.news?.filter((n: any) => n.language === 'es').length || 0,
          totalViews: newsData.news?.reduce((sum: number, n: any) => sum + (n.view_count || 0), 0) || 0,
          popularNews: newsData.news
            ?.sort((a: any, b: any) => (b.view_count || 0) - (a.view_count || 0))
            .slice(0, 5)
            .map((n: any) => ({
              id: n.id,
              title: n.title,
              views: n.view_count || 0,
              language: n.language || 'ko'
            })) || []
        },
        userStats: {
          totalUsers: usersData.stats?.totalUsers || 0,
          koreanUsers: usersData.stats?.koreanUsers || 0,
          latinUsers: usersData.stats?.latinUsers || 0,
          activeUsers: usersData.stats?.activeUsers || 0
        },
        dailyTrends: [] // 일별 트렌드는 추후 구현
      }
      
      setAnalyticsData(realData)
    } catch (error) {
      console.error('분석 데이터 로드 실패:', error)
      // 실패 시 빈 데이터
      setAnalyticsData({
        newsStats: {
          totalNews: 0,
          koreanNews: 0,
          spanishNews: 0,
          totalViews: 0,
          popularNews: []
        },
        userStats: {
          totalUsers: 0,
          koreanUsers: 0,
          latinUsers: 0,
          activeUsers: 0
        },
        dailyTrends: []
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAnalyticsData()
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600 dark:border-gray-400 mx-auto"></div>
          <p className="mt-2 text-gray-600 dark:text-gray-400">{t('분석 데이터를 불러오는 중...', 'Cargando datos de análisis...')}</p>
        </div>
      </div>
    )
  }

  if (!analyticsData) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600 dark:text-gray-400">{t('분석 데이터를 불러올 수 없습니다.', 'No se pudieron cargar los datos de análisis.')}</p>
      </div>
    )
  }

  const { newsStats, userStats, dailyTrends } = analyticsData

  return (
    <div className="space-y-4">
      {/* 헤더 */}
      <div className="text-center pb-6">
        <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2">📊 {t('운영진 분석 대시보드', 'Panel de Análisis para Administradores')}</h2>
        <p className="text-gray-600 dark:text-gray-400">{t('서비스 현황과 사용자 활동을 한눈에 확인하세요', 'Consulte el estado del servicio y la actividad de los usuarios')}</p>
      </div>

      {/* 📊 핵심 지표 요약 */}
      <Collapsible 
        open={openSections.overview} 
        onOpenChange={() => toggleSection('overview')}
      >
        <Card className="border-2 border-blue-200 dark:border-blue-800 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30">
          <CollapsibleTrigger className="w-full">
            <CardHeader className="cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-bold text-blue-800 dark:text-blue-300 flex items-center gap-3">
                  <PieChart className="w-6 h-6" />
                  📊 {t('핵심 지표 요약', 'Resumen de Indicadores Clave')}
                  <Badge variant="outline" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                    {newsStats.totalNews + userStats.totalUsers} {t('지표', 'indicadores')}
                  </Badge>
                </CardTitle>
                {openSections.overview ? (
                  <ChevronDown className="w-5 h-5 text-blue-600" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-blue-600" />
                )}
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 text-center">
                  <MessageSquare className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-blue-900 dark:text-blue-300">{newsStats.totalNews}</div>
                  <div className="text-sm text-blue-700 dark:text-blue-400">{t('총 뉴스', 'Total Noticias')}</div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 text-center">
                  <Eye className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-green-900 dark:text-green-300">{newsStats.totalViews.toLocaleString()}</div>
                  <div className="text-sm text-green-700 dark:text-green-400">{t('총 조회수', 'Total de Vistas')}</div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 text-center">
                  <Users className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-purple-900 dark:text-purple-300">{userStats.totalUsers}</div>
                  <div className="text-sm text-purple-700 dark:text-purple-400">{t('총 사용자', 'Total de Usuarios')}</div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 text-center">
                  <TrendingUp className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-orange-900 dark:text-orange-300">{userStats.activeUsers}</div>
                  <div className="text-sm text-orange-700 dark:text-orange-400">{t('활성 사용자', 'Usuarios Activos')}</div>
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* 📰 뉴스 분석 */}
      <Collapsible 
        open={openSections.news} 
        onOpenChange={() => toggleSection('news')}
      >
        <Card className="border-2 border-green-200 dark:border-green-800 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30">
          <CollapsibleTrigger className="w-full">
            <CardHeader className="cursor-pointer hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-bold text-green-800 dark:text-green-300 flex items-center gap-3">
                  <MessageSquare className="w-6 h-6" />
                  📰 {t('뉴스 분석 및 콘텐츠 관리', 'Análisis de Noticias y Gestión de Contenido')}
                  <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                    {t('상세 분석', 'Análisis Detallado')}
                  </Badge>
                </CardTitle>
                {openSections.news ? (
                  <ChevronDown className="w-5 h-5 text-green-600" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-green-600" />
                )}
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-6">
              {/* 인기 뉴스 TOP 5 */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
                  <Star className="w-5 h-5 text-yellow-500" />
                  {t('인기 뉴스 TOP 5', 'Noticias Populares TOP 5')}
                </h3>
                <div className="space-y-3">
                  {newsStats.popularNews.map((news, index) => (
                    <div key={news.id} className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border border-green-100 dark:border-green-800">
                      <div className="flex items-center gap-3">
                        <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                          #{index + 1}
                        </Badge>
                        <div>
                          <p className="font-medium text-gray-800 dark:text-gray-200">{news.title}</p>
                          <Badge variant="outline" className="text-xs">
                            {news.language === 'ko' ? t('한국어', 'Coreano') : t('스페인어', 'Español')}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900 dark:text-gray-100">{news.views}{t('회', ' vistas')}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{t('조회', 'Vistas')}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 일별 트렌드 */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-blue-500" />
                  {t('최근 7일 트렌드', 'Tendencias de los Últimos 7 Días')}
                </h3>
                <div className="space-y-2">
                  {dailyTrends.map((day, index) => (
                    <div key={day.date} className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded border border-green-100 dark:border-green-800">
                      <div className="flex items-center gap-3">
                        <Calendar className="w-4 h-4 text-gray-500" />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {new Date(day.date).toLocaleDateString(language === 'ko' ? 'ko-KR' : 'es-ES', { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{day.views}{t('회', ' vistas')}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{t('조회', 'Vistas')}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{day.users}{t('명', ' personas')}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{t('사용자', 'Usuarios')}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 언어별 분포 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-green-100 dark:border-green-800">
                  <h4 className="font-semibold text-gray-800 dark:text-gray-100 mb-3 flex items-center gap-2">
                    <Globe className="w-4 h-4 text-green-500" />
                    {t('뉴스 언어별 분포', 'Distribución de Noticias por Idioma')}
                  </h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-700 dark:text-gray-300">{t('한국어', 'Coreano')}</span>
                      <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">{newsStats.koreanNews}{t('개', '')}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-700 dark:text-gray-300">{t('스페인어', 'Español')}</span>
                      <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">{newsStats.spanishNews}{t('개', '')}</Badge>
                    </div>
                  </div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-green-100 dark:border-green-800">
                  <h4 className="font-semibold text-gray-800 dark:text-gray-100 mb-3 flex items-center gap-2">
                    <Users className="w-4 h-4 text-purple-500" />
                    {t('사용자 언어별 분포', 'Distribución de Usuarios por Idioma')}
                  </h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-700 dark:text-gray-300">{t('한국 사용자', 'Usuarios Coreanos')}</span>
                      <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">{userStats.koreanUsers}{t('명', '')}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-700 dark:text-gray-300">{t('라틴 사용자', 'Usuarios Latinos')}</span>
                      <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">{userStats.latinUsers}{t('명', '')}</Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* 👥 사용자 행동 분석 */}
      <Collapsible 
        open={openSections.users} 
        onOpenChange={() => toggleSection('users')}
      >
        <Card className="border-2 border-purple-200 dark:border-purple-800 bg-gradient-to-r from-purple-50 to-violet-50 dark:from-purple-900/30 dark:to-violet-900/30">
          <CollapsibleTrigger className="w-full">
            <CardHeader className="cursor-pointer hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-colors">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-bold text-purple-800 dark:text-purple-300 flex items-center gap-3">
                  <Users className="w-6 h-6" />
                  👥 {t('사용자 행동 및 세그먼트 분석', 'Análisis de Comportamiento y Segmentación de Usuarios')}
                  <Badge variant="outline" className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300">
                    {t('사용자 인사이트', 'Insights de Usuarios')}
                  </Badge>
                </CardTitle>
                {openSections.users ? (
                  <ChevronDown className="w-5 h-5 text-purple-600" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-purple-600" />
                )}
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent>
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-purple-100 dark:border-purple-800">
                <div className="text-center">
                  <Users className="w-12 h-12 text-purple-600 mx-auto mb-3" />
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2">{t('사용자 행동 분석', 'Análisis de Comportamiento de Usuarios')}</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">{t('사용자 세그먼트별 상세 분석 및 리텐션 통계', 'Análisis detallado por segmento y estadísticas de retención')}</p>
                  <Badge variant="outline" className="bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                    {t('준비 중', 'En Preparación')}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* 🧪 AB 테스트 관리 */}
      <Collapsible 
        open={openSections.abtest} 
        onOpenChange={() => toggleSection('abtest')}
      >
        <Card className="border-2 border-orange-200 dark:border-orange-800 bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/30 dark:to-red-900/30">
          <CollapsibleTrigger className="w-full">
            <CardHeader className="cursor-pointer hover:bg-orange-100 dark:hover:bg-orange-900/40 transition-colors">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-bold text-orange-800 dark:text-orange-300 flex items-center gap-3">
                  <TestTube className="w-6 h-6" />
                  🧪 {t('AB 테스트 및 실험 관리', 'Gestión de Pruebas AB y Experimentos')}
                  <Badge variant="outline" className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300">
                    {t('실험 플랫폼', 'Plataforma de Experimentos')}
                  </Badge>
                </CardTitle>
                {openSections.abtest ? (
                  <ChevronDown className="w-5 h-5 text-orange-600" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-orange-600" />
                )}
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent>
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-orange-100 dark:border-orange-800">
                <div className="text-center">
                  <TestTube className="w-12 h-12 text-orange-600 mx-auto mb-3" />
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2">{t('AB 테스트 관리', 'Gestión de Pruebas AB')}</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">{t('UI/UX 실험, 기능 테스트, 전환율 최적화 실험', 'Experimentos UI/UX, pruebas funcionales, optimización de conversión')}</p>
                  <Badge variant="outline" className="bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                    {t('준비 중', 'En Preparación')}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* 🛒 커머스 분석 */}
      <Collapsible 
        open={openSections.commerce} 
        onOpenChange={() => toggleSection('commerce')}
      >
        <Card className="border-2 border-indigo-200 dark:border-indigo-800 bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-900/30 dark:to-blue-900/30">
          <CollapsibleTrigger className="w-full">
            <CardHeader className="cursor-pointer hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-bold text-indigo-800 dark:text-indigo-300 flex items-center gap-3">
                  <ShoppingCart className="w-6 h-6" />
                  🛒 {t('커머스 및 매출 분석', 'Análisis de Comercio e Ingresos')}
                  <Badge variant="outline" className="bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300">
                    {t('매출 최적화', 'Optimización de Ingresos')}
                  </Badge>
                </CardTitle>
                {openSections.commerce ? (
                  <ChevronDown className="w-5 h-5 text-indigo-600" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-indigo-600" />
                )}
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent>
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-indigo-100 dark:border-indigo-800">
                <div className="text-center">
                  <ShoppingCart className="w-12 h-12 text-indigo-600 mx-auto mb-3" />
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2">{t('커머스 분석', 'Análisis de Comercio')}</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">{t('쿠폰 활성화율, 매출 지표, 결제 성공률 분석', 'Tasa de activación de cupones, indicadores de ventas, análisis de éxito de pago')}</p>
                  <Badge variant="outline" className="bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                    {t('준비 중', 'En Preparación')}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* 📧 마케팅 캠페인 */}
      <Collapsible 
        open={openSections.marketing} 
        onOpenChange={() => toggleSection('marketing')}
      >
        <Card className="border-2 border-pink-200 dark:border-pink-800 bg-gradient-to-r from-pink-50 to-rose-50 dark:from-pink-900/30 dark:to-rose-900/30">
          <CollapsibleTrigger className="w-full">
            <CardHeader className="cursor-pointer hover:bg-pink-100 dark:hover:bg-pink-900/40 transition-colors">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-bold text-pink-800 dark:text-pink-300 flex items-center gap-3">
                  <Mail className="w-6 h-6" />
                  📧 {t('마케팅 칠페인 및 이메일 분석', 'Análisis de Campañas de Marketing y Email')}
                  <Badge variant="outline" className="bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300">
                    {t('칠페인 최적화', 'Optimización de Campañas')}
                  </Badge>
                </CardTitle>
                {openSections.marketing ? (
                  <ChevronDown className="w-5 h-5 text-pink-600" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-pink-600" />
                )}
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent>
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-pink-100 dark:border-pink-800">
                <div className="text-center">
                  <Mail className="w-12 h-12 text-pink-600 mx-auto mb-3" />
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2">{t('마케팅 칠페인', 'Campañas de Marketing')}</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">{t('이메일/SMS 발송률, 클릭률, 구독자 활동 분석', 'Tasa de envío email/SMS, tasa de clics, análisis de actividad de suscriptores')}</p>
                  <Badge variant="outline" className="bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                    {t('준비 중', 'En Preparación')}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* 🔒 보안 및 모니터링 */}
      <Collapsible 
        open={openSections.security} 
        onOpenChange={() => toggleSection('security')}
      >
        <Card className="border-2 border-red-200 dark:border-red-800 bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-900/30 dark:to-pink-900/30">
          <CollapsibleTrigger className="w-full">
            <CardHeader className="cursor-pointer hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-bold text-red-800 dark:text-red-300 flex items-center gap-3">
                  <Shield className="w-6 h-6" />
                  🔒 {t('보안 및 모니터링', 'Seguridad y Monitoreo')}
                  <Badge variant="outline" className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">
                    {t('보안 강화', 'Seguridad Reforzada')}
                  </Badge>
                </CardTitle>
                {openSections.security ? (
                  <ChevronDown className="w-5 h-5 text-red-600" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-red-600" />
                )}
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent>
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-red-100 dark:border-red-800">
                <div className="text-center">
                  <Shield className="w-12 h-12 text-red-600 mx-auto mb-3" />
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2">{t('보안 모니터링', 'Monitoreo de Seguridad')}</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">{t('로그인 시도 모니터링, 의심 활동 탐지, 인증 이벤트 분석', 'Monitoreo de intentos de inicio de sesión, detección de actividad sospechosa, análisis de eventos de autenticación')}</p>
                  <Badge variant="outline" className="bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                    {t('준비 중', 'En Preparación')}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* ⚡ 시스템 성능 */}
      <Collapsible 
        open={openSections.system} 
        onOpenChange={() => toggleSection('system')}
      >
        <Card className="border-2 border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-slate-50 dark:from-gray-800/50 dark:to-slate-800/50">
          <CollapsibleTrigger className="w-full">
            <CardHeader className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700/40 transition-colors">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-bold text-gray-800 dark:text-gray-200 flex items-center gap-3">
                  <Activity className="w-6 h-6" />
                  ⚡ {t('시스템 성능 및 서버 모니터링', 'Rendimiento del Sistema y Monitoreo de Servidor')}
                  <Badge variant="outline" className="bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                    {t('인프라 관리', 'Gestión de Infraestructura')}
                  </Badge>
                </CardTitle>
                {openSections.system ? (
                  <ChevronDown className="w-5 h-5 text-gray-600" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-gray-600" />
                )}
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent>
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-100 dark:border-gray-700">
                <div className="text-center">
                  <Activity className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2">{t('시스템 성능', 'Rendimiento del Sistema')}</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">{t('API 응답시간, 서버 리소스 사용량, 데이터베이스 성능 모니터링', 'Tiempo de respuesta API, uso de recursos del servidor, monitoreo de rendimiento de BD')}</p>
                  <Badge variant="outline" className="bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                    {t('준비 중', 'En Preparación')}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* 전체 섹션 제어 */}
      <div className="pt-4">
        <Card className="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-900/30 dark:to-blue-900/30 border-indigo-200 dark:border-indigo-800">
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-2 justify-center">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setOpenSections({
                  overview: true, news: true, users: false, abtest: false,
                  commerce: false, marketing: false, security: false, system: false
                })}
              >
                📊 {t('기본 표시', 'Vista Básica')}
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setOpenSections({
                  overview: true, news: true, users: true, abtest: true,
                  commerce: true, marketing: true, security: true, system: true
                })}
              >
                📂 {t('전체 펼치기', 'Expandir Todo')}
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setOpenSections({
                  overview: false, news: false, users: false, abtest: false,
                  commerce: false, marketing: false, security: false, system: false
                })}
              >
                📁 {t('전체 접기', 'Contraer Todo')}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}