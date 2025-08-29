export const translations = {
  ko: {
    // 헤더
    mainPage: '메인페이지',
    landingPage: '랜딩페이지',
    start: '시작하기',
    lounge: '라운지',
    
    // 다크모드
    darkMode: '다크 모드',
    lightMode: '라이트 모드',
    darkModeTitle: '다크 모드로 전환',
    lightModeTitle: '라이트 모드로 전환',
    
    // 언어
    korean: '한국어',
    spanish: 'Español',
    changeToSpanish: 'Cambiar a Español',
    changeToKorean: '한국어로 변경',
    
    // 메뉴
    community: '커뮤니티',
    loungeSchedule: '라운지 일정',
    profile: '프로필',
    settings: '설정',
    
    // 랜딩페이지
    hero: {
      title: '한국 문화를 배우고\n새로운 친구들을 만나세요',
      subtitle: '언어 장벽 없이 한국 문화를 체험하고, 전 세계 사람들과 소통하세요',
      cta: '지금 시작하기'
    },
    
    // ZEP 라운지
    lounge: {
      title: 'ZEP 주말 라운지',
      subtitle: '운영자와 함께하는 즐거운 한국 문화 수다타임!',
      description: '매주 토요일 저녁, 여러분을 기다리고 있어요',
      time: '매주 토요일 20:00 (KST)',
      maxParticipants: '최대 30명 참여',
      nextSession: '다음 세션',
      activities: {
        title: '라운지에서 하는 일',
        conversation: {
          title: '자유로운 대화',
          description: '한국 문화, 여행, 음식 등 다양한 주제로 대화를 나눕니다'
        },
        culture: {
          title: '문화 체험',
          description: '한국 전통 문화와 현대 문화를 체험할 수 있습니다'
        },
        events: {
          title: '특별 이벤트',
          description: '정기적으로 특별한 이벤트와 선물을 제공합니다'
        }
      },
      cta: '지금 바로 ZEP 라운지에 참여하세요!',
      ctaSubtitle: '한국 문화를 배우고 새로운 친구들을 만날 수 있는 특별한 시간'
    }
  },
  
  es: {
    // 헤더
    mainPage: 'Página Principal',
    landingPage: 'Página de Inicio',
    start: 'Comenzar',
    lounge: 'Sala',
    
    // 다크모드
    darkMode: 'Modo Oscuro',
    lightMode: 'Modo Claro',
    darkModeTitle: 'Cambiar a Modo Oscuro',
    lightModeTitle: 'Cambiar a Modo Claro',
    
    // 언어
    korean: '한국어',
    spanish: 'Español',
    changeToSpanish: 'Cambiar a Español',
    changeToKorean: '한국어로 변경',
    
    // 메뉴
    community: 'Comunidad',
    loungeSchedule: 'Horario de Sala',
    profile: 'Perfil',
    settings: 'Configuración',
    
    // 랜딩페이지
    hero: {
      title: 'Aprende cultura coreana y\nhaz nuevos amigos',
      subtitle: 'Experimenta la cultura coreana sin barreras lingüísticas y comunícate con personas de todo el mundo',
      cta: 'Comenzar Ahora'
    },
    
    // ZEP 라운지
    lounge: {
      title: 'Sala ZEP de Fin de Semana',
      subtitle: '¡Tiempo de charla divertida sobre cultura coreana con operadores!',
      description: 'Todos los sábados por la noche, te estamos esperando',
      time: 'Todos los sábados 20:00 (KST)',
      maxParticipants: 'Máximo 30 participantes',
      nextSession: 'Próxima Sesión',
      activities: {
        title: 'Qué hacer en la Sala',
        conversation: {
          title: 'Conversación Libre',
          description: 'Conversamos sobre diversos temas como cultura coreana, viajes, comida, etc.'
        },
        culture: {
          title: 'Experiencia Cultural',
          description: 'Puedes experimentar la cultura tradicional y moderna de Corea'
        },
        events: {
          title: 'Eventos Especiales',
          description: 'Proporcionamos eventos especiales y regalos regularmente'
        }
      },
      cta: '¡Únete ahora a la Sala ZEP!',
      ctaSubtitle: 'Un tiempo especial para aprender cultura coreana y hacer nuevos amigos'
    }
  }
}

export type Language = keyof typeof translations
export type TranslationKey = keyof typeof translations.ko
