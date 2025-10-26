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
  // 1. Story & Boards (스토리&게시판)
  {
    id: 'story-boards',
    title: 'Historia y Tableros',
    titleKey: 'community.storyBoards',
    microcopy: '게시판과 스토리',
    microcopyKey: 'community.storyBoardsDesc',
    icon: '/icons/topic-board.png',
    accentColor: '#3B82F6', // Blue
    subItems: [
      {
        id: 'topics',
        title: 'Tablero por Temas',
        titleKey: 'community.freeBoard',
        route: '/community/freeboard',
        icon: '/icons/topic-board.png',
        accentColor: '#3B82F6'
      },
      {
        id: 'story',
        title: 'Historia',
        titleKey: 'community.story',
        route: '/community/stories',
        icon: '/icons/story.png',
        accentColor: '#EC4899'
      }
    ]
  },
  
  // 2. Zona de K-Cultura (K-Culture Zone)
  {
    id: 'k-culture',
    title: 'Zona de K-Cultura',
    titleKey: 'community.kCulture',
    microcopy: 'K-컬처 콘텐츠',
    microcopyKey: 'community.kCultureDesc',
    icon: '/icons/k-magazine.png',
    accentColor: '#8B5CF6', // Purple
    subItems: [
      {
        id: 'k-chat',
        title: 'K-Chat Zone',
        titleKey: 'community.kChat',
        route: '/community/k-chat',
        icon: '💬',
        accentColor: '#F59E0B'
      },
      {
        id: 'idol-memes',
        title: 'Compartir Fotos de Ídolos',
        titleKey: 'community.idolMemes',
        route: '/community/idol-memes',
        icon: '😄',
        accentColor: '#F59E0B'
      },
      {
        id: 'fanart',
        title: 'Tablero de Fan Art',
        titleKey: 'community.fanart',
        route: '/community/fanart',
        icon: '🎨',
        accentColor: '#EC4899'
      },
      {
        id: 'polls',
        title: 'Tablero de Encuestas',
        titleKey: 'community.polls',
        route: '/community/polls',
        icon: '🗳️',
        accentColor: '#10B981'
      },
      {
        id: 'magazine',
        title: 'K-Magazine',
        titleKey: 'community.koreanNews',
        route: '/community/news',
        icon: '📖',
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

