// FanZone i18n - Español Latino
// Strings de traducción para FanZone siguiendo microcopy cálido y natural

export const fanzoneEs = {
  // =============================================
  // NAVEGACIÓN Y HEADER
  // =============================================
  navigation: {
    home: 'FanZone',
    explore: 'Explorar',
    myCommunities: 'Mis Comunidades',
    create: 'Crear',
    search: 'Buscar comunidades...',
    searchPlaceholder: '¿Qué te apasiona?',
    back: 'Atrás',
    menu: 'Menú'
  },

  // =============================================
  // HOME DE FANZONE
  // =============================================
  home: {
    title: 'FanZone',
    subtitle: 'Conecta con fans como tú',
    myCommunities: 'Mis Comunidades',
    exploreAll: 'Ver todas',
    exploreTitle: 'Descubre comunidades',
    noCommunities: 'Aún no te has unido a ninguna comunidad',
    noCommunitiesDesc: 'Explora abajo y encuentra tu tribu 💜',
    exploreButton: 'Explorar comunidades',
    trending: 'En llamas 🔥',
    recent: 'Recientes',
    featured: 'Destacadas',
    popular: 'Populares',
    all: 'Todas',
    loading: 'Cargando comunidades...',
    error: 'Ups, algo salió mal 😅',
    retry: 'Intentar de nuevo'
  },

  // =============================================
  // FILTROS Y CATEGORÍAS
  // =============================================
  filters: {
    categories: {
      kpop: 'K-Pop',
      kdrama: 'K-Drama', 
      kbeauty: 'K-Beauty',
      kfood: 'K-Food',
      kgaming: 'K-Gaming',
      learning: 'Aprendizaje',
      other: 'Otro'
    },
    sortBy: {
      trending: 'En llamas',
      recent: 'Recientes',
      featured: 'Destacadas',
      popular: 'Populares',
      members: 'Más miembros'
    },
    visibility: {
      public: 'Público',
      private: 'Privado'
    }
  },

  // =============================================
  // CARD DE FANROOM
  // =============================================
  card: {
    members: 'miembros',
    active: 'activos',
    join: 'Unirme',
    joined: 'Unido',
    leave: 'Salir',
    view: 'Ver',
    new: 'NUEVO',
    trending: '🔥 En llamas',
    featured: '⭐ Destacado',
    private: '🔒 Privado',
    online: '⚡ Activo ahora',
    lastActivity: 'Última actividad',
    createdBy: 'Creado por',
    memberCount: '{{count}} miembros',
    activeCount: '{{count}} activos'
  },

  // =============================================
  // DETALLE DE FANROOM
  // =============================================
  detail: {
    join: 'Unirme',
    joined: 'Unido',
    leave: 'Salir',
    share: 'Compartir',
    report: 'Reportar',
    settings: 'Configuración',
    members: '{{count}} miembros',
    activeMembers: '{{count}} activos ahora',
    createdBy: 'Creado por {{name}}',
    joinedAt: 'Te uniste {{date}}',
    lastActivity: 'Última actividad: {{date}}',
    description: 'Descripción',
    tags: 'Etiquetas',
    category: 'Categoría',
    visibility: 'Visibilidad',
    tabs: {
      posts: 'Posts',
      media: 'Media',
      chat: 'Chat',
      members: 'Miembros'
    }
  },

  // =============================================
  // POSTS TAB
  // =============================================
  posts: {
    title: 'Posts',
    createPost: 'Crear post',
    writePost: '¿Qué quieres compartir?',
    placeholder: 'Comparte algo con tu comunidad...',
    addMedia: 'Agregar foto/video',
    publish: 'Publicar',
    publishing: 'Publicando...',
    noPosts: 'Aún no hay posts',
    noPostsDesc: '¡Sé el primero en compartir algo! ✨',
    createFirst: 'Crear primer post',
    likes: '{{count}} me gusta',
    comments: '{{count}} comentarios',
    share: 'Compartir',
    like: 'Me gusta',
    unlike: 'Ya no me gusta',
    comment: 'Comentar',
    edit: 'Editar',
    delete: 'Eliminar',
    report: 'Reportar',
    postedBy: 'Publicado por {{name}}',
    postedAt: '{{date}}',
    edited: 'editado',
    deleteConfirm: '¿Eliminar este post?',
    deleteConfirmDesc: 'Esta acción no se puede deshacer.',
    cancel: 'Cancelar',
    confirm: 'Confirmar'
  },

  // =============================================
  // MEDIA TAB
  // =============================================
  media: {
    title: 'Media',
    all: 'Todas',
    photos: 'Fotos',
    videos: 'Videos',
    noMedia: 'Aún no hay media',
    noMediaDesc: 'Los posts con fotos y videos aparecerán aquí',
    viewPost: 'Ver post',
    playVideo: 'Reproducir video',
    pauseVideo: 'Pausar video',
    fullscreen: 'Pantalla completa',
    download: 'Descargar',
    share: 'Compartir'
  },

  // =============================================
  // CHAT TAB
  // =============================================
  chat: {
    title: 'Chat',
    placeholder: 'Escribe un mensaje...',
    send: 'Enviar',
    typing: '{{name}} está escribiendo...',
    online: '{{count}} en línea',
    noMessages: 'Aún no hay mensajes',
    noMessagesDesc: '¡Inicia la conversación! 💬',
    writeFirst: 'Escribir primer mensaje',
    messageBy: '{{name}}',
    messageAt: '{{time}}',
    today: 'Hoy',
    yesterday: 'Ayer',
    loadMore: 'Cargar más mensajes',
    connectionLost: 'Conexión perdida',
    reconnecting: 'Reconectando...',
    connected: 'Conectado',
    disconnected: 'Desconectado'
  },

  // =============================================
  // MEMBERS TAB
  // =============================================
  members: {
    title: 'Miembros',
    search: 'Buscar miembros...',
    all: 'Todos',
    online: 'En línea',
    admins: 'Administradores',
    moderators: 'Moderadores',
    members: 'Miembros',
    noMembers: 'Aún no hay miembros',
    noMembersDesc: 'Los miembros aparecerán aquí cuando se unan',
    memberSince: 'Miembro desde {{date}}',
    lastActive: 'Última actividad: {{date}}',
    onlineNow: 'En línea ahora',
    follow: 'Seguir',
    following: 'Siguiendo',
    unfollow: 'Dejar de seguir',
    message: 'Mensaje',
    profile: 'Ver perfil',
    role: 'Rol',
    joinedAt: 'Se unió {{date}}',
    promote: 'Promover',
    demote: 'Degradar',
    kick: 'Expulsar',
    ban: 'Banear',
    unban: 'Desbanear'
  },

  // =============================================
  // CREAR FANROOM
  // =============================================
  create: {
    title: 'Crear tu FanRoom',
    subtitle: 'Comparte tu pasión con el mundo',
    name: 'Nombre del FanRoom',
    namePlaceholder: 'Ej: BTS Army México',
    nameHelp: '3-50 caracteres, será visible para todos',
    slug: 'URL personalizada',
    slugPlaceholder: 'bts-army-mexico',
    slugHelp: 'Solo letras minúsculas, números y guiones',
    description: 'Descripción',
    descriptionPlaceholder: 'Cuéntanos de qué trata tu comunidad...',
    descriptionHelp: 'Opcional, máximo 200 caracteres',
    category: 'Categoría',
    categoryHelp: 'Ayuda a otros fans a encontrarte',
    tags: 'Etiquetas',
    tagsPlaceholder: 'bts, army, mexico, kpop',
    tagsHelp: 'Máximo 10 etiquetas, separadas por comas',
    visibility: 'Visibilidad',
    visibilityPublic: 'Público - Cualquiera puede ver y unirse',
    visibilityPrivate: 'Privado - Solo por invitación',
    coverImage: 'Imagen de portada',
    coverImageHelp: 'Recomendado: 1200x630px, máximo 5MB',
    uploadCover: 'Subir imagen',
    changeCover: 'Cambiar imagen',
    removeCover: 'Eliminar imagen',
    create: 'Crear FanRoom',
    creating: 'Creando...',
    success: '¡FanRoom creado! 🎉',
    successDesc: 'Tu comunidad ya está activa',
    goToFanroom: 'Ir a mi FanRoom',
    error: 'Error al crear FanRoom',
    errorDesc: 'Inténtalo de nuevo en unos momentos'
  },

  // =============================================
  // VALIDACIÓN DE FORMULARIOS
  // =============================================
  validation: {
    required: 'Este campo es obligatorio',
    minLength: 'Mínimo {{min}} caracteres',
    maxLength: 'Máximo {{max}} caracteres',
    invalidSlug: 'Solo letras minúsculas, números y guiones',
    slugTaken: 'Esta URL ya está en uso',
    invalidEmail: 'Email inválido',
    fileTooBig: 'Archivo demasiado grande (máximo {{max}}MB)',
    invalidFileType: 'Tipo de archivo no permitido',
    maxFiles: 'Máximo {{max}} archivos',
    invalidTag: 'Etiqueta inválida',
    maxTags: 'Máximo {{max}} etiquetas',
    contentRequired: 'Debes escribir algo o subir una imagen',
    contentTooLong: 'Máximo {{max}} caracteres',
    messageRequired: 'Escribe un mensaje',
    messageTooLong: 'Máximo {{max}} caracteres'
  },

  // =============================================
  // ESTADOS VACÍOS
  // =============================================
  empty: {
    noFanrooms: 'No hay comunidades',
    noFanroomsDesc: 'Aún no hay comunidades en esta categoría',
    noResults: 'Sin resultados',
    noResultsDesc: 'Intenta con otros términos de búsqueda',
    noPosts: 'Sin posts',
    noPostsDesc: 'Aún no hay publicaciones',
    noMedia: 'Sin media',
    noMediaDesc: 'No hay fotos o videos',
    noChat: 'Sin mensajes',
    noChatDesc: 'Inicia la conversación',
    noMembers: 'Sin miembros',
    noMembersDesc: 'Aún no hay miembros',
    loading: 'Cargando...',
    error: 'Error al cargar',
    retry: 'Intentar de nuevo'
  },

  // =============================================
  // NOTIFICACIONES Y ALERTAS
  // =============================================
  notifications: {
    joined: 'Te uniste a {{name}}',
    left: 'Saliste de {{name}}',
    newPost: 'Nuevo post en {{name}}',
    newComment: 'Nuevo comentario en {{name}}',
    newMember: 'Nuevo miembro en {{name}}',
    roleChanged: 'Tu rol cambió en {{name}}',
    fanroomUpdated: '{{name}} fue actualizado',
    postLiked: 'A {{name}} le gustó tu post',
    commentLiked: 'A {{name}} le gustó tu comentario',
    mentioned: 'Te mencionaron en {{name}}'
  },

  // =============================================
  // MODERACIÓN Y REPORTES
  // =============================================
  moderation: {
    report: 'Reportar',
    reportTitle: 'Reportar contenido',
    reportReason: 'Motivo del reporte',
    reportDescription: 'Descripción (opcional)',
    reportSubmit: 'Enviar reporte',
    reportSuccess: 'Reporte enviado',
    reportSuccessDesc: 'Revisaremos el contenido pronto',
    reasons: {
      spam: 'Spam',
      harassment: 'Acoso',
      inappropriate: 'Contenido inapropiado',
      fake: 'Información falsa',
      other: 'Otro'
    },
    actions: {
      warn: 'Advertir',
      mute: 'Silenciar',
      kick: 'Expulsar',
      ban: 'Banear',
      delete: 'Eliminar'
    },
    confirmAction: '¿{{action}} a {{user}}?',
    confirmActionDesc: 'Esta acción no se puede deshacer'
  },

  // =============================================
  // CONFIGURACIÓN Y PREFERENCIAS
  // =============================================
  settings: {
    title: 'Configuración',
    notifications: 'Notificaciones',
    privacy: 'Privacidad',
    account: 'Cuenta',
    notificationsDesc: 'Elige qué notificaciones recibir',
    privacyDesc: 'Controla tu privacidad',
    accountDesc: 'Gestiona tu cuenta',
    newPosts: 'Nuevos posts',
    newComments: 'Nuevos comentarios',
    newMembers: 'Nuevos miembros',
    mentions: 'Menciones',
    showOnlineStatus: 'Mostrar estado en línea',
    allowDirectMessages: 'Permitir mensajes directos',
    save: 'Guardar',
    saved: 'Guardado',
    error: 'Error al guardar'
  },

  // =============================================
  // ERRORES COMUNES
  // =============================================
  errors: {
    network: 'Error de conexión',
    networkDesc: 'Verifica tu internet e intenta de nuevo',
    unauthorized: 'No autorizado',
    unauthorizedDesc: 'Debes iniciar sesión para continuar',
    forbidden: 'Acceso denegado',
    forbiddenDesc: 'No tienes permisos para esta acción',
    notFound: 'No encontrado',
    notFoundDesc: 'El contenido que buscas no existe',
    serverError: 'Error del servidor',
    serverErrorDesc: 'Algo salió mal, intenta más tarde',
    validationError: 'Error de validación',
    validationErrorDesc: 'Revisa los campos marcados',
    fileUploadError: 'Error al subir archivo',
    fileUploadErrorDesc: 'Intenta con otro archivo',
    genericError: 'Algo salió mal',
    genericErrorDesc: 'Inténtalo de nuevo en unos momentos'
  },

  // =============================================
  // ACCIONES Y BOTONES
  // =============================================
  actions: {
    save: 'Guardar',
    cancel: 'Cancelar',
    delete: 'Eliminar',
    edit: 'Editar',
    share: 'Compartir',
    copy: 'Copiar',
    download: 'Descargar',
    upload: 'Subir',
    retry: 'Reintentar',
    refresh: 'Actualizar',
    loadMore: 'Cargar más',
    showMore: 'Ver más',
    showLess: 'Ver menos',
    close: 'Cerrar',
    open: 'Abrir',
    back: 'Atrás',
    next: 'Siguiente',
    previous: 'Anterior',
    finish: 'Finalizar',
    continue: 'Continuar',
    skip: 'Omitir',
    done: 'Listo',
    ok: 'OK',
    yes: 'Sí',
    no: 'No',
    confirm: 'Confirmar',
    apply: 'Aplicar',
    reset: 'Restablecer',
    clear: 'Limpiar',
    search: 'Buscar',
    filter: 'Filtrar',
    sort: 'Ordenar',
    select: 'Seleccionar',
    deselect: 'Deseleccionar',
    selectAll: 'Seleccionar todo',
    deselectAll: 'Deseleccionar todo'
  },

  // =============================================
  // TIEMPO Y FECHAS
  // =============================================
  time: {
    now: 'Ahora',
    justNow: 'Hace un momento',
    minutesAgo: 'Hace {{count}} min',
    hoursAgo: 'Hace {{count}} h',
    daysAgo: 'Hace {{count}} días',
    weeksAgo: 'Hace {{count}} semanas',
    monthsAgo: 'Hace {{count}} meses',
    yearsAgo: 'Hace {{count}} años',
    today: 'Hoy',
    yesterday: 'Ayer',
    tomorrow: 'Mañana',
    thisWeek: 'Esta semana',
    lastWeek: 'Semana pasada',
    thisMonth: 'Este mes',
    lastMonth: 'Mes pasado',
    thisYear: 'Este año',
    lastYear: 'Año pasado'
  },

  // =============================================
  // PLURALIZACIÓN
  // =============================================
  plural: {
    members: {
      zero: 'Sin miembros',
      one: '{{count}} miembro',
      other: '{{count}} miembros'
    },
    posts: {
      zero: 'Sin posts',
      one: '{{count}} post',
      other: '{{count}} posts'
    },
    comments: {
      zero: 'Sin comentarios',
      one: '{{count}} comentario',
      other: '{{count}} comentarios'
    },
    likes: {
      zero: 'Sin likes',
      one: '{{count}} like',
      other: '{{count}} likes'
    },
    messages: {
      zero: 'Sin mensajes',
      one: '{{count}} mensaje',
      other: '{{count}} mensajes'
    }
  }
} as const

// =============================================
// TIPOS DE TRADUCCIÓN
// =============================================

export type FanzoneTranslation = typeof fanzoneEs

export type TranslationKey = 
  | 'navigation'
  | 'home'
  | 'filters'
  | 'card'
  | 'detail'
  | 'posts'
  | 'media'
  | 'chat'
  | 'members'
  | 'create'
  | 'validation'
  | 'empty'
  | 'notifications'
  | 'moderation'
  | 'settings'
  | 'errors'
  | 'actions'
  | 'time'
  | 'plural'

// =============================================
// FUNCIONES AUXILIARES
// =============================================

/**
 * Interpolación de variables en strings
 */
export function interpolate(
  template: string, 
  variables: Record<string, string | number>
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return variables[key]?.toString() || match
  })
}

/**
 * Pluralización simple
 */
export function pluralize(
  count: number,
  forms: { zero?: string; one: string; other: string }
): string {
  if (count === 0 && forms.zero) return forms.zero
  if (count === 1) return forms.one
  return forms.other
}

/**
 * Formateo de números
 */
export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M'
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'k'
  }
  return num.toString()
}

/**
 * Formateo de fechas relativas
 */
export function formatRelativeTime(date: Date): string {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  
  if (minutes < 1) return fanzoneEs.time.justNow
  if (minutes < 60) return interpolate(fanzoneEs.time.minutesAgo, { count: minutes })
  if (hours < 24) return interpolate(fanzoneEs.time.hoursAgo, { count: hours })
  if (days < 7) return interpolate(fanzoneEs.time.daysAgo, { count: days })
  
  return date.toLocaleDateString('es-MX')
}

export default fanzoneEs
