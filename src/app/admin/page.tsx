'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import {
  Trophy, Users, Gift, Video,
  GraduationCap, CreditCard, Calendar,
  Newspaper, ShieldAlert, Bell,
  Handshake, HelpCircle, Brain,
  Clock, Settings, UserCheck,
} from 'lucide-react';

interface DashboardStats {
  totalPayments: number;
  totalRevenue: number;
  totalBookings: number;
  totalUsers: number;
  recentPayments: Record<string, unknown>[];
  recentBookings: Record<string, unknown>[];
}

export default function AdminDashboard() {
  const router = useRouter();
  const { language } = useLanguage();
  const { token } = useAuth();
  const lang = language === 'ko' ? 'ko' : 'es';

  const [stats, setStats] = useState<DashboardStats>({
    totalPayments: 0,
    totalRevenue: 0,
    totalBookings: 0,
    totalUsers: 0,
    recentPayments: [],
    recentBookings: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [paymentsRes, bookingsRes, usersRes] = await Promise.all([
        fetch('/api/admin/stats/payments', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/admin/stats/bookings', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/admin/stats/users', { headers: { Authorization: `Bearer ${token}` } })
      ]);

      const paymentsData = await paymentsRes.json();
      const bookingsData = await bookingsRes.json();
      const usersData = await usersRes.json();

      setStats({
        totalPayments: paymentsData.stats?.totalPayments || 0,
        totalRevenue: paymentsData.stats?.totalAmount || 0,
        totalBookings: bookingsData.total || 0,
        totalUsers: usersData.stats?.totalUsers || 0,
        recentPayments: paymentsData.recent || [],
        recentBookings: bookingsData.recent || []
      });
    } catch (error) {
      console.error('Dashboard data fetch failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const fmt = (value: number | undefined) => {
    if (value === undefined || value === null) return '0';
    return value.toLocaleString();
  };

  const t = (ko: string, es: string) => lang === 'ko' ? ko : es;

  // Quick access cards for all admin sections
  const quickAccessSections = [
    {
      title: { ko: '사용자 관리', es: 'Gestión de Usuarios' },
      items: [
        { href: '/admin/users', icon: Users, label: { ko: '사용자 관리', es: 'Usuarios' }, desc: { ko: '전체 사용자 목록 및 권한 관리', es: 'Lista de usuarios y permisos' }, color: 'blue' },
        { href: '/admin/mentor-status', icon: UserCheck, label: { ko: '멘토 승인', es: 'Aprobación de Mentores' }, desc: { ko: '멘토 상태 관리 및 승인', es: 'Gestionar y aprobar mentores' }, color: 'indigo' },
      ],
    },
    {
      title: { ko: '교육 & 상담', es: 'Educación y Consultoría' },
      items: [
        { href: '/admin/education', icon: GraduationCap, label: { ko: '교육 관리', es: 'Educación' }, desc: { ko: '과정 승인, 강사 관리, 교육 통계', es: 'Aprobar cursos, gestionar docentes y estadísticas' }, color: 'purple' },
        { href: '/admin/consultants', icon: Calendar, label: { ko: '상담사 관리', es: 'Consultores' }, desc: { ko: '상담사 및 일정 관리', es: 'Gestionar consultores y horarios' }, color: 'green' },
        { href: '/admin/lounge-schedule', icon: Clock, label: { ko: '라운지 일정', es: 'Horarios Lounge' }, desc: { ko: '라운지 일정 활성화', es: 'Activar horarios del lounge' }, color: 'teal' },
      ],
    },
    {
      title: { ko: '화상 채팅', es: 'Videollamadas' },
      items: [
        { href: '/admin/conversation-partners', icon: Video, label: { ko: '대화 파트너', es: 'Compañeros de Conversación' }, desc: { ko: '화상 채팅 파트너 등록 및 관리', es: 'Registrar y gestionar compañeros de videollamada' }, color: 'blue' },
      ],
    },
    {
      title: { ko: '결제 & 예약', es: 'Pagos y Reservas' },
      items: [
        { href: '/admin/payments', icon: CreditCard, label: { ko: '결제 관리', es: 'Pagos' }, desc: { ko: '결제 내역 및 환불 관리', es: 'Gestionar pagos y reembolsos' }, color: 'emerald' },
        { href: '/admin/bookings', icon: Calendar, label: { ko: '예약 관리', es: 'Reservas' }, desc: { ko: '예약 현황 관리', es: 'Gestionar reservas' }, color: 'orange' },
      ],
    },
    {
      title: { ko: '콘텐츠', es: 'Contenido' },
      items: [
        { href: '/admin/news', icon: Newspaper, label: { ko: '뉴스 관리', es: 'Noticias' }, desc: { ko: '뉴스 콘텐츠 관리', es: 'Gestionar noticias' }, color: 'gray' },
        { href: '/admin/events', icon: Gift, label: { ko: '이벤트 관리', es: 'Eventos' }, desc: { ko: '추천인 이벤트 및 캠페인 관리', es: 'Gestionar eventos y campañas' }, color: 'pink' },
        { href: '/admin/quiz-creator', icon: Brain, label: { ko: '퀴즈 생성', es: 'Crear Quiz' }, desc: { ko: '퀴즈 생성 및 관리', es: 'Crear y gestionar quizzes' }, color: 'violet' },
        { href: '/admin/notifications', icon: Bell, label: { ko: '알림 관리', es: 'Notificaciones' }, desc: { ko: '알림 발송 및 관리', es: 'Enviar y gestionar notificaciones' }, color: 'amber' },
      ],
    },
    {
      title: { ko: '커뮤니티 & 소통', es: 'Comunidad y Comunicación' },
      items: [
        { href: '/admin/reports', icon: ShieldAlert, label: { ko: '신고 관리', es: 'Reportes' }, desc: { ko: '신고 내역 관리 및 조치', es: 'Gestionar reportes y acciones' }, color: 'red' },
        { href: '/admin/points', icon: Trophy, label: { ko: '포인트 랭킹', es: 'Ranking de Puntos' }, desc: { ko: '포인트 순위 관리', es: 'Gestionar ranking de puntos' }, color: 'yellow' },
        { href: '/admin/inquiries', icon: HelpCircle, label: { ko: '문의 관리', es: 'Consultas' }, desc: { ko: '사용자 문의 관리', es: 'Gestionar consultas de usuarios' }, color: 'cyan' },
        { href: '/admin/partnership', icon: Handshake, label: { ko: '제휴 관리', es: 'Alianzas' }, desc: { ko: '제휴 문의 관리', es: 'Gestionar alianzas' }, color: 'lime' },
      ],
    },
    {
      title: { ko: '시스템', es: 'Sistema' },
      items: [
        { href: '/admin/cron', icon: Settings, label: { ko: 'Cron 작업', es: 'Tareas Cron' }, desc: { ko: '자동화 작업 관리', es: 'Gestionar tareas automatizadas' }, color: 'slate' },
      ],
    },
  ];

  const colorMap: Record<string, string> = {
    blue: 'text-blue-500',
    indigo: 'text-indigo-500',
    purple: 'text-purple-500',
    green: 'text-green-500',
    teal: 'text-teal-500',
    emerald: 'text-emerald-500',
    orange: 'text-orange-500',
    gray: 'text-gray-500',
    pink: 'text-pink-500',
    violet: 'text-violet-500',
    amber: 'text-amber-500',
    red: 'text-red-500',
    yellow: 'text-yellow-500',
    cyan: 'text-cyan-500',
    lime: 'text-lime-500',
    slate: 'text-slate-500',
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page title */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {t('관리자 대시보드', 'Panel de Administración')}
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          {t('플랫폼 현황을 한눈에 확인하세요', 'Revisa el estado de la plataforma de un vistazo')}
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('총 결제', 'Total Pagos')}</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{fmt(stats.totalPayments)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('총 매출', 'Ingresos')}</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₩{fmt(stats.totalRevenue)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('총 예약', 'Reservas')}</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{fmt(stats.totalBookings)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('총 사용자', 'Usuarios')}</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{fmt(stats.totalUsers)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Quick access sections */}
      {quickAccessSections.map((section) => (
        <div key={section.title[lang]}>
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">
            {section.title[lang]}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {section.items.map((item) => {
              const Icon = item.icon;
              return (
                <Card
                  key={item.href}
                  className="cursor-pointer hover:shadow-lg hover:border-purple-200 dark:hover:border-purple-800 transition-all duration-200 group"
                  onClick={() => router.push(item.href)}
                >
                  <CardContent className="pt-5 pb-4">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg bg-gray-50 dark:bg-gray-800 group-hover:bg-purple-50 dark:group-hover:bg-purple-900/20 transition-colors`}>
                        <Icon className={`w-5 h-5 ${colorMap[item.color] || 'text-gray-500'}`} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-medium text-sm text-gray-900 dark:text-white group-hover:text-purple-700 dark:group-hover:text-purple-300 transition-colors">
                          {item.label[lang]}
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">
                          {item.desc[lang]}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      ))}

      {/* Recent activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-base">
              {t('최근 결제', 'Pagos Recientes')}
              <Button variant="outline" size="sm" onClick={() => router.push('/admin/payments')}>
                {t('전체보기', 'Ver todo')}
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.recentPayments.length > 0 ? (
                stats.recentPayments.slice(0, 5).map((payment: Record<string, unknown>) => (
                  <div key={String(payment.id)} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div>
                      <p className="font-medium text-sm">{typeof payment.order_id === 'string' ? payment.order_id : 'N/A'}</p>
                      <p className="text-xs text-gray-500">{typeof payment.method === 'string' ? payment.method : 'N/A'}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-sm">₩{fmt(typeof payment.amount === 'number' ? payment.amount : 0)}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        payment.status === 'confirmed' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                        payment.status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' :
                        'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                      }`}>
                        {typeof payment.status === 'string' ? payment.status : 'N/A'}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">
                  {t('최근 결제 내역이 없습니다', 'No hay pagos recientes')}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-base">
              {t('최근 예약', 'Reservas Recientes')}
              <Button variant="outline" size="sm" onClick={() => router.push('/admin/bookings')}>
                {t('전체보기', 'Ver todo')}
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.recentBookings.length > 0 ? (
                stats.recentBookings.slice(0, 5).map((booking: Record<string, unknown>) => (
                  <div key={String(booking.id)} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div>
                      <p className="font-medium text-sm">{typeof booking.topic === 'string' ? booking.topic : 'N/A'}</p>
                      <p className="text-xs text-gray-500">
                        {typeof booking.start_at === 'string' ? new Date(booking.start_at).toLocaleDateString() : t('날짜 없음', 'Sin fecha')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-sm">₩{fmt(typeof booking.price === 'number' ? booking.price : 0)}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        booking.status === 'confirmed' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                        booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' :
                        'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                      }`}>
                        {typeof booking.status === 'string' ? booking.status : 'N/A'}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">
                  {t('최근 예약 내역이 없습니다', 'No hay reservas recientes')}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
