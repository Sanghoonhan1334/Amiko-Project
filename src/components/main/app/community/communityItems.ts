// Community Home Grid Items Configuration
// Configuración de items del grid de la página principal de Comunidad

export interface CommunityItem {
  id: string
  title: string
  titleKey: string // Translation key
  microcopy?: string
  microcopyKey?: string // Translation key
  icon: string // Emoji or image path
  route?: string // Optional for main categories with subItems
  accentColor: string
  isNew?: boolean
  badge?: string
  subItems?: CommunitySubItem[] // New: submenu items
}

export interface CommunitySubItem {
  id: string
  title: string
  titleKey: string
  route: string
  icon: string
  accentColor?: string
}

export const communityItems: CommunityItem[] = [
  {
    id: 'tableros',
    title: 'Tableros',
    titleKey: 'community.tableros',
    microcopy: '다양한 게시판',
    microcopyKey: 'community.tablerosDesc',
    icon: '/icons/topic-board.png',
    accentColor: '#3B82F6', // Blue
    subItems: [
      {
        id: 'topics',
        title: 'Tablero por Temas',
        titleKey: 'community.freeBoard',
        route: '/community/freeboard',
        icon: '💬',
        accentColor: '#3B82F6'
      },
      {
        id: 'idol-memes',
        title: 'Tablero de Memes de Ídolos',
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
      }
    ]
  },
  {
    id: 'magazine',
    title: 'K-Magazine',
    titleKey: 'community.koreanNews',
    microcopy: 'Noticias del mundo K-Pop',
    microcopyKey: 'community.magazineDesc',
    icon: '/icons/k-magazine.png', // TODO: Replace with actual icon
    route: '/community/news',
    accentColor: '#8B5CF6', // Purple
  },
  {
    id: 'qa',
    title: 'Pregunta y Respuesta',
    titleKey: 'community.qa',
    microcopy: 'Resuelve tus dudas',
    microcopyKey: 'community.qaDesc',
    icon: '/icons/qa.png', // TODO: Replace with actual icon
    route: '/community/qa',
    accentColor: '#10B981', // Green
  },
  {
    id: 'tests',
    title: 'Test Psicológico',
    titleKey: 'tests.title',
    microcopy: 'Descubre tu personalidad',
    microcopyKey: 'community.testsDesc',
    icon: '/icons/psychology-test.png', // TODO: Replace with actual icon
    route: '/community/tests',
    accentColor: '#F59E0B', // Amber
  },
  {
    id: 'story',
    title: 'Historia',
    titleKey: 'community.story',
    microcopy: 'Comparte tu momento',
    microcopyKey: 'community.storyDesc',
    icon: '/icons/story.png', // TODO: Replace with actual icon
    route: '/community/stories',
    accentColor: '#EC4899', // Pink
  },
]

