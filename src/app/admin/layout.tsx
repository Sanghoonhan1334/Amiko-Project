'use client';

import { ReactNode, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLanguage } from '@/context/LanguageContext';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  Video,
  CreditCard,
  Calendar,
  Newspaper,
  Gift,
  Trophy,
  MessageSquare,
  ShieldAlert,
  Bell,
  Handshake,
  HelpCircle,
  Clock,
  Brain,
  Settings,
  Menu,
  X,
  ChevronDown,
  ChevronRight,
  UserCheck,
} from 'lucide-react';

interface AdminLayoutProps {
  children: ReactNode;
}

interface NavSection {
  title: { ko: string; es: string };
  items: NavItem[];
}

interface NavItem {
  href: string;
  label: { ko: string; es: string };
  icon: React.ElementType;
  description?: { ko: string; es: string };
}

const navSections: NavSection[] = [
  {
    title: { ko: '일반', es: 'General' },
    items: [
      {
        href: '/admin',
        label: { ko: '대시보드', es: 'Panel General' },
        icon: LayoutDashboard,
        description: { ko: '통계 및 개요', es: 'Estadísticas y resumen' },
      },
    ],
  },
  {
    title: { ko: '사용자 관리', es: 'Gestión de Usuarios' },
    items: [
      {
        href: '/admin/users',
        label: { ko: '사용자 관리', es: 'Usuarios' },
        icon: Users,
        description: { ko: '전체 사용자 목록 및 권한', es: 'Lista de usuarios y permisos' },
      },
      {
        href: '/admin/mentor-status',
        label: { ko: '멘토 승인', es: 'Aprobación de Mentores' },
        icon: UserCheck,
        description: { ko: '멘토 상태 관리 및 승인', es: 'Gestionar y aprobar mentores' },
      },
    ],
  },
  {
    title: { ko: '교육', es: 'Educación' },
    items: [
      {
        href: '/admin/education',
        label: { ko: '교육 관리', es: 'Gestión Educativa' },
        icon: GraduationCap,
        description: { ko: '과정 승인, 강사 관리', es: 'Aprobar cursos, gestionar docentes' },
      },
      {
        href: '/admin/consultants',
        label: { ko: '상담사 관리', es: 'Consultores' },
        icon: Calendar,
        description: { ko: '상담사 및 일정 관리', es: 'Gestionar consultores y horarios' },
      },
      {
        href: '/admin/lounge-schedule',
        label: { ko: '라운지 일정', es: 'Horarios Lounge' },
        icon: Clock,
        description: { ko: '라운지 일정 활성화', es: 'Activar horarios del lounge' },
      },
    ],
  },
  {
    title: { ko: '화상 채팅', es: 'Videollamadas' },
    items: [
      {
        href: '/admin/conversation-partners',
        label: { ko: '대화 파트너', es: 'Compañeros de Conversación' },
        icon: Video,
        description: { ko: '화상 채팅 파트너 관리', es: 'Gestionar compañeros de videollamada' },
      },
    ],
  },
  {
    title: { ko: '결제 및 예약', es: 'Pagos y Reservas' },
    items: [
      {
        href: '/admin/payments',
        label: { ko: '결제 관리', es: 'Pagos' },
        icon: CreditCard,
        description: { ko: '결제 내역 관리', es: 'Gestionar pagos' },
      },
      {
        href: '/admin/bookings',
        label: { ko: '예약 관리', es: 'Reservas' },
        icon: Calendar,
        description: { ko: '예약 내역 관리', es: 'Gestionar reservas' },
      },
    ],
  },
  {
    title: { ko: '콘텐츠', es: 'Contenido' },
    items: [
      {
        href: '/admin/news',
        label: { ko: '뉴스 관리', es: 'Noticias' },
        icon: Newspaper,
        description: { ko: '뉴스 콘텐츠 관리', es: 'Gestionar noticias' },
      },
      {
        href: '/admin/events',
        label: { ko: '이벤트 관리', es: 'Eventos' },
        icon: Gift,
        description: { ko: '이벤트 및 캠페인 관리', es: 'Gestionar eventos y campañas' },
      },
      {
        href: '/admin/quiz-creator',
        label: { ko: '퀴즈 생성', es: 'Crear Quiz' },
        icon: Brain,
        description: { ko: '퀴즈 생성 및 관리', es: 'Crear y gestionar quizzes' },
      },
      {
        href: '/admin/notifications',
        label: { ko: '알림 관리', es: 'Notificaciones' },
        icon: Bell,
        description: { ko: '알림 발송 및 관리', es: 'Enviar y gestionar notificaciones' },
      },
    ],
  },
  {
    title: { ko: '커뮤니티', es: 'Comunidad' },
    items: [
      {
        href: '/admin/reports',
        label: { ko: '신고 관리', es: 'Reportes' },
        icon: ShieldAlert,
        description: { ko: '신고 내역 관리', es: 'Gestionar reportes' },
      },
      {
        href: '/admin/points',
        label: { ko: '포인트 랭킹', es: 'Ranking de Puntos' },
        icon: Trophy,
        description: { ko: '포인트 순위 관리', es: 'Gestionar ranking de puntos' },
      },
    ],
  },
  {
    title: { ko: '소통', es: 'Comunicación' },
    items: [
      {
        href: '/admin/inquiries',
        label: { ko: '문의 관리', es: 'Consultas' },
        icon: HelpCircle,
        description: { ko: '사용자 문의 관리', es: 'Gestionar consultas de usuarios' },
      },
      {
        href: '/admin/partnership',
        label: { ko: '제휴 관리', es: 'Alianzas' },
        icon: Handshake,
        description: { ko: '제휴 문의 관리', es: 'Gestionar alianzas' },
      },
    ],
  },
  {
    title: { ko: '시스템', es: 'Sistema' },
    items: [
      {
        href: '/admin/cron',
        label: { ko: 'Cron 작업', es: 'Tareas Cron' },
        icon: Settings,
        description: { ko: '자동화 작업 관리', es: 'Gestionar tareas automatizadas' },
      },
    ],
  },
];

export default function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname();
  const { language } = useLanguage();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());

  const lang = language === 'ko' ? 'ko' : 'es';

  const isActive = (href: string) => {
    if (href === '/admin') return pathname === '/admin';
    return pathname.startsWith(href);
  };

  const toggleSection = (title: string) => {
    setCollapsedSections(prev => {
      const next = new Set(prev);
      if (next.has(title)) {
        next.delete(title);
      } else {
        next.add(title);
      }
      return next;
    });
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Sidebar Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <span className="text-xl">👑</span>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            {lang === 'ko' ? '관리자 패널' : 'Panel Admin'}
          </h2>
        </div>
        {/* Close button - mobile only */}
        <button
          onClick={() => setSidebarOpen(false)}
          className="md:hidden p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
        {navSections.map((section) => {
          const sectionKey = section.title[lang];
          const isCollapsed = collapsedSections.has(sectionKey);

          return (
            <div key={sectionKey} className="mb-1">
              <button
                onClick={() => toggleSection(sectionKey)}
                className="flex items-center justify-between w-full px-3 py-1.5 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                {sectionKey}
                {isCollapsed ? (
                  <ChevronRight className="w-3 h-3" />
                ) : (
                  <ChevronDown className="w-3 h-3" />
                )}
              </button>

              {!isCollapsed && (
                <div className="space-y-0.5">
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.href);

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setSidebarOpen(false)}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-200 group ${
                          active
                            ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 font-medium shadow-sm'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50'
                        }`}
                      >
                        <Icon className={`w-4 h-4 flex-shrink-0 ${
                          active
                            ? 'text-purple-600 dark:text-purple-400'
                            : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300'
                        }`} />
                        <div className="min-w-0">
                          <div className="truncate">{item.label[lang]}</div>
                          {item.description && (
                            <div className="text-xs text-gray-400 dark:text-gray-500 truncate">
                              {item.description[lang]}
                            </div>
                          )}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>
    </div>
  );

  return (
    <div className="min-h-screen body-gradient bg-white dark:bg-transparent pb-20 md:pb-0">
      <div className="w-full max-w-6xl mx-auto px-2 sm:px-4 md:px-8 lg:px-16 xl:px-24 py-0 sm:py-2 md:py-6 relative z-0">
        {/* Top padding to clear fixed header */}
        <div className="pt-16 md:pt-28">

          {/* Mobile: admin menu toggle button */}
          <div className="md:hidden mb-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-xl text-sm text-purple-700 dark:text-purple-300 font-medium w-full hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors"
            >
              <Menu className="w-4 h-4" />
              <span>👑 {lang === 'ko' ? '관리 메뉴 열기' : 'Abrir menú admin'}</span>
              <ChevronRight className="w-4 h-4 ml-auto" />
            </button>
          </div>

          {/* Mobile sidebar overlay */}
          {sidebarOpen && (
            <div
              className="fixed inset-0 z-40 bg-black/50 md:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}

          {/* Sidebar - mobile (overlay) */}
          <div
            className={`fixed inset-y-0 left-0 z-50 w-72 bg-white dark:bg-gray-800 shadow-xl transform transition-transform duration-300 ease-in-out md:hidden ${
              sidebarOpen ? 'translate-x-0' : '-translate-x-full'
            }`}
          >
            <SidebarContent />
          </div>

          <div className="flex gap-6">
            {/* Sidebar - desktop (in-flow) */}
            <aside className="hidden md:block w-60 flex-shrink-0">
              <div className="card dark:bg-gray-800 dark:border-gray-700 p-0 overflow-hidden sticky top-32">
                <SidebarContent />
              </div>
            </aside>

            {/* Main content area */}
            <div className="flex-1 min-w-0">
              <div className="card dark:bg-gray-800 dark:border-gray-700 p-4 sm:p-6 md:p-8">
                {children}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
