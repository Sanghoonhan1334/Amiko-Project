// Community Home Grid Items Configuration
// Configuración de items del grid de la página principal de Comunidad

export interface CommunityItem {
  id: string
  title: string
  titleKey: string // Translation key
  microcopy?: string
  microcopyKey?: string // Translation key
  icon: string // Emoji or image path
  route: string
  accentColor: string
  isNew?: boolean
  badge?: string
}

export const communityItems: CommunityItem[] = [
  {
    id: 'freeboard',
    title: 'Tablero por Temas',
    titleKey: 'community.freeBoard',
    microcopy: 'Comparte con la comunidad',
    microcopyKey: 'community.freeBoardDesc',
    icon: '/topic-board.png', // TODO: Replace with actual icon
    route: '/community/freeboard',
    accentColor: '#3B82F6', // Blue
  },
  {
    id: 'magazine',
    title: 'K-Magazine',
    titleKey: 'community.koreanNews',
    microcopy: 'Noticias del mundo K-Pop',
    microcopyKey: 'community.magazineDesc',
    icon: '/k-magazine.png', // TODO: Replace with actual icon
    route: '/community/news',
    accentColor: '#8B5CF6', // Purple
  },
  {
    id: 'qa',
    title: 'Pregunta y Respuesta',
    titleKey: 'community.qa',
    microcopy: 'Resuelve tus dudas',
    microcopyKey: 'community.qaDesc',
    icon: '/qa.png', // TODO: Replace with actual icon
    route: '/community/qa',
    accentColor: '#10B981', // Green
  },
  {
    id: 'tests',
    title: 'Test Psicológico',
    titleKey: 'tests.title',
    microcopy: 'Descubre tu personalidad',
    microcopyKey: 'community.testsDesc',
    icon: '/psychology-test.png', // TODO: Replace with actual icon
    route: '/community/tests',
    accentColor: '#F59E0B', // Amber
  },
  {
    id: 'story',
    title: 'Historia',
    titleKey: 'community.story',
    microcopy: 'Comparte tu momento',
    microcopyKey: 'community.storyDesc',
    icon: '/story.png', // TODO: Replace with actual icon
    route: '/community/stories',
    accentColor: '#EC4899', // Pink
  },
  {
    id: 'fanzone',
    title: 'Zona de Fans',
    titleKey: 'community.fanzone',
    microcopy: 'Únete a tu comunidad favorita',
    microcopyKey: 'community.fanzoneDesc',
    icon: '💜', // Emoji as placeholder
    route: '/community/fanzone',
    accentColor: '#8B5CF6', // Purple (main identity)
    isNew: false, // Remove "NUEVO" badge
    badge: undefined, // Remove badge
  },
  {
    id: 'polls',
    title: 'Votaciones',
    titleKey: 'community.polls',
    microcopy: 'Participa en encuestas divertidas',
    microcopyKey: 'community.pollsDesc',
    icon: '🗳️', // Emoji as placeholder
    route: '/community/polls',
    accentColor: '#6366F1', // Indigo
    isNew: true,
    badge: 'NUEVO',
  },
]

