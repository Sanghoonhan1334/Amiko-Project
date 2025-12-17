// Community Home Grid Items Configuration
// Configuración de items del grid de la página principal de Comunidad

export interface CommunityItem {
  id: string
  title: string
  titleKey: string // Translation key
  microcopy?: string
  microcopyKey?: string // Translation key
  icon: string // Emoji or image path
  route?: string // Optional for main categories with subItems or direct links
  accentColor: string
  isNew?: boolean
  badge?: string
  subItems?: CommunitySubItem[] // Submenu items (boards, links, etc.)
  partnerLinks?: PartnerLink[] // For partner section - external links
}

export interface CommunitySubItem {
  id: string
  title: string
  titleKey: string
  route: string
  icon: string
  accentColor?: string
}

export interface PartnerLink {
  platform: string
  url: string
  icon: string
}

export const communityItems: CommunityItem[] = [
  // 1. Tableros por Temas (주제별 게시판) - 스토리 제거, 직접 라우트로 변경
  {
    id: 'story-boards',
    title: 'Tablero por Temas',
    titleKey: 'community.freeBoard',
    microcopy: 'Discute sobre diversos temas de K-Cultura',
    microcopyKey: 'community.freeBoardDesc',
    icon: '/icons/topic-board.png',
    accentColor: '#3B82F6', // Blue
    route: '/community/freeboard' // 직접 라우트로 변경 (서브메뉴 제거)
  },
  
  // 2. Zona de K-Cultura (K-Culture Zone)
  {
    id: 'k-culture',
    title: 'Zona de K-Cultura',
    titleKey: 'community.kCulture',
    microcopy: 'Contenido de K-Cultura',
    microcopyKey: 'community.kCultureDesc',
    icon: '/icons/Zona de K-Cultura.png',
    accentColor: '#8B5CF6', // Purple
    subItems: [
      // K-Chat Zone - 숨김 처리 (당분간 사용 안 함)
      // {
      //   id: 'k-chat',
      //   title: 'K-Chat Zone',
      //   titleKey: 'community.kChat',
      //   route: '/community/k-chat',
      //   icon: '/icons/Chat.png',
      //   accentColor: '#F59E0B'
      // },
      {
        id: 'idol-memes',
        title: 'Fotos de Ídolos',
        titleKey: 'community.idolMemes',
        route: '/community/idol-photos',
        icon: '/icons/Foto de idol.png',
        accentColor: '#F59E0B'
      },
      {
        id: 'fanart',
        title: 'Fan Art',
        titleKey: 'community.fanart',
        route: '/community/fanart',
        icon: '/icons/Fan art.png',
        accentColor: '#EC4899'
      },
      // Encuestas (투표) - 숨김 처리 (당분간 사용 안 함)
      // {
      //   id: 'polls',
      //   title: 'Encuestas',
      //   titleKey: 'community.polls',
      //   route: '/community/polls',
      //   icon: '/icons/Encuestas.png',
      //   accentColor: '#10B981'
      // },
      {
        id: 'k-news',
        title: 'K-Noticia',
        titleKey: 'community.koreanNews',
        route: '/community/news',
        icon: '/icons/k-magazine.png',
        accentColor: '#8B5CF6'
      }
    ]
  },
  
  // 3. Psychological Tests (심리테스트) - Direct link, no submenu
  {
    id: 'tests',
    title: 'Test Psicológico',
    titleKey: 'tests.title',
    microcopy: 'Descubre tu personalidad',
    microcopyKey: 'community.testsDesc',
    icon: '/icons/psychology-test.png',
    route: '/community/tests',
    accentColor: '#F59E0B', // Amber
  },
  
  // 4. Partners (제휴사)
  {
    id: 'partners',
    title: 'Socios',
    titleKey: 'community.partners',
    microcopy: 'Nuestros socios',
    microcopyKey: 'community.partnersDesc',
    icon: '/icons/제휴.png',
    route: '/community/partners',
    accentColor: '#10B981', // Green
    partnerLinks: [
      {
        platform: 'Instagram',
        url: 'https://instagram.com/parapans',
        icon: '📷'
      },
      {
        platform: 'Website',
        url: 'https://parapans.com',
        icon: '🌐'
      }
    ]
  }
]

