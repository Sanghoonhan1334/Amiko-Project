// FanZone i18n - 한국어
// FanZone 번역 문자열

export const fanzoneKo = {
  // =============================================
  // 내비게이션 및 헤더
  // =============================================
  navigation: {
    home: 'FanZone',
    explore: '탐색',
    myCommunities: '내 커뮤니티',
    create: '만들기',
    search: '커뮤니티 검색...',
    searchPlaceholder: '무엇에 관심이 있나요?',
    back: '뒤로',
    menu: '메뉴'
  },

  // =============================================
  // 팬존 홈
  // =============================================
  home: {
    title: 'FanZone',
    subtitle: '같은 팬들과 연결하세요',
    myCommunities: '내 커뮤니티',
    exploreAll: '전체 보기',
    exploreTitle: '커뮤니티 탐색',
    noCommunities: '아직 가입한 커뮤니티가 없습니다',
    noCommunitiesDesc: '아래에서 탐색하고 나의 커뮤니티를 찾아보세요 💜',
    exploreButton: '커뮤니티 탐색하기',
    trending: '인기 🔥',
    recent: '최신',
    featured: '추천',
    popular: '인기',
    all: '전체',
    loading: '커뮤니티 불러오는 중...',
    error: '문제가 발생했습니다 😅',
    retry: '다시 시도'
  },

  // =============================================
  // 필터 및 카테고리
  // =============================================
  filters: {
    categories: {
      kpop: 'K-Pop',
      kdrama: 'K-Drama',
      kbeauty: 'K-Beauty',
      kfood: 'K-Food',
      kgaming: 'K-Gaming',
      learning: '학습',
      other: '기타'
    },
    sortBy: {
      trending: '인기',
      recent: '최신',
      featured: '추천',
      popular: '인기순',
      members: '멤버 많은 순'
    },
    visibility: {
      public: '공개',
      private: '비공개'
    }
  },

  // =============================================
  // 팬룸 카드
  // =============================================
  card: {
    members: '멤버',
    active: '활성',
    join: '가입하기',
    joined: '가입됨',
    leave: '탈퇴',
    view: '보기',
    new: '새로운',
    trending: '🔥 인기',
    featured: '⭐ 추천',
    private: '🔒 비공개',
    online: '⚡ 활동 중',
    lastActivity: '최근 활동',
    createdBy: '만든 사람',
    memberCount: '{{count}}명의 멤버',
    activeCount: '{{count}}명 활동 중'
  },

  // =============================================
  // 팬룸 상세
  // =============================================
  detail: {
    join: '가입하기',
    joined: '가입됨',
    leave: '탈퇴',
    share: '공유',
    report: '신고',
    settings: '설정',
    members: '{{count}}명의 멤버',
    activeMembers: '{{count}}명 활동 중',
    createdBy: '{{name}}님이 만듦',
    joinedAt: '{{date}}에 가입',
    lastActivity: '최근 활동: {{date}}',
    description: '설명',
    tags: '태그',
    category: '카테고리',
    visibility: '공개 설정',
    tabs: {
      posts: '게시글',
      media: '미디어',
      chat: '채팅',
      members: '멤버'
    }
  },

  // =============================================
  // 게시글 탭
  // =============================================
  posts: {
    title: '게시글',
    createPost: '게시글 작성',
    writePost: '무엇을 공유하고 싶으신가요?',
    placeholder: '커뮤니티에 공유할 내용을 작성하세요...',
    addMedia: '사진/동영상 추가',
    publish: '게시',
    publishing: '게시 중...',
    noPosts: '아직 게시글이 없습니다',
    noPostsDesc: '첫 게시글을 작성해보세요! ✨',
    createFirst: '첫 게시글 작성',
    likes: '좋아요 {{count}}개',
    comments: '댓글 {{count}}개',
    share: '공유',
    like: '좋아요',
    unlike: '좋아요 취소',
    comment: '댓글',
    edit: '편집',
    delete: '삭제',
    report: '신고',
    postedBy: '{{name}}님이 작성',
    postedAt: '{{date}}',
    edited: '편집됨',
    deleteConfirm: '이 게시글을 삭제하시겠습니까?',
    deleteConfirmDesc: '이 작업은 되돌릴 수 없습니다.',
    cancel: '취소',
    confirm: '확인'
  },

  // =============================================
  // 미디어 탭
  // =============================================
  media: {
    title: '미디어',
    all: '전체',
    photos: '사진',
    videos: '동영상',
    noMedia: '아직 미디어가 없습니다',
    noMediaDesc: '사진과 동영상이 있는 게시글이 여기에 표시됩니다',
    viewPost: '게시글 보기',
    playVideo: '동영상 재생',
    pauseVideo: '동영상 일시정지',
    fullscreen: '전체 화면',
    download: '다운로드',
    share: '공유'
  },

  // =============================================
  // 채팅 탭
  // =============================================
  chat: {
    title: '채팅',
    placeholder: '메시지를 입력하세요...',
    send: '보내기',
    typing: '{{name}}님이 입력 중...',
    online: '{{count}}명 온라인',
    noMessages: '아직 메시지가 없습니다',
    noMessagesDesc: '대화를 시작해보세요! 💬',
    writeFirst: '첫 메시지 보내기',
    messageBy: '{{name}}',
    messageAt: '{{time}}',
    today: '오늘',
    yesterday: '어제',
    loadMore: '더 많은 메시지 불러오기',
    connectionLost: '연결이 끊어졌습니다',
    reconnecting: '재연결 중...',
    connected: '연결됨',
    disconnected: '연결 끊김'
  },

  // =============================================
  // 멤버 탭
  // =============================================
  members: {
    title: '멤버',
    search: '멤버 검색...',
    all: '전체',
    online: '온라인',
    admins: '관리자',
    moderators: '운영자',
    members: '멤버',
    noMembers: '아직 멤버가 없습니다',
    noMembersDesc: '멤버가 가입하면 여기에 표시됩니다',
    memberSince: '{{date}}부터 멤버',
    lastActive: '최근 활동: {{date}}',
    onlineNow: '현재 온라인',
    follow: '팔로우',
    following: '팔로잉',
    unfollow: '언팔로우',
    message: '메시지',
    profile: '프로필 보기',
    role: '역할',
    joinedAt: '{{date}}에 가입',
    promote: '승급',
    demote: '강등',
    kick: '추방',
    ban: '차단',
    unban: '차단 해제'
  },

  // =============================================
  // 팬룸 만들기
  // =============================================
  create: {
    title: 'FanRoom 만들기',
    subtitle: '당신의 열정을 세상과 공유하세요',
    name: 'FanRoom 이름',
    namePlaceholder: '예: BTS 아미 한국',
    nameHelp: '3-50자, 모든 사람에게 표시됩니다',
    slug: '커스텀 URL',
    slugPlaceholder: 'bts-army-korea',
    slugHelp: '소문자, 숫자, 하이픈만 사용 가능',
    description: '설명',
    descriptionPlaceholder: '커뮤니티에 대해 알려주세요...',
    descriptionHelp: '선택 사항, 최대 200자',
    category: '카테고리',
    categoryHelp: '다른 팬들이 찾을 수 있도록 도와줍니다',
    tags: '태그',
    tagsPlaceholder: 'bts, army, korea, kpop',
    tagsHelp: '최대 10개, 쉼표로 구분',
    visibility: '공개 설정',
    visibilityPublic: '공개 - 누구나 보고 가입할 수 있음',
    visibilityPrivate: '비공개 - 초대로만 가입 가능',
    coverImage: '커버 이미지',
    coverImageHelp: '권장: 1200x630px, 최대 5MB',
    uploadCover: '이미지 업로드',
    changeCover: '이미지 변경',
    removeCover: '이미지 삭제',
    create: 'FanRoom 만들기',
    creating: '만드는 중...',
    success: 'FanRoom이 만들어졌습니다! 🎉',
    successDesc: '커뮤니티가 활성화되었습니다',
    goToFanroom: '내 FanRoom으로 가기',
    error: 'FanRoom 생성 중 오류 발생',
    errorDesc: '잠시 후 다시 시도해주세요'
  },

  // =============================================
  // 폼 유효성 검사
  // =============================================
  validation: {
    required: '이 필드는 필수입니다',
    minLength: '최소 {{min}}자',
    maxLength: '최대 {{max}}자',
    invalidSlug: '소문자, 숫자, 하이픈만 사용 가능합니다',
    slugTaken: '이 URL은 이미 사용 중입니다',
    invalidEmail: '유효하지 않은 이메일입니다',
    fileTooBig: '파일이 너무 큽니다 (최대 {{max}}MB)',
    invalidFileType: '허용되지 않는 파일 형식입니다',
    maxFiles: '최대 {{max}}개의 파일',
    invalidTag: '유효하지 않은 태그입니다',
    maxTags: '최대 {{max}}개의 태그',
    contentRequired: '내용을 작성하거나 이미지를 업로드해주세요',
    contentTooLong: '최대 {{max}}자',
    messageRequired: '메시지를 입력해주세요',
    messageTooLong: '최대 {{max}}자'
  },

  // =============================================
  // 빈 상태
  // =============================================
  empty: {
    noFanrooms: '커뮤니티가 없습니다',
    noFanroomsDesc: '이 카테고리에 커뮤니티가 없습니다',
    noResults: '검색 결과 없음',
    noResultsDesc: '다른 검색어로 시도해보세요',
    noPosts: '게시글 없음',
    noPostsDesc: '아직 게시글이 없습니다',
    noMedia: '미디어 없음',
    noMediaDesc: '사진이나 동영상이 없습니다',
    noChat: '메시지 없음',
    noChatDesc: '대화를 시작해보세요',
    noMembers: '멤버 없음',
    noMembersDesc: '아직 멤버가 없습니다',
    loading: '불러오는 중...',
    error: '불러오기 오류',
    retry: '다시 시도'
  },

  // =============================================
  // 알림
  // =============================================
  notifications: {
    joined: '{{name}}에 가입했습니다',
    left: '{{name}}에서 나갔습니다',
    newPost: '{{name}}에 새 게시글',
    newComment: '{{name}}에 새 댓글',
    newMember: '{{name}}에 새 멤버',
    roleChanged: '{{name}}에서 역할이 변경되었습니다',
    fanroomUpdated: '{{name}}이(가) 업데이트되었습니다',
    postLiked: '{{name}}님이 게시글을 좋아합니다',
    commentLiked: '{{name}}님이 댓글을 좋아합니다',
    mentioned: '{{name}}에서 멘션되었습니다'
  },

  // =============================================
  // 관리 및 신고
  // =============================================
  moderation: {
    report: '신고',
    reportTitle: '콘텐츠 신고',
    reportReason: '신고 사유',
    reportDescription: '설명 (선택)',
    reportSubmit: '신고 제출',
    reportSuccess: '신고가 접수되었습니다',
    reportSuccessDesc: '곧 검토하겠습니다',
    reasons: {
      spam: '스팸',
      harassment: '괴롭힘',
      inappropriate: '부적절한 콘텐츠',
      fake: '허위 정보',
      other: '기타'
    },
    actions: {
      warn: '경고',
      mute: '음소거',
      kick: '추방',
      ban: '차단',
      delete: '삭제'
    },
    confirmAction: '{{user}}님을 {{action}}하시겠습니까?',
    confirmActionDesc: '이 작업은 되돌릴 수 없습니다'
  },

  // =============================================
  // 설정
  // =============================================
  settings: {
    title: '설정',
    notifications: '알림',
    privacy: '개인정보',
    account: '계정',
    notificationsDesc: '받을 알림을 선택하세요',
    privacyDesc: '개인정보를 관리하세요',
    accountDesc: '계정을 관리하세요',
    newPosts: '새 게시글',
    newComments: '새 댓글',
    newMembers: '새 멤버',
    mentions: '멘션',
    showOnlineStatus: '온라인 상태 표시',
    allowDirectMessages: 'DM 허용',
    save: '저장',
    saved: '저장됨',
    error: '저장 중 오류 발생'
  },

  // =============================================
  // 공통 오류
  // =============================================
  errors: {
    network: '연결 오류',
    networkDesc: '인터넷 연결을 확인하고 다시 시도해주세요',
    unauthorized: '인증 필요',
    unauthorizedDesc: '계속하려면 로그인해주세요',
    forbidden: '접근 거부',
    forbiddenDesc: '이 작업에 대한 권한이 없습니다',
    notFound: '찾을 수 없음',
    notFoundDesc: '요청한 콘텐츠가 존재하지 않습니다',
    serverError: '서버 오류',
    serverErrorDesc: '문제가 발생했습니다. 나중에 다시 시도해주세요',
    validationError: '유효성 검사 오류',
    validationErrorDesc: '표시된 필드를 확인해주세요',
    fileUploadError: '파일 업로드 오류',
    fileUploadErrorDesc: '다른 파일로 시도해주세요',
    genericError: '문제가 발생했습니다',
    genericErrorDesc: '잠시 후 다시 시도해주세요'
  },

  // =============================================
  // 액션 및 버튼
  // =============================================
  actions: {
    save: '저장',
    cancel: '취소',
    delete: '삭제',
    edit: '편집',
    share: '공유',
    copy: '복사',
    download: '다운로드',
    upload: '업로드',
    retry: '재시도',
    refresh: '새로고침',
    loadMore: '더 보기',
    showMore: '더 보기',
    showLess: '접기',
    close: '닫기',
    open: '열기',
    back: '뒤로',
    next: '다음',
    previous: '이전',
    finish: '완료',
    continue: '계속',
    skip: '건너뛰기',
    done: '완료',
    ok: '확인',
    yes: '예',
    no: '아니요',
    confirm: '확인',
    apply: '적용',
    reset: '초기화',
    clear: '지우기',
    search: '검색',
    filter: '필터',
    sort: '정렬',
    select: '선택',
    deselect: '선택 해제',
    selectAll: '전체 선택',
    deselectAll: '전체 해제'
  },

  // =============================================
  // 시간 및 날짜
  // =============================================
  time: {
    now: '지금',
    justNow: '방금',
    minutesAgo: '{{count}}분 전',
    hoursAgo: '{{count}}시간 전',
    daysAgo: '{{count}}일 전',
    weeksAgo: '{{count}}주 전',
    monthsAgo: '{{count}}개월 전',
    yearsAgo: '{{count}}년 전',
    today: '오늘',
    yesterday: '어제',
    tomorrow: '내일',
    thisWeek: '이번 주',
    lastWeek: '지난 주',
    thisMonth: '이번 달',
    lastMonth: '지난 달',
    thisYear: '올해',
    lastYear: '작년'
  },

  // =============================================
  // 복수형
  // =============================================
  plural: {
    members: {
      zero: '멤버 없음',
      one: '{{count}}명의 멤버',
      other: '{{count}}명의 멤버'
    },
    posts: {
      zero: '게시글 없음',
      one: '{{count}}개의 게시글',
      other: '{{count}}개의 게시글'
    },
    comments: {
      zero: '댓글 없음',
      one: '{{count}}개의 댓글',
      other: '{{count}}개의 댓글'
    },
    likes: {
      zero: '좋아요 없음',
      one: '좋아요 {{count}}개',
      other: '좋아요 {{count}}개'
    },
    messages: {
      zero: '메시지 없음',
      one: '{{count}}개의 메시지',
      other: '{{count}}개의 메시지'
    }
  }
} as const

// =============================================
// 타입
// =============================================

export type FanzoneKoTranslation = typeof fanzoneKo

// =============================================
// 헬퍼 함수
// =============================================

/**
 * 변수 보간
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
 * 복수형 처리
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
 * 숫자 포맷
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
 * 상대 시간 포맷
 */
export function formatRelativeTime(date: Date): string {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return fanzoneKo.time.justNow
  if (minutes < 60) return interpolate(fanzoneKo.time.minutesAgo, { count: minutes })
  if (hours < 24) return interpolate(fanzoneKo.time.hoursAgo, { count: hours })
  if (days < 7) return interpolate(fanzoneKo.time.daysAgo, { count: days })

  return date.toLocaleDateString('ko-KR')
}

export default fanzoneKo
