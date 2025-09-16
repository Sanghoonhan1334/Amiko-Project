export const translations = {
  ko: {
    // 헤더
    landingPage: '랜딩페이지',
    start: '시작하기',
    lounge: '라운지',
    
    // 언어
    korean: '한국어',
    spanish: 'Español',
    changeToSpanish: 'Cambiar a Español',
    changeToKorean: '한국어로 변경',
    
    // 공통 버튼
    buttons: {
      upload: '업로드',
      register: '등록',
      write: '작성',
      delete: '삭제',
      confirm: '확인',
      cancel: '취소',
      save: '저장',
      edit: '수정',
      submit: '제출',
      loading: '로딩 중...',
      uploading: '업로드 중...',
      saving: '저장 중...',
      writing: '작성 중...',
      deleting: '삭제 중...'
    },
    
    // 인증 관련
    auth: {
      forgotPassword: '비밀번호 찾기',
      signUp: '회원가입하기',
      signIn: '로그인하기',
      signUpDescription: '한국 문화 교류 플랫폼에 가입하고 새로운 경험을 시작하세요!',
      name: '이름',
      namePlaceholder: '이름을 입력하세요',
      email: '이메일',
      password: '비밀번호',
      passwordPlaceholder: '비밀번호를 입력하세요',
      passwordMinLength: '8자 이상',
      passwordHasNumber: '숫자 포함',
      passwordHasSpecial: '특수문자 포함',
      passwordNoRepeated: '연속된 문자 없음',
      confirmPassword: '비밀번호 확인',
      confirmPasswordPlaceholder: '비밀번호를 다시 입력하세요',
      passwordMismatch: '비밀번호가 일치하지 않습니다',
      phone: '전화번호',
      countryCode: '국가번호',
      country: '국가',
      selectCountry: '국가를 선택하세요',
      signingUp: '가입 중...',
      alreadyHaveAccount: '이미 계정이 있으신가요?',
      signUpSuccess: '회원가입이 완료되었습니다! 바로 로그인하실 수 있습니다.',
      signUpFailed: '회원가입에 실패했습니다.',
      signUpError: '회원가입 중 오류가 발생했습니다.',
      signInDescription: '계정에 로그인하고 한국 문화 교류를 시작하세요!',
      emailOrPhone: '이메일 또는 전화번호',
      emailOrPhonePlaceholder: 'example@email.com 또는 +82-10-1234-5678',
      signingIn: '로그인 중...',
      noAccount: '계정이 없으신가요?',
      signInFailed: '로그인에 실패했습니다.',
      sessionUpdateFailed: '세션 업데이트에 실패했습니다.',
      signInError: '로그인 중 오류가 발생했습니다.',
      credentialsCheckMessage: '입력하신 이메일 또는 비밀번호를 다시 확인해주세요.\n\n• 이메일 주소가 정확한지 확인\n• 비밀번호가 올바른지 확인\n• 대소문자 구분 확인'
    },
    
    // 인증 페이지 관련
    verification: {
      loginRequired: '로그인이 필요합니다',
      loginRequiredDescription: '인증을 위해서는 먼저 로그인해주세요.',
      title: '사용자 인증',
      subtitle: '상담 서비스 이용을 위한 인증 정보를 입력해주세요',
      infoCollectionGuide: '📋 정보 수집 안내',
      infoCollectionDescription: '이 정보 수집은 빠른 매칭과 안전을 위한 검증 절차입니다.',
      publicInfo: '공개되는 정보',
      name: '이름',
      major: '전공 (대학생인 경우)',
      languageLevel: '언어 수준',
      interests: '관심 분야',
      introduction: '자기소개',
      publicInfoDescription: '다른 사용자들이 볼 수 있는 기본 프로필 정보입니다.',
      privateInfo: '비공개 정보',
      phone: '전화번호',
      university: '대학교명',
      studentId: '학번',
      occupation: '직업/회사명',
      experience: '경력',
      availableTime: '가능한 시간',
      privateInfoDescription: '사용자들의 안전을 위한 내부 검증용으로만 사용됩니다.',
      basicInfoStep: '기본 정보 입력',
      matchingStep: '매칭 방식 선택',
      basicInfoDescription: '본인의 기본 정보와 관심 분야를 입력해주세요.',
      matchingDescription: '원하는 매칭 방식을 선택해주세요.',
      userType: '사용자 유형',
      student: '대학생',
      studentDescription: '현재 대학교에 재학 중인 학생',
      general: '일반인',
      generalDescription: '직장인, 자영업자, 기타',
      nationality: '국적',
      korean: '한국인',
      koreanDescription: '한국 국적자',
      nonKorean: '비한국인',
      nonKoreanDescription: '외국 국적자',
      profilePhoto: '프로필 사진',
      profilePreview: '프로필 미리보기',
      selectPhoto: '사진 선택',
      photoRequirements: 'JPG, PNG 파일만 가능 (최대 5MB)',
      namePlaceholder: '실명을 입력해주세요',
      phonePlaceholder: '010-1234-5678',
      universityPlaceholder: '서울대학교',
      majorPlaceholder: '한국어교육학과',
      grade: '학년',
      gradePlaceholder: '학년을 선택하세요'
    },
    
    // FAQ 페이지 관련
    faq: {
      title: '자주 묻는 질문',
      subtitle: 'Amiko 서비스에 대한 궁금한 점들을 모았습니다',
      totalQuestions: '총 {count}개의 질문',
      moreQuestions: '더 궁금한 점이 있나요?',
      moreQuestionsDescription: 'FAQ에서 답을 찾지 못했다면 언제든 문의해주세요',
      emailInquiry: '이메일 문의',
      customerService: '고객센터',
      categories: {
        lounge: 'ZEP 라운지',
        meeting: '만남 (영상)',
        community: '커뮤니티',
        account: '계정 및 인증'
      },
      lounge: {
        whatDoWeDo: 'ZEP 라운지에서는 무엇을 하나요?',
        whatDoWeDoAnswer: '한국 문화에 대한 자유로운 대화, 문화 체험, 특별 이벤트 등 다양한 활동을 할 수 있습니다. 매주 토요일 저녁에 운영자와 함께 즐거운 시간을 보냅니다.',
        pointsAvailable: '포인트도 받을 수 있나요?',
        pointsAvailableAnswer: '네! 라운지 참여 시 포인트를 받을 수 있으며, 특별 이벤트 참여 시 추가 포인트를 제공합니다. 정기 참여자에게는 특별 혜택도 있습니다.',
        whenOpen: '언제 열리나요?',
        whenOpenAnswer: '매주 토요일 저녁 8시(KST)에 정기적으로 열립니다. 특별 이벤트는 별도 공지되며, 원하는 날에 자유롭게 참여할 수 있습니다.',
        differentLanguages: '언어가 달라도 참여할 수 있나요?',
        differentLanguagesAnswer: '네! 한국어, 영어, 스페인어, 포르투갈어 등 다양한 언어로 소통할 수 있습니다. 언어 장벽 없이 한국 문화를 즐길 수 있어요.'
      },
      meeting: {
        howToMeet: '한국인 친구와 어떻게 만나나요?',
        howToMeetAnswer: '앱에서 한국인 친구를 선택하고 15분 무료 화상 만남을 예약할 수 있습니다. 통역 모드를 켜면 언어 장벽 없이 대화할 수 있어요.',
        translationMode: '통역 모드가 무엇인가요?',
        translationModeAnswer: '통역 모드를 켜면 실시간으로 한국어를 번역해드립니다. 끄면 보너스 포인트를 받을 수 있어요. 본인 인증이 완료되어야 이용 가능합니다.',
        howToUseCoupons: '쿠폰은 어떻게 사용하나요?',
        howToUseCouponsAnswer: '15분 만남 쿠폰을 구매하여 사용할 수 있습니다. 1장, 2장, 3장 묶음으로 구매 가능하며, 포인트로도 구매할 수 있어요.'
      },
      community: {
        howToGetPoints: '포인트는 어떻게 얻나요?',
        howToGetPointsAnswer: '질문 작성 시 +3점, 답변 작성 시 +3점을 받을 수 있습니다. 한국인은 더 많은 포인트를 받으며, 채택이나 좋아요를 받으면 추가 포인트를 받을 수 있어요.',
        dailyPointLimit: '일일 포인트 상한이 있나요?',
        dailyPointLimitAnswer: '네, 스팸 방지를 위해 일일 포인트 획득 상한이 있습니다. 한국인과 라틴 사용자에게는 다른 상한이 적용됩니다.',
        communityRules: '커뮤니티 규칙이 있나요?',
        communityRulesAnswer: '친근하고 존중하는 분위기에서 활동해주세요. 부적절한 내용이나 스팸은 제재를 받을 수 있으며, 쿨타임이 적용됩니다.'
      },
      account: {
        whyVerificationNeeded: '본인 인증이 왜 필요한가요?',
        whyVerificationNeededAnswer: '안전하고 신뢰할 수 있는 서비스를 위해 필요합니다. 인증 완료 시 영상 매칭, 쿠폰 사용, 커뮤니티 활동이 모두 가능해집니다.',
        verificationMethods: '인증 방법은 어떤 것이 있나요?',
        verificationMethodsAnswer: '한국인은 카카오 연동과 SMS 인증, 다른 국가 사용자는 WhatsApp, SMS, 이메일 인증을 선택할 수 있습니다.',
        verificationFailed: '인증이 안 되면 어떻게 하나요?',
        verificationFailedAnswer: '인증 코드 123456을 사용하여 테스트할 수 있습니다. 문제가 지속되면 고객센터에 문의해주세요.'
      }
    },
    
    // 메뉴
    profileMenu: '프로필',
    settings: '설정',
    
    // 달력
    calendar: {
      schedule: '일정',
      scheduleTitle: '8월 일정',
      scheduleSubtitle: '이번 달 ZEP 라운지 일정을 확인하고 원하는 날짜를 선택하세요',
      detailedInfo: '상세 정보',
      detailedInfoTitle: '8월 30일 (토) 상세 정보',
      detailedInfoSubtitle: '이날 ZEP 라운지 일정을 확인하고 참여해보세요!',
      months: {
        january: '1월',
        february: '2월',
        march: '3월',
        april: '4월',
        may: '5월',
        june: '6월',
        july: '7월',
        august: '8월',
        september: '9월',
        october: '10월',
        november: '11월',
        december: '12월'
      },
      days: {
        sun: '일',
        mon: '월',
        tue: '화',
        wed: '수',
        thu: '목',
        fri: '금',
        sat: '토'
      }
    },
    
    // 영상통화
    
    // 랜딩페이지
    landing: {
      platform: '한국 문화를 배우고 새로운 친구들을 만나세요',
      loveKorean: '한국을 사랑하는 당신을 위한',
      globalSpace: '글로벌 소통 공간',
      introVideo: '소개 영상',
      clickToWatch: '클릭하여 시청하기',
      start: '지금 시작하기',
      signupMessage: '가입하고 새로운 친구들을 만나보세요'
    },

    // 랜딩페이지 슬라이드
    heroSlides: {
      slide1: {
        badge: 'Amiko와 함께',
        title: 'Global Community를\n경험해보세요',
        description: '한국과 남미를 사랑하는 당신을 위한 글로벌 소통공간',
        subtitle: '전 세계 사용자들과\n함께하는 특별한 경험',
        features: {
          curriculum: '다양한 문화와 언어를 배울 수 있는 글로벌 커뮤니티',
          education: '실시간 소통을 통한 생생한 문화 교류 경험',
          experience: '전 세계 친구들과 함께하는 특별한 학습 여정'
        }
      },
      slide2: {
        badge: 'Amiko에 탑재된 AI 통역과 함께',
        title: '화상으로 소통하세요',
        description: '자체 플랫폼을 통한 1:1 AI 화상 채팅 시스템과\nAI 통역 서비스로 막힘없이, 간편하게,\n서로의 문화와 언어를 교류할 수 있습니다.',
        subtitle: '검증된 한국인 튜터들이\n여러분들과 함께합니다.',
        experience1: '서로의 나라에 대한 좋은 이미지를 가지고 그들을 만나기 위해 AI 화상 채팅 어플을 사용했던 경험이 있으신가요?',
        experience2: '혹시 그 경험이 당신에게 실망으로 다가오시지는 않으셨나요?',
        experience3: 'Amiko는 검증된 한국인 튜터들과 별점 시스템을 통해 좋은 경험을 여러분들께 선사합니다.',
        features: {
          curriculum: '한국어를 배우고 싶은 외국인들을 위한 맞춤형 커리큘럼',
          education: '한국 문화와 언어를 함께 배우는 체계적인 교육 시스템',
          experience: '실시간 화상 통화를 통한 생생한 한국어 학습 경험'
        }
      },
      slide3: {
        subtitle: '지구 반대편과 소통하세요.',
        title: 'Amiko 커뮤니티 서비스',
        description: 'Amiko는 지구 반대편을 연결하는 다리입니다. 커뮤니티를 통해 서로의 문화에 더욱 가까이 다가가보세요.',
        cards: {
          topicBoard: {
            title: '주제별 게시판',
            description: 'K-POP, K-DRAMA, K-뷰티, 트랜드, 여행 등 다양한 주제를 자유롭게 소통해보세요.'
          },
          freeBoard: {
            title: '자유게시판',
            description: '자유로운 주제로 자유롭게 지구 반대편과 소통해보세요.'
          },
          story: {
            title: '스토리',
            description: '나의 일상을 공유하고 일상에 대해서 대화해보세요.'
          },
          qna: {
            title: 'Q&A',
            description: 'Q&A 커뮤니티를 통해 서로에게 궁금한 점을 질문하고 직접 답변을 받아보세요.'
          }
        },
        ktrend: {
          title: 'K-Trend',
          description: '한국인이 직접 전하는 정확하고 빠른 K-Trend, Amiko에서 경험해보세요.'
        },
        freeboard: {
          title: '자유게시판',
          description: 'K-POP게시판, K-DRAMA게시판 여행 게시판, 자유 게시판을 통해 자유로운 소통을 경험해보세요.'
        },
        qna: {
          title: 'Q&A',
          description: 'Q&A 커뮤니티를 통해 서로에게 궁금한 점들을 질문하고 현지인에게 직접 답변을 받아보세요.'
        }
      }
    },
    
    hero: {
      title: '한국 문화를 배우고\n새로운 친구들을 만나세요',
      subtitle: '언어 장벽 없이 한국 문화를 체험하고, 전 세계 사람들과 소통하세요',
      cta: '지금 시작하기',
      video: '소개 영상 보기'
    },
    
    // 특별 서비스
    specialService: {
      title: '특별 서비스',
      heading: 'Amiko만의 특별한 서비스를 경험해보세요',
      description: '한국 문화 교류를 위한 맞춤형 서비스로 더욱 풍부한 경험을 제공합니다'
    },
    
    // 기능 카드들
    features: {
      meeting: {
        title: 'AI 화상 채팅 (Video llamada)',
        description: '한국인 친구와 15분 무료 상담으로 가볍게 시작할 수 있어요',
        videoSupport: 'AI 화상 채팅 지원',
        verifiedFriends: '검증된 한국인 친구',
        button: '쿠폰 받기'
      },
      loungePage: {
        title: 'ZEP 라운지',
        description: '주말 1회 운영자와 함께하는 서로 알아가는 시간을 경험해보세요',
        maxParticipants: '최대 30명 참여',
        freeTime: '자유로운 소통 시간',
        button: '라운지 가이드'
      }
    },
    
    // 기능 카드 배지
    featureBadges: {
      consultationCoupon: '1 AKO 쿠폰',
      pointReward: '포인트 리워드',
      weekendSpecial: '주말 특별 운영'
    },
    
    // 메인페이지
    main: {
      meet: 'AI 화상 채팅',
      community: '커뮤니티',
      me: '내 정보',
      meetDescription: '한국인 친구와 AI 화상 채팅을 통해 한국 문화를 배워보세요',
      communityDescription: '질문하고 답변하며 포인트를 모아 특별한 혜택을 받아보세요',
      meDescription: '프로필, 포인트, 쿠폰 등 개인 정보를 관리하세요',
      weekendLounge: '주말 라운지',
      time: '시간',
      maxParticipants: '최대 30명',
      viewCalendar: '달력 보기'
    },
    
    // 만남 탭
    meetTab: {
      verificationRequired: '본인 인증이 필요해요',
      verificationDescription: '화상 매칭을 이용하려면 본인 인증이 필요합니다. 지금 바로 인증해보세요!',
      verificationBenefits: '인증 완료 후 Amiko의 모든 기능을 이용할 수 있습니다.',
      verifyNow: '지금 인증하기',
      searchFriends: '친구 찾기',
      all: '전체',
      byActivityScore: '활동 점수순',
      byName: '이름순',
      selectCoupon: '쿠폰 선택',
      quickMatch: '빠른 매칭',
      unverified: '미인증',
      bookConsultation: '상담 예약',
      viewProfile: '프로필 보기',
      customizedMatching: '맞춤형 친구 매칭',
      customizedDescription: '관심사, 언어 수준, 가능한 시간을 고려한 맞춤형 매칭',
      videoSupport: '화상 지원',
      // 쿠폰 옵션들
      freeCoupon: '신규 무료 쿠폰 (1장)',
      bundleCoupon2: 'AKO 쿠폰 2장 묶음',
      bundleCoupon3: 'AKO 쿠폰 3장 묶음',
      verifiedFriends: '인증된 친구',
      flexibleTime: '유연한 시간',
      online: '온라인',
      offline: '오프라인'
    },
    
    // 라운지 페이지
    loungePage: {
      title: 'ZEP 주말 라운지',
      subtitle: '운영자와 함께하는 즐거운 한국 문화 수다타임!',
      description: '매주 토요일 저녁, 여러분을 기다리고 있어요',
      time: '매주 토요일 20:00 (KST)',
      maxParticipants: '최대 30명 참여',
      nextSession: '다음 세션',
      saturday: '토요일',
      specialTime: '운영자와 함께하는 특별한 시간',
      specialDescription: '자유로운 대화와 한국 문화 Q&A 시간',
      enterZep: 'ZEP 입장하기',
      specialEvent: '🎯 매주 토요일 저녁 운영자와 함께하는 특별한 시간',
      schedule: '일정',
      scheduleDescription: '이번 달 ZEP 라운지 일정을 확인하고 원하는 날짜를 선택하세요',
      selectedDateInfo: '상세 정보',
      selectedDateDescription: '이 날의 ZEP 라운지 일정을 확인하고 참여해보세요!',
      activities: '라운지에서 하는 일',
      freeConversation: '자유로운 대화',
      freeConversationDescription: '한국 문화, 여행, 음식 등 다양한 주제로 대화해요',
      culturalExperience: '문화 체험',
      culturalExperienceDescription: '한국의 전통과 현대 문화를 체험할 수 있어요',
      specialEvents: '특별 이벤트',
      specialEventsDescription: '정기적으로 특별 이벤트와 선물을 제공해요',
      ctaTitle: '지금 바로 ZEP 라운지에 참여해보세요!',
      ctaDescription: '한국 문화를 배우고 새로운 친구를 만날 수 있는 특별한 시간',
      ctaInstruction: '🎈 위의 "ZEP 입장하기" 버튼을 클릭하여 라운지에 참여하세요',
      timezone: {
        myTime: '내 시간'
      },
      filters: {
        topic: '주제',
        language: '언어',
        level: '난이도',
        price: '무료/유료',
        reset: '필터 초기화',
        topics: {
          freeTalk: '자유 대화',
          kCulture: '한국 문화',
          travel: '여행',
          food: '음식'
        },
        languages: {
          korean: '한국어',
          spanish: '스페인어',
          english: '영어'
        },
        levels: {
          beginner: '초급',
          intermediate: '중급',
          advanced: '고급'
        },
        priceOptions: {
          all: '전체',
          free: '무료',
          paid: '유료'
        }
      },
      sessions: {
        upcoming: '다가오는 세션',
        seatsLeft: '잔여석',
        startsAt: '시작',
        joinNow: '입장하기'
      },
      highlights: {
        title: '하이라이트 스토리',
        subtitle: '지난 라운지 참여자들의 베스트 순간'
      },
      guide: {
        title: '라운지 가이드 & FAQ',
        etiquette: {
          title: '에티켓',
          content: '상대방을 존중하고 배려하는 마음으로 대화해요. 욕설, 비하, 스팸은 금지입니다.'
        },
        verification: {
          title: '본인인증',
          content: '안전하고 신뢰할 수 있는 공간을 위해 간단한 본인 인증을 권장합니다.'
        },
        points: {
          title: '포인트 안내',
          content: '참여와 기여에 따라 포인트를 획득할 수 있으며, 추후 다양한 혜택으로 교환할 수 있어요.'
        }
      },
      mobileCta: {
        todayStart: '오늘 {{time}} 시작',
        enterNow: '입장하기'
      }
    },
    
    // 라운지 미니
    loungeMini: {
      weekendEvent: '주말 특별 이벤트',
      title: 'ZEP 라운지',
      subtitle: '운영자가 직접 참여하는 특별한 시간을 경험해보세요',
      saturdayEvent: '토요일 이벤트',
      time: '20:00',
      kst: 'KST',
      operationTime: '운영 시간',
      participants: '30',
      maxParticipants: '최대 참여자',
      firstComeFirstServed: '선착순',
      timeByCountry: '국가별 시간',
      countries: {
        korea: '한국',
        peru: '페루',
        mexico: '멕시코'
      },
      timeFormat: {
        korea: '한국: 20:00 (KST)',
        peru: '페루: 06:00 (PET)',
        mexico: '멕시코: 05:00 (CST)'
      },
      specialTime: '특별 시간',
      gettingToKnow: '서로 알아가는 시간',
      description: '자유로운 대화와 한국 문화 체험을 통해 새로운 친구를 만들어보세요',
      features: {
        freeTalk: '자유로운 대화',
        culturalExchange: '문화 교류',
        makeFriends: '친구 만들기'
      },
      button: '라운지 가기',
      message: '매주 토요일 저녁, 여러분을 기다리고 있어요!'
    },
    
    // 커뮤니티 탭
    communityTab: {
      story: '스토리',
      qa: 'Q&A',
      lounge: '라운지',
      todayStory: '오늘의 스토리',
      uploadStory: '스토리 올리기',
      askQuestion: '질문하기',
      noStories: '스토리가 없습니다',
      newStory: '새 스토리 작성',
      storyText: '스토리 텍스트',
      photoUpload: '사진 업로드',
      publicStory: '공개 스토리',
      privateStory: '비공개 스토리',
      autoDelete: '24시간 후 자동 삭제',
      like: '좋아요',
      comment: '댓글',
      writeComment: '댓글을 입력하세요...',
      noComments: '아직 댓글이 없습니다.',
      newQuestion: '새로운 질문 작성',
      title: '제목',
      titlePlaceholder: '질문의 제목을 입력하세요',
      category: '카테고리',
      tags: '태그 (쉼표로 구분)',
      tagsPlaceholder: '예: 화장품, 민감성피부, 추천',
      questionContent: '질문 내용',
      questionContentPlaceholder: '질문의 자세한 내용을 입력하세요...',
      registerQuestion: '질문 등록',
      // 자유게시판
      freeboard: {
        writePost: '게시글 작성',
        writePostDescription: '새로운 게시글을 작성해주세요. 제목과 내용을 입력하고 카테고리를 선택하세요.',
        titlePlaceholder: '제목을 입력하세요',
        postType: '게시글 유형',
        normalPost: '일반 게시글',
        survey: '설문조사',
        notice: '공지사항 (운영자만)',
        surveyTips: '설문조사 게시글 작성 팁:',
        surveyTip1: '질문을 명확하게 작성해주세요',
        surveyTip2: '여러 선택지를 제공하면 더 좋습니다',
        surveyTip3: '예: "가장 좋아하는 K-pop 그룹은? 1) BTS 2) BLACKPINK 3) NewJeans 4) 기타"',
        surveyOptions: '설문 선택지',
        author: '글쓴이',
        createdAt: '작성일',
        views: '조회',
        likes: '추천',
        loadingPosts: '게시글을 불러오는 중...',
        noPosts: '게시글이 없습니다.',
        retry: '다시 시도',
        searchPlaceholder: '제목, 내용, 작성자로 검색',
        allPosts: '전체글',
        freeBoard: '자유게시판',
        latest: '최신순',
        popular: '인기순',
        comments: '댓글순'
      },
      // 게시글 상세
      postDetail: {
        loadingPost: '게시글을 불러오는 중...',
        views: '조회',
        comments: '댓글',
        reply: '답글',
        replyPlaceholder: '답글을 입력하세요...',
        writeReply: '답글 작성',
        noComments: '아직 댓글이 없습니다.',
        writeComment: '댓글 작성',
        commentPlaceholder: '댓글을 입력하세요...'
      },
      categories: {
        all: '전체',
        beauty: '뷰티',
        fashion: '코디',
        travel: '한국여행',
        culture: '한국문화',
        free: '자유'
      },
      pointRules: '포인트 획득 규칙',
      todayActivity: '오늘의 활동',
      searchQuestions: '질문 검색...',
      unverified: '미인증 (테스트)',
      koreans: '한국인',
      question: '질문',
      answer: '답변',
      dailyLimit: '일일 한도',
      adoptionLikeBonus: '채택/좋아요 보너스',
      latinUsers: '라틴 사용자',
      spamCooldown: '스팸 방지 대기시간',
      myQuestions: '내 질문',
      myAnswers: '내 답변',
      pointsAcquired: '획득 포인트',
      upvotesReceived: '받은 좋아요',
      loungeHooks: {
        thisWeekLounge: '이번 주 라운지',
        joinSpecialTime: '운영자와 함께하는 특별한 시간에 참여하세요',
        goToLounge: '라운지 가기',
        specialReward: '특별 보상',
        points: '포인트',
        nativeAdTitle: '🎈 라운지에서 특별한 시간을 보내세요!',
        nativeAdDescription: '매주 토요일 저녁, 운영자와 함께하는 한국 문화 수다타임',
        seatsRemaining: '석 남음',
        joinNow: '지금 참여',
        sponsored: '후원',
        loungeParticipation: '라운지 참여',
        specialBonusPoints: '특별 보너스 포인트 획득',
        nextLounge: '다음 라운지',
        rewards: '보상',
        weeklySchedule: '매주 토요일 정기 운영',
        whatWeDoInLounge: '라운지에서 하는 일'
      }
    },

    // 라운지 리워드 모달
    loungeReward: {
      welcome: '라운지에 오신 것을 환영합니다!',
      pointsEarned: '포인트 획득',
      pointsDescription: '라운지 참여로 특별 포인트를 받았습니다',
      specialBenefits: '라운지 특별 혜택',
      networkingOpportunity: '네트워킹 기회',
      meetNewFriends: '새로운 친구들을 만나보세요',
      languageExchange: '언어 교환',
      practiceLanguage: '자연스러운 언어 연습',
      specialEvents: '특별 이벤트',
      weeklySpecialEvents: '매주 특별한 이벤트 참여',
      showGuide: '가이드 보기',
      startNow: '지금 시작',
      quickGuide: '라운지 이용 가이드',
      guide: {
        step1: {
          title: '자기소개하기',
          description: '간단히 인사하고 자신을 소개해보세요'
        },
        step2: {
          title: '대화 참여하기',
          description: '관심 있는 주제에 자유롭게 참여하세요'
        },
        step3: {
          title: '즐기기',
          description: '문화 교류를 통해 즐거운 시간을 보내세요'
        }
      },
      back: '이전',
      gotIt: '확인했어요'
    },

    // 라운지 참여자
    loungeParticipants: {
      noParticipants: '아직 참여자가 없어요',
      participants: '명 참여 중'
    },
    
    // 포인트 현황
    pointStatus: {
      title: '포인트 현황',
      totalPoints: '총 포인트',
      acquiredToday: '오늘 획득',
      remainingLimit: '남은 한도',
      korean: '🇰🇷 한국인',
      local: '🌎 현지인',
      recentPointEarnings: '최근 포인트 획득'
    },
    
    // 프로필
    profile: {
      myProfile: '내 프로필',
      name: '이름',
      major: '전공',
      year: '학년',
      university: '대학교',
      selfIntroduction: '자기소개',
      availableTime: '가능한 시간',
      interests: '관심사',
      joinDate: '가입일',
      myPoints: '내 포인트',
      thisMonthPoints: '이번 달 포인트',
      consecutiveDays: '연속 출석',
      exchangeCount: 'AI 화상 채팅 횟수',
      totalCases: '총 {count}건 진행',
              successfulExchanges: '성공적인 AI 화상 채팅',
      myCoupons: '내 쿠폰',
      expirationDate: '만료일',
      noExpiration: '무기한',
      purchaseHistory: '구매 내역',
      purchaseItems: {
        consultation15min2: 'AKO 쿠폰 2장'
      },
      edit: '수정',
      native: '현지인',
      unverified: '미인증',
      consultation15min: '15분 상담',
      weekdayEvening: '평일저녁',
      weekendAfternoon: '주말오후',
      koreanLanguage: '한국어',
      koreanCulture: '한국문화',
      cooking: '요리',
      travel: '여행',
      music: '음악',
      units: {
        cases: '건',
        points: '점',
        rank: '위'
      }
    },
    
    // 알림 설정
    notificationSettings: {
      title: '알림 설정',
      subtitle: '받고 싶은 알림을 선택하고 설정하세요.',
      systemStatus: '시스템 상태',
      reset: '초기화',
      testNotification: '테스트 알림',
      saving: '저장 중...',
      save: '저장',
      autoSaving: '자동 저장 중...',
      saveSettings: '설정 저장',
      notificationChannels: '알림 채널',
      channelDescription: '어떤 방식으로 알림을 받을지 선택하세요.',
      emailNotification: '이메일 알림',
      emailDescription: '이메일로 알림을 받습니다.',
      browserPushNotification: '브라우저 푸시 알림',
      browserPushDescription: '브라우저에서 푸시 알림을 받습니다.',
      inAppNotification: '웹 내 알림',
      inAppDescription: '웹사이트에서 알림을 확인합니다.',
      notificationTypes: '알림 유형별 설정',
      typesDescription: '각 채널에서 어떤 알림을 받을지 선택하세요.',
      email: '이메일',
      push: '푸시',
      website: '웹사이트',
      successMessage: '알림 설정이 저장되었습니다.',
      errorMessage: '설정을 불러올 수 없습니다. 기본값을 사용합니다.',
      networkError: '네트워크 오류가 발생했습니다. 기본값을 사용합니다.',
      tableMissing: '알림 설정 테이블이 아직 생성되지 않았습니다. 기본값을 사용합니다.',
      testSuccess: '테스트 알림이 전송되었습니다!',
      testError: '테스트 알림 전송 중 오류가 발생했습니다.'
    },
    
    // 마이 탭
    myTab: {
      // 한국인 전용
      koreanRank: '한국인 순위',
      koreanRankDescription: '{count}명 중',
      top3: '🏆 TOP 3',
      top10: '🥈 TOP 10',
      normal: '🥉 일반',
      
      // 커뮤니티 활동
      communityActivity: '커뮤니티 활동',
      communityDescription: '질문/답변/채택',
      thisMonthPoints: '이번 달 +{points} pts',
      
      // 알림 설정
      notificationSettings: '알림 설정',
      webPushNotification: '웹 푸시 알림',
      webPushDescription: '새 메시지, 업데이트 알림',
      emailNotification: '이메일 알림',
      emailDescription: '중요한 업데이트와 이벤트 소식',
      marketingNotification: '마케팅 알림',
      marketingDescription: '특별 혜택과 이벤트 정보',
      
      // 상태
      completed: '완료',
      pending: '진행 중',
      cancelled: '취소됨'
    },
    
    // 스토리 설정
    

    
    // 푸터
    footer: {
      description: '한국 문화를 배우고 새로운 친구들을 만날 수 있는 글로벌 플랫폼',
      madeWithLove: '사랑과 열정으로 만들어졌습니다',
      copyright: '모든 권리 보유',
      privacy: '개인정보처리방침',
      terms: '이용약관',
      cookies: '쿠키 정책',
      support: '지원',
      help: '도움말',
      faq: '자주 묻는 질문',
      contact: '연락처',
      feedback: '피드백',
      company: '회사',
      about: '회사 소개',
      followUs: '팔로우하기',
      globalMessage: 'Made with ❤️ and ✨ for global community',
      bridgeDescription: '한국과 남미를 잇는 다리, AMIKO',
      officialSns: 'AMIKO 공식 SNS'
    },

    // 새로 추가된 섹션들
    // 문의 페이지
    inquiry: {
      title: '문의하기',
      subtitle: '궁금한 점이 있으시면 언제든 문의해주세요',
      heroTitle: '불편사항을\n알려주세요',
      heroSubtitle: '사용 중 불편한 점이나 개선사항이 있다면 언제든지 문의해주세요.\n빠른 시일 내에 답변드리겠습니다.',
      inquiryType: '문의 유형',
      inquiryTypeSubtitle: '어떤 종류의 문의든 편하게 남겨주세요',
      inquiryTypes: {
        general: '일반 문의',
        technical: '기술 문의',
        business: '사업 문의',
        other: '기타',
        bug: '버그 신고',
        feature: '기능 제안',
        payment: '결제 문의',
        account: '계정 문의'
      },
      inquiryTypeDescriptions: {
        bug: '앱이나 웹사이트에서 발견한 오류를 신고해주세요',
        feature: '새로운 기능이나 개선사항을 제안해주세요',
        general: '기타 궁금한 사항이나 도움이 필요한 내용',
        payment: '결제 관련 문제나 환불 문의',
        account: '로그인, 회원가입, 계정 관련 문제',
        other: '위 카테고리에 해당하지 않는 문의'
      },
      priority: '우선순위',
      priorities: {
        low: '낮음',
        medium: '보통',
        high: '높음',
        urgent: '긴급'
      },
      subject: '제목',
      message: '메시지',
      submit: '문의하기',
      submitSuccess: '문의가 성공적으로 전송되었습니다',
      submitError: '문의 전송 중 오류가 발생했습니다',
      successTitle: '문의가 성공적으로 제출되었습니다!',
      successMessage: '빠른 시일 내에 답변드리겠습니다. 감사합니다.',
      newInquiry: '새 문의 작성',
      goHome: '홈으로 돌아가기'
    },

    // 제휴 문의 페이지
    partnership: {
      title: '제휴 문의',
      subtitle: '비즈니스 파트너십 제안',
      benefitsTitle: '파트너십을 통해 더 큰 가치를 만들어보세요.',
      benefitsSubtitle: 'AMIKO와 함께, 세계와 함께.',
      benefits: {
        brandExpansion: {
          title: '브랜드 홍보',
          description: 'Amiko 커뮤니티를 통해 파트너사의 브랜드가\n젊은 글로벌 고객층에 더 넓고 자연스럽게 확산되도록 돕습니다.'
        },
        customerExpansion: {
          title: '새로운 시장',
          description: 'Amiko의 한국-남미 고객층을 통해\n파트너사의 브랜드를 양 대륙에 연결합니다.'
        },
        revenueIncrease: {
          title: '신규 고객',
          description: 'Amiko 플랫폼을 통해 파트너사의 브랜드와 서비스가\n새로운 글로벌 고객층에 도달할 수 있도록 지원합니다.'
        }
      },
      companyName: '회사명',
      ceoName: '대표자명',
      contact: '연락처',
      businessField: '사업 분야',
      companySize: '회사 규모',
      companySizes: {
        startup: '스타트업 (1-10명)',
        small: '소기업 (11-50명)',
        medium: '중기업 (51-200명)',
        large: '대기업 (200명 이상)'
      },
      partnershipType: '제휴 유형',
      partnershipTypes: {
        advertising: '광고 제휴',
        collaboration: '협업 제휴',
        investment: '투자 제휴',
        distribution: '유통 제휴',
        other: '기타'
      },
      budget: '예산',
      expectedEffects: '기대 효과',
      attachment: '첨부파일',
      attachmentDescription: '회사 소개서, 제안서 등을 첨부해주세요',
      submit: '제휴 문의하기',
      submitSuccess: '제휴 문의가 성공적으로 전송되었습니다',
      submitError: '제휴 문의 전송 중 오류가 발생했습니다'
    },


    // 메인페이지 헤더
    mainHeader: {
      home: '홈',
      videoCall: 'AI 화상 채팅',
      community: '커뮤니티',
      charging: '충전소',
      event: '이벤트',
      profile: '프로필',
      logout: '로그아웃',
      myInfo: '내정보',
      notifications: '알림'
    },

    // 헤더 네비게이션
    header: {
      home: '홈',
      about: '회사소개',
      inquiry: '문의',
      partnership: '제휴문의',
      startButton: '시작하기'
    },

    // 충전소 탭

    // 이벤트 탭

    // 메인페이지
    mainPage: {
      title: '다양하게 즐기세요',
      videoCall: 'AI 화상 채팅',
      videoCallDescription: '출석체크에 참여하고, 내가 원하는 한국인과 AKO로 AI 화상 채팅해보세요.',
      community: '커뮤니티',
      communityDescription: '커뮤니티를 통해 서로 소통해보세요.',
      openEvent: '오픈 기념 이벤트',
      openEventDescription: '11월까지 회원가입하면 3 AKO 지급!',
      openEventNote: '*자세한 내용은 이벤트 페이지 참고',
      cbtBadge: '10월 오픈 예정',
      cbtText: '10월 오픈 예정',
      eventBadge: 'EVENT',
      chargingStation: '충전소',
      chargingStationDescription: 'AKO 쿠폰과 VIP 기능을 구매하세요',
      myPoints: '내 포인트',
      totalPoints: '총 포인트',
      attendancePoints: '출석체크',
      communityPoints: '커뮤니티',
      videoCallPoints: 'AKO',
      points: '포인트',
      akoExplanation: '1 AKO = AI 화상 채팅 1회 (20분)'
    },

    // 커뮤니티
    community: {
      title: '커뮤니티 포인트',
      subtitle: '활동으로 포인트를 모아보세요!',
      pointRules: '포인트 획득 규칙',
      askQuestion: '질문 작성',
      writeAnswer: '답변 작성',
      writeStory: '스토리 작성',
      freeBoard: '자유게시판',
      totalPoints: '총 포인트',
      todayAcquisition: '오늘 획득',
      remainingLimit: '남은 한도',
      points: '포인트',
      qa: '질문답변',
      story: '스토리',
      koreanNews: '한국뉴스',
      userType: {
        korean: '한국인',
        latin: '현지인'
      }
    },

    // 영상통화 통계
    videoCallStats: {
      title: '나의 통화 통계',
      totalCalls: '총 통화 횟수',
      totalTime: '총 통화 시간(분)',
      conversationPartners: '대화 상대 수',
      earnedPoints: '획득 포인트'
    },

    // 이벤트 탭
    eventTab: {
      attendanceCheck: {
        title: '출석체크',
        subtitle: '매일 출석체크를 하고 연속 출석으로 특별한 보상을 받아보세요!',
        eventTitle: '출석체크 이벤트',
        monthCompletion: '한 달 완주',
        monthCompletionDescription: '에 따른 특별 보상을 받을 수 있습니다.',
        calendarTitle: '출석체크',
        yearMonthFormat: '{year}년 {month}월',
        rewardSystem: '보상 시스템',
        days: '일',
        coupons: '쿠폰',
        points: '포인트',
        couponUnit: '개',
        pointUnit: '점',
        consecutiveDays: '연속',
        monthCompletionReward: '한 달 완주',
        pointMethods: {
          title: '포인트 얻는 방법',
          community: '커뮤니티 활동',
          videoCall: '영상통화',
          communityDescription: '하루 최대 +20점 (게시글 작성, 댓글, 좋아요)',
          videoCallDescription: '1회 완료 시 +40점',
          chatExtension: '포인트는 채팅 연장에만 사용됩니다',
          noVideoCoupon: '포인트로 영상통화권은 구매할 수 없습니다'
        },
        specialEvents: {
          title: '특별 이벤트',
          localEvent: {
            title: '현지인 특별 이벤트',
            description: '한국 여행과 문화 체험의 기회',
            reward: '한국 왕복 항공권 + 가이드',
            specialBenefit: '운영자가 한국 가이드',
            firstPrize: '1등 상품',
            specialBenefitTitle: '특별 혜택',
            period: '6~12월 가장 높은 포인트를 받은 1등에게 지급됩니다!'
          },
          koreanEvent: {
            title: '한국인 특별 이벤트',
            description: '영어 실력 향상을 위한 시험 지원',
            toeic: '토익 시험 응시료 지원',
            toefl: '토플 시험 응시료 지원',
            examFeeSupport: '시험 응시료 전액 지원'
          }
        },
        welcomeReward: {
          title: '가입 축하 보상',
          description: '최초 가입 시 쿠폰 1개 지급',
          coupon: '쿠폰 1개',
          points: '포인트 50점'
        },
        specialReward: 'VIP 15일권'
      }
    },

    // 헤더 네비게이션
    headerNav: {
      home: '홈',
      videoCall: '화상 채팅',
      community: '커뮤니티',
      store: '상점',
      storeShort: '상점',
      chargingStation: '충전소',
      chargingStationShort: '충전소',
      event: '이벤트',
      logout: '로그아웃',
      myInfo: '내정보'
    },

    // 프로필 설정
    profileSettings: {
      title: '프로필 설정',
      subtitle: '언어, 시간대, 국가 등 개인 설정을 관리하세요',
      timezone: {
        title: '시간대 설정',
        description: '현재 위치에 맞는 시간대를 선택하면 모든 시간이 현지 시간으로 표시됩니다',
        label: '시간대',
        placeholder: '시간대 선택',
        currentTime: '현재 시간',
        currentTimeDescription: '선택된 시간대의 현재 시간입니다',
        comparison: '주요 도시 시간 비교',
        noTimeInfo: '시간 정보 없음'
      },
      region: {
        title: '지역 및 언어 설정',
        description: '국가와 언어를 설정하여 맞춤형 서비스를 받으세요',
        country: '국가',
        countryPlaceholder: '국가 선택',
        language: '언어',
        languagePlaceholder: '언어 선택',
        displayName: '표시 이름 (선택사항)',
        displayNamePlaceholder: '다른 사용자에게 보여질 이름'
      },
      actions: {
        cancel: '취소',
        save: '설정 저장',
        saving: '저장 중...',
        saved: '설정이 저장되었습니다!'
      },
      countries: {
        KR: '대한민국',
        US: '미국',
        GB: '영국',
        FR: '프랑스',
        DE: '독일',
        JP: '일본',
        CN: '중국',
        AU: '호주',
        CA: '캐나다',
        SG: '싱가포르'
      },
      timezones: {
        'Asia/Seoul': '한국 (UTC+9)',
        'America/New_York': '미국 동부 (UTC-5)',
        'America/Los_Angeles': '미국 서부 (UTC-8)',
        'Europe/London': '영국 (UTC+0)',
        'Europe/Paris': '프랑스 (UTC+1)',
        'Asia/Tokyo': '일본 (UTC+9)',
        'Asia/Shanghai': '중국 (UTC+8)',
        'Australia/Sydney': '호주 (UTC+10)',
        'Asia/Dubai': 'UAE (UTC+4)',
        'Asia/Singapore': '싱가포르 (UTC+8)'
      }
    },

    // 스토리 설정
    storySettings: {
      globalSettings: {
        title: '전역 스토리 설정',
        autoPublic: {
          label: '새 스토리 자동 공개',
          description: '새로 업로드하는 스토리를 기본적으로 공개로 설정'
        },
        showInProfile: {
          label: '프로필에 스토리 표시',
          description: '내 프로필에서 스토리 히스토리 표시'
        }
      },
      archiveSettings: {
        title: '아카이브 설정',
        autoArchive: {
          label: '자동 아카이브',
          description: '만료된 스토리를 자동으로 아카이브'
        },
        archiveTiming: {
          label: '아카이브 시점',
          options: {
            '1': '1시간 후',
            '6': '6시간 후',
            '12': '12시간 후',
            '24': '24시간 후'
          }
        }
      },
      individualSettings: {
        title: '개별 스토리 설정',
        public: '공개',
        private: '비공개',
        delete: '삭제',
        deleteConfirm: '정말로 이 스토리를 삭제하시겠습니까?',
        storyImage: '스토리 이미지'
      }
    },

    // 채팅 관련
    chat: {
      rulesModal: {
        title: '📌 Amiko 채팅 규칙 안내',
        mentorRules: {
          title: '멘토 운영 규칙',
          description: '멘토들은 Amiko 플랫폼 내에서만 활동하며, 스펙과 리워드를 받습니다.'
        },
        noContactExchange: {
          title: '개인 연락처 교환 금지',
          description: '개인 연락처나 SNS 정보 교환은 절대 불가합니다.'
        },
        amikoServices: {
          title: 'Amiko의 서비스',
          description: 'Amiko는 번역, 포인트, 안전한 환경을 제공합니다. 모든 대화는 Amiko 내에서만 이루어져야 합니다.'
        },
        agreement: '☑ 위 내용을 이해했고 동의합니다.',
        cancel: '취소',
        agreeAndEnter: '동의 후 입장'
      },
      room: {
        welcomeMessage: 'Amiko 채팅방에 오신 것을 환영합니다! 안전하고 즐거운 대화를 나누세요.',
        noContactBanner: '번호 교환은 불가합니다 🙏 Amiko 안에서만 대화하세요.',
        mentorStatus: {
          online: '온라인 상태입니다.',
          busy: '현재 다른 상담 중입니다. 잠시 후 다시 시도해주세요.',
          offline: '현재 오프라인입니다. 접속 시 알림을 받습니다.'
        },
        messagePlaceholder: '메시지를 입력하세요...',
        disabledPlaceholder: '채팅 규칙에 동의한 후 사용 가능합니다'
      }
    },

    // 상점
    storeTab: {
      title: '상점',
      subtitle: '포인트로 다양한 리워드를 구매하세요',
      myPoints: '내 포인트 현황',
      availablePoints: '사용 가능한 포인트',
      totalPoints: '누적 포인트',
      shopPurchase: '상점 구매용',
      rankingEvent: '랭킹/이벤트용',
      items: {
        chatExtension: {
          name: '채팅 연장권',
          description: '모든 멘토와 채팅 연장 (6시간)',
          price: '100점'
        },
        amikoMerchandise: {
          name: 'Amiko 굿즈',
          description: 'Amiko 브랜드 굿즈 (머그컵, 스티커 등)',
          price: '500점'
        },
        kBeautyTicket: {
          name: 'K-뷰티 체험권',
          description: '한국 뷰티 체험 및 상품 제공',
          price: '1000점'
        },
        specialEventTicket: {
          name: '스페셜 이벤트 응모권',
          description: '특별 이벤트 참여 기회',
          price: '2000점'
        }
      },
      comingSoon: 'Coming Soon',
      buyNow: '구매하기',
      preparing: '준비 중',
      howToEarn: '포인트 획득 방법',
      communityActivity: '커뮤니티 활동',
      videoCall: '영상통화',
      footerMessage: '✨ 앞으로 더 많은 리워드가 추가될 예정입니다! 포인트를 모아두세요 🙌'
    },

    // 충전소
    chargingTab: {
      coupons: {
        title: 'AKO 쿠폰',
        subtitle: 'AKO 쿠폰을 구매하여 AI 화상 채팅을 즐기세요',
        popular: '인기',
        discount: '할인',
        perUnit: '개당',
        buyNow: '구매하기',
        unit: '개',
        minutes: '분'
      },
      search: {
        noResults: '검색 결과가 없습니다',
        adjustFilters: '검색어나 카테고리를 조정해보세요',
        resetFilters: '필터 초기화'
      },
      vip: {
        title: 'VIP 기능',
        subtitle: '프리미엄 기능으로 더욱 특별한 경험을 즐기세요',
        monthly: '월간 VIP',
        yearly: '연간 VIP',
        period: '1개월',
        periodYear: '1년',
        mostPopular: '가장 인기',
        subscribe: '구독하기',
        monthlySavings: '월 $3.3 절약',
        monthlyLevel: '월 $6.7 수준',
        features: {
          beautyFilter: '뷰티 필터',
          communityBadge: '커뮤니티 뱃지',
          adRemoval: '광고 제거',
          simultaneousInterpretation: '동시통역 기능'
        },
        featureDescriptions: {
          beautyFilter: 'AI 화상 채팅 시 실시간 얼굴 보정으로 더 아름다운 모습으로 대화하세요',
          communityBadge: '프리미엄 멤버 표시로 특별한 지위를 나타내세요',
          adRemoval: '앱 내 배너와 팝업 광고 없이 깔끔한 환경에서 이용하세요',
          simultaneousInterpretation: '자막/음성 지원으로 기본 번역보다 빠르고 자연스러운 소통'
        },
        details: '상세',
        warning: 'VIP 구독만으로는 통화 불가 - 반드시 쿠폰 구매 필요'
      }
    },

    // AI 화상 채팅
    videoCall: {
      title: 'AI 화상 채팅',
      subtitle: '한국과 남미를 잇는 실시간 AI 화상 채팅',
      description: '언어 교환 파트너와 함께 한국어와 스페인어를 배워보세요!',
      quickStart: '빠른 시작',
      quickStartDescription: '언어 교환 파트너와 바로 연결하세요',
      startCall: '통화 시작',
      startConversation: '대화 시작',
      offline: '오프라인',
      oneOnOne: '1:1 AI 화상 채팅',
      oneOnOneDescription: '개인 맞춤 대화',
      languageExchange: '언어 교환',
      languageExchangeDescription: '한국어 ↔ 스페인어',
      sessionTime: '20분 세션',
      sessionTimeDescription: '효율적인 학습',
      enterChannelName: '채널명을 입력해주세요.',
      loading: 'AI 화상 채팅 로딩 중...',
      callLoading: 'AI 화상 채팅 로딩 중...',
      onlyKoreans: '한국인만 보기',
      viewInfo: '정보보기',
      partners: '파트너 목록',
      noPartners: '현재 사용 가능한 파트너가 없습니다.',
      profile: '프로필 정보',
      close: '닫기',
      channelName: '채널명',
      channelShareTip: '채널명을 상대방과 공유하여 같은 방에 입장할 수 있습니다.',
      noPartnersTitle: '파트너가 없습니다',
      noPartnersDescription: '현재 등록된 파트너가 없습니다. 곧 새로운 파트너들이 추가될 예정입니다.'
    }
  },
  
  es: {
    // 헤더
    mainPage: {
      title: 'Disfruta de diversas formas',
      videoCall: 'Videollamada',
      videoCallDescription: 'Participa en el registro de asistencia y habla con el coreano que quieras usando AKO.',
      community: 'Comunidad',
      communityDescription: 'Comunícate entre ustedes a través de la comunidad.',
      openEvent: 'Evento de apertura',
      openEventDescription: '¡Si te registras hasta noviembre, recibirás 3 AKO!',
      openEventNote: '*Para más detalles, consulta la página del evento',
      cbtBadge: 'Apertura programada para octubre',
      cbtText: 'Apertura programada para octubre',
      eventBadge: 'EVENTO',
      chargingStation: 'Estación de carga',
      chargingStationDescription: 'Compra cupones AKO y funciones VIP',
      myPoints: 'Mis puntos',
      totalPoints: 'Puntos totales',
      attendancePoints: 'Registro de asistencia',
      communityPoints: 'Comunidad',
      videoCallPoints: 'AKO',
      points: 'puntos',
      akoExplanation: '1 AKO = 1 videollamada (20 min)'
    },
    landingPage: 'Página de Inicio',
    start: 'Comenzar',
    lounge: 'Sala',
    
    // 언어
    korean: '한국어',
    spanish: 'Español',
    changeToSpanish: 'Cambiar a Español',
    changeToKorean: '한국어로 변경',
    
    // 공통 버튼
    buttons: {
      upload: 'Subir',
      register: 'Registrar',
      write: 'Escribir',
      delete: 'Eliminar',
      confirm: 'Confirmar',
      cancel: 'Cancelar',
      save: 'Guardar',
      edit: 'Editar',
      submit: 'Enviar',
      loading: 'Cargando...',
      uploading: 'Subiendo...',
      saving: 'Guardando...',
      writing: 'Escribiendo...',
      deleting: 'Eliminando...'
    },
    
    // 인증 관련
    auth: {
      forgotPassword: 'Recuperar contraseña',
      signUp: 'Registrarse',
      signIn: 'Iniciar sesión',
      signUpDescription: '¡Únete a la plataforma de intercambio cultural coreana y comienza una nueva experiencia!',
      name: 'Nombre',
      namePlaceholder: 'Ingresa tu nombre',
      email: 'Email',
      password: 'Contraseña',
      passwordPlaceholder: 'Ingresa tu contraseña',
      passwordMinLength: 'Mínimo 8 caracteres',
      passwordHasNumber: 'Incluir números',
      passwordHasSpecial: 'Incluir caracteres especiales',
      passwordNoRepeated: 'Sin caracteres repetidos',
      confirmPassword: 'Confirmar contraseña',
      confirmPasswordPlaceholder: 'Ingresa tu contraseña nuevamente',
      passwordMismatch: 'Las contraseñas no coinciden',
      phone: 'Teléfono',
      countryCode: 'Código de país',
      country: 'País',
      selectCountry: 'Selecciona tu país',
      signingUp: 'Registrando...',
      alreadyHaveAccount: '¿Ya tienes una cuenta?',
      signUpSuccess: '¡Registro completado! Ya puedes iniciar sesión.',
      signUpFailed: 'El registro falló.',
      signUpError: 'Ocurrió un error durante el registro.',
      signInDescription: '¡Inicia sesión en tu cuenta y comienza el intercambio cultural coreano!',
      emailOrPhone: 'Email o teléfono',
      emailOrPhonePlaceholder: 'example@email.com o +82-10-1234-5678',
      signingIn: 'Iniciando sesión...',
      noAccount: '¿No tienes una cuenta?',
      signInFailed: 'El inicio de sesión falló.',
      sessionUpdateFailed: 'Falló la actualización de la sesión.',
      signInError: 'Ocurrió un error durante el inicio de sesión.',
      credentialsCheckMessage: 'Por favor, verifica nuevamente tu email o contraseña.\n\n• Verifica que la dirección de email sea correcta\n• Verifica que la contraseña sea correcta\n• Verifica la distinción entre mayúsculas y minúsculas'
    },
    
    // 인증 페이지 관련
    verification: {
      loginRequired: 'Inicio de sesión requerido',
      loginRequiredDescription: 'Por favor, inicia sesión primero para la verificación.',
      title: 'Verificación de usuario',
      subtitle: 'Por favor, ingresa la información de verificación para usar el servicio de consulta',
      infoCollectionGuide: '📋 Guía de recolección de información',
      infoCollectionDescription: 'Esta recolección de información es un proceso de verificación para emparejamiento rápido y seguridad.',
      publicInfo: 'Información pública',
      name: 'Nombre',
      major: 'Especialidad (para estudiantes universitarios)',
      languageLevel: 'Nivel de idioma',
      interests: 'Áreas de interés',
      introduction: 'Autopresentación',
      publicInfoDescription: 'Esta es la información básica del perfil que otros usuarios pueden ver.',
      privateInfo: 'Información privada',
      phone: 'Teléfono',
      university: 'Nombre de la universidad',
      studentId: 'Número de estudiante',
      occupation: 'Ocupación/Nombre de la empresa',
      experience: 'Experiencia laboral',
      availableTime: 'Tiempo disponible',
      privateInfoDescription: 'Se usa solo para verificación interna para la seguridad de los usuarios.',
      basicInfoStep: 'Ingreso de información básica',
      matchingStep: 'Selección de método de emparejamiento',
      basicInfoDescription: 'Por favor, ingresa tu información básica y áreas de interés.',
      matchingDescription: 'Por favor, selecciona el método de emparejamiento que prefieras.',
      userType: 'Tipo de usuario',
      student: 'Estudiante universitario',
      studentDescription: 'Estudiante actualmente matriculado en la universidad',
      general: 'Persona general',
      generalDescription: 'Empleado, trabajador independiente, otros',
      nationality: 'Nacionalidad',
      korean: 'Coreano',
      koreanDescription: 'Ciudadano coreano',
      nonKorean: 'No coreano',
      nonKoreanDescription: 'Ciudadano extranjero',
      profilePhoto: 'Foto de perfil',
      profilePreview: 'Vista previa del perfil',
      selectPhoto: 'Seleccionar foto',
      photoRequirements: 'Solo archivos JPG, PNG (máximo 5MB)',
      namePlaceholder: 'Por favor, ingresa tu nombre real',
      phonePlaceholder: '010-1234-5678',
      universityPlaceholder: 'Universidad Nacional de Seúl',
      majorPlaceholder: 'Departamento de Educación en Coreano',
      grade: 'Año',
      gradePlaceholder: 'Selecciona tu año'
    },
    
    // MyTab 컴포넌트 관련
    myTab: {
      fileSizeLimit: '파일 크기는 5MB 이하여야 합니다',
      imageOnly: '이미지 파일만 업로드 가능합니다',
      profileSaved: '프로필이 저장되었습니다!',
      profileSaveFailed: '프로필 저장에 실패했습니다',
      unknownError: '알 수 없는 오류',
      profileSaveError: '프로필 저장 중 오류가 발생했습니다',
      profileLoadFailed: '프로필 정보를 불러올 수 없습니다',
      korean: '한국인',
      local: '현지인',
      student: '학생',
      professional: '직장인',
      verified: '인증됨',
      noName: '이름 없음',
      universityPlaceholder: '대학교명을 입력하세요',
      noUniversity: '대학교 정보 없음',
      majorPlaceholder: '전공을 입력하세요',
      noMajor: '전공 정보 없음',
      occupation: '직업',
      occupationPlaceholder: '직업을 입력하세요',
      noOccupation: '직업 정보 없음',
      company: '회사명',
      companyPlaceholder: '회사명을 입력하세요',
      noCompany: '회사 정보 없음',
      gradePlaceholder: '학년을 선택하세요',
      grade1: '1학년',
      grade2: '2학년',
      grade3: '3학년',
      grade4: '4학년',
      graduate: '대학원',
      noGrade: '학년 정보 없음',
      experience: '경력',
      experiencePlaceholder: '경력을 입력하세요 (예: 3년차)',
      noExperience: '경력 정보 없음',
      introductionPlaceholder: '자기소개를 입력하세요',
      noIntroduction: '자기소개가 없습니다',
      uploadedPhotos: '업로드된 사진들 (클릭하여 대표 사진 설정)',
      profilePhoto: '프로필 사진',
      noInterests: '설정된 관심사가 없습니다',
      photoSelectionTip: '여러 사진을 선택하고 대표 사진을 설정하세요',
      consultation15min2: '15분 상담 쿠폰 2장',
      completed: '완료',
      pending: '대기중',
      cancelled: '취소됨',
      notificationSettings: '알림 설정',
      webPushNotification: '웹 푸시 알림',
      webPushDescription: '브라우저에서 알림을 받습니다',
      emailNotification: '이메일 알림',
      emailDescription: '이메일로 알림을 받습니다',
      marketingNotification: '마케팅 알림',
      marketingDescription: '이벤트 및 프로모션 정보를 받습니다'
    },
    
    // MyTab 컴포넌트 관련 (스페인어)
    myTab: {
      fileSizeLimit: 'El tamaño del archivo debe ser menor a 5MB',
      imageOnly: 'Solo se pueden subir archivos de imagen',
      profileSaved: '¡Perfil guardado!',
      profileSaveFailed: 'Error al guardar el perfil',
      unknownError: 'Error desconocido',
      profileSaveError: 'Ocurrió un error al guardar el perfil',
      profileLoadFailed: 'No se puede cargar la información del perfil',
      korean: 'Coreano',
      local: 'Local',
      student: 'Estudiante',
      professional: 'Profesional',
      verified: 'Verificado',
      noName: 'Sin nombre',
      universityPlaceholder: 'Ingresa el nombre de la universidad',
      noUniversity: 'Sin información universitaria',
      majorPlaceholder: 'Ingresa tu especialidad',
      noMajor: 'Sin información de especialidad',
      occupation: 'Ocupación',
      occupationPlaceholder: 'Ingresa tu ocupación',
      noOccupation: 'Sin información de ocupación',
      company: 'Empresa',
      companyPlaceholder: 'Ingresa el nombre de la empresa',
      noCompany: 'Sin información de empresa',
      gradePlaceholder: 'Selecciona tu año',
      grade1: '1er año',
      grade2: '2do año',
      grade3: '3er año',
      grade4: '4to año',
      graduate: 'Posgrado',
      noGrade: 'Sin información de año',
      experience: 'Experiencia',
      experiencePlaceholder: 'Ingresa tu experiencia (ej: 3 años)',
      noExperience: 'Sin información de experiencia',
      introductionPlaceholder: 'Ingresa tu presentación personal',
      noIntroduction: 'Sin presentación personal',
      uploadedPhotos: 'Fotos subidas (haz clic para establecer como foto principal)',
      profilePhoto: 'Foto de perfil',
      noInterests: 'No hay intereses configurados',
      photoSelectionTip: 'Selecciona varias fotos y establece una como principal',
      consultation15min2: 'Cupones de consulta de 15 minutos (2)',
      completed: 'Completado',
      pending: 'Pendiente',
      cancelled: 'Cancelado',
      notificationSettings: 'Configuración de notificaciones',
      webPushNotification: 'Notificaciones push web',
      webPushDescription: 'Recibe notificaciones en el navegador',
      emailNotification: 'Notificaciones por email',
      emailDescription: 'Recibe notificaciones por email',
      marketingNotification: 'Notificaciones de marketing',
      marketingDescription: 'Recibe información sobre eventos y promociones'
    },
    
    // HomeTab 컴포넌트 관련
    homeTab: {
      openingOctober: '10월 오픈 예정',
      community: '커뮤니티'
    },
    
    // HomeTab 컴포넌트 관련 (스페인어)
    homeTab: {
      openingOctober: 'Apertura en octubre',
      community: 'Comunidad'
    },
    
    // About 페이지 관련
    about: {
      title: '회사소개',
      subtitle: 'Amiko와 함께하는 한국 문화 교류의 여정',
      companyName: 'Amiko',
      companyDescription: 'Amigo(친구) + Korea',
      bridgeDescription: '이어주는 다리',
      closerDescription: 'A mí(나에게) Korea를 더 가깝게',
      mission: '미션',
      missionDescription: '한국 문화를 사랑하는 전 세계 사람들을 연결하여 의미 있는 교류를 만들어갑니다',
      vision: '비전',
      visionDescription: '언어와 문화의 장벽을 넘어 진정한 글로벌 커뮤니티를 구축합니다',
      values: '핵심 가치',
      valuesList: {
        connection: '연결',
        culture: '문화',
        community: '커뮤니티',
        communication: '소통'
      },
      introVideo: '대표자 소개영상',
      introVideoTitle: 'Amiko 대표자 소개 영상',
      greeting: '안녕하세요.',
      thankYou: 'Amiko를 찾아주셔서 감사합니다.',
      teamIntroduction: 'Amiko의 CTO 한상훈(Samuel), CMO 박겸(Pablo)입니다.',
      latinAmericaExperience: '저희는 여러 남미 국가에서 살며 그들의 문화와 사람들을 진심으로 사랑하게 되었습니다.',
      koreanInterest: '최근 한국의 다양한 매체를 통해 남미의 아름다움이 소개되면서, 많은 한국인들이 점차 지구 반대편의 매력적인 대륙에 대해 알아가고 있습니다.',
      culturalExchange: '이러한 경험을 통해 한국과 남미를 더욱 가깝게 연결할 수 있는 문화 교류와 커뮤니티의 필요성을 깊이 느끼게 되었습니다.',
      bridgePromise: '그래서 다짐했습니다. 한국과 남미를 이어주는 다리를 만들자.',
      platformDescription: 'Amiko는 화상 통화와 커뮤니티 서비스를 기반으로, 철저히 검증된 멤버십을 통해 신뢰할 수 있는 플랫폼을 제공합니다.',
      communityVision: '단순한 소통을 넘어 한국의 트렌드, 패션, K-POP, 라이프스타일까지 공유할 수 있는 커뮤니티로 발전해 나가겠습니다.',
      finalMessage: 'Amiko를 통해 서로에게 가까이 다가가보세요.'
    },
    
    // About 페이지 관련 (스페인어)
    about: {
      title: 'Acerca de la Empresa',
      subtitle: 'El viaje del intercambio cultural coreano con Amiko',
      companyName: 'Amiko',
      companyDescription: 'Amigo(친구) + Korea',
      bridgeDescription: 'Un puente que conecta entre AMerica y KOrea',
      closerDescription: 'Más cerca Korea a mí',
      mission: 'Misión',
      missionDescription: 'Conectamos a personas de todo el mundo que aman la cultura coreana para crear intercambios significativos',
      vision: 'Visión',
      visionDescription: 'Construimos una verdadera comunidad global superando las barreras del idioma y la cultura',
      values: 'Valores fundamentales',
      valuesList: {
        connection: 'Conexión',
        culture: 'Cultura',
        community: 'Comunidad',
        communication: 'Comunicación'
      },
      introVideo: 'Video de presentación del CEO',
      introVideoTitle: 'Video de presentación del CEO de Amiko',
      greeting: 'Hola.',
      thankYou: 'Gracias por visitar Amiko.',
      teamIntroduction: 'Somos Samuel (CTO) y Pablo (CMO) de Amiko.',
      latinAmericaExperience: 'Hemos vivido en varios países de América Latina y nos enamoramos sinceramente de su cultura y su gente.',
      koreanInterest: 'Recientemente, a través de varios medios coreanos, se ha introducido la belleza de América Latina, y muchos coreanos están aprendiendo gradualmente sobre el atractivo continente al otro lado del mundo.',
      culturalExchange: 'A través de estas experiencias, sentimos profundamente la necesidad de intercambio cultural y comunidad que pueda conectar más estrechamente Corea y América Latina.',
      bridgePromise: 'Por eso nos comprometimos. Hagamos un puente que conecte Corea y América Latina.',
      platformDescription: 'Amiko proporciona una plataforma confiable basada en servicios de videollamadas y comunidad, a través de membresías completamente verificadas.',
      communityVision: 'Más allá de la simple comunicación, desarrollaremos una comunidad donde se puedan compartir las tendencias, moda, K-POP y estilo de vida de Corea.',
      finalMessage: 'Acérquense unos a otros a través de Amiko.'
    },
    
    // Inquiry 페이지 관련
    inquiry: {
      loginRequired: '로그인이 필요합니다.',
      submitFailed: '문의 제출에 실패했습니다.',
      submitError: '문의 제출 중 오류가 발생했습니다.',
      goToCommunity: '커뮤니티로 이동',
      selectInquiryType: '문의 유형을 선택해주세요',
      selectPriority: '우선순위를 선택해주세요',
      subjectPlaceholder: '문의 제목을 입력해주세요',
      messagePlaceholder: '문의 내용을 자세히 입력해주세요',
      submitSuccessMessage: '문의가 성공적으로 제출되었습니다. 빠른 시일 내에 답변드리겠습니다.',
      submitting: '제출 중...',
      submitInquiry: '문의 제출'
    },
    
    // Inquiry 페이지 관련 (스페인어)
    inquiry: {
      loginRequired: 'Se requiere inicio de sesión.',
      submitFailed: 'Error al enviar la consulta.',
      submitError: 'Ocurrió un error al enviar la consulta.',
      goToCommunity: 'Ir a la comunidad',
      selectInquiryType: 'Selecciona el tipo de consulta',
      selectPriority: 'Selecciona la prioridad',
      subjectPlaceholder: 'Ingresa el asunto de la consulta',
      messagePlaceholder: 'Ingresa el contenido de la consulta en detalle',
      submitSuccessMessage: 'La consulta se envió exitosamente. Te responderemos pronto.',
      submitting: 'Enviando...',
      submitInquiry: 'Enviar consulta'
    },
    
    // Partnership 페이지 관련
    partnership: {
      submitError: '제휴 문의 제출 중 오류가 발생했습니다.',
      networkError: '네트워크 오류가 발생했습니다. 다시 시도해주세요.',
      partnershipInquiry: '제휴 문의',
      companyInfo: '회사 정보',
      companyName: '회사명',
      companyNamePlaceholder: '회사명을 입력해주세요'
    },
    
    // Partnership 페이지 관련 (스페인어)
    partnership: {
      submitError: 'Ocurrió un error al enviar la consulta de asociación.',
      networkError: 'Ocurrió un error de red. Por favor, inténtalo de nuevo.',
      partnershipInquiry: 'Consulta de asociación',
      companyInfo: 'Información de la empresa',
      companyName: 'Nombre de la empresa',
      companyNamePlaceholder: 'Ingresa el nombre de la empresa'
    },
    
    // Forgot Password 페이지 관련
    forgotPassword: {
      requestFailed: '비밀번호 재설정 요청에 실패했습니다.',
      resetError: '비밀번호 재설정 중 오류가 발생했습니다.',
      checkEmail: '이메일을 확인하세요',
      emailSent: '비밀번호 재설정 링크를 {email}로 보내드렸습니다.',
      checkSpam: '이메일을 받지 못하셨나요? 스팸 폴더를 확인해보세요.',
      tryAgain: '다른 이메일로 다시 시도',
      backToLogin: '로그인 페이지로 돌아가기',
      title: '비밀번호 찾기',
      description: '가입하신 이메일 주소를 입력하시면\n비밀번호 재설정 링크를 보내드립니다.',
      emailAddress: '이메일 주소',
      sending: '전송 중...',
      sendResetLink: '비밀번호 재설정 링크 보내기',
      rememberAccount: '계정이 기억나셨나요?',
      login: '로그인하기'
    },
    
    // Forgot Password 페이지 관련 (스페인어)
    forgotPassword: {
      requestFailed: 'Error al solicitar restablecimiento de contraseña.',
      resetError: 'Ocurrió un error al restablecer la contraseña.',
      checkEmail: 'Revisa tu email',
      emailSent: 'Hemos enviado un enlace de restablecimiento de contraseña a {email}.',
      checkSpam: '¿No recibiste el email? Revisa tu carpeta de spam.',
      tryAgain: 'Intentar con otro email',
      backToLogin: 'Volver a la página de inicio de sesión',
      title: 'Recuperar contraseña',
      description: 'Ingresa tu dirección de email registrada\npara enviarte un enlace de restablecimiento de contraseña.',
      emailAddress: 'Dirección de email',
      sending: 'Enviando...',
      sendResetLink: 'Enviar enlace de restablecimiento',
      rememberAccount: '¿Recordaste tu cuenta?',
      login: 'Iniciar sesión'
    },
    
    // FAQ 페이지 관련
    faq: {
      title: 'Preguntas Frecuentes',
      subtitle: 'Hemos recopilado preguntas curiosas sobre el servicio Amiko',
      totalQuestions: 'Total de {count} preguntas',
      moreQuestions: '¿Tienes más preguntas?',
      moreQuestionsDescription: 'Si no encuentras la respuesta en las FAQ, contáctanos en cualquier momento',
      emailInquiry: 'Consulta por email',
      customerService: 'Servicio al cliente',
      categories: {
        lounge: 'Sala ZEP',
        meeting: 'Encuentros (Video)',
        community: 'Comunidad',
        account: 'Cuenta y Verificación'
      },
      lounge: {
        whatDoWeDo: '¿Qué hacemos en la Sala ZEP?',
        whatDoWeDoAnswer: 'Puedes realizar diversas actividades como conversaciones libres sobre cultura coreana, experiencias culturales, eventos especiales, etc. Pasamos tiempo agradable con los operadores todos los sábados por la noche.',
        pointsAvailable: '¿También puedo recibir puntos?',
        pointsAvailableAnswer: '¡Sí! Puedes recibir puntos al participar en la sala, y se proporcionan puntos adicionales al participar en eventos especiales. También hay beneficios especiales para participantes regulares.',
        whenOpen: '¿Cuándo está abierta?',
        whenOpenAnswer: 'Se abre regularmente todos los sábados por la noche a las 8 PM (KST). Los eventos especiales se anuncian por separado y puedes participar libremente en el día que desees.',
        differentLanguages: '¿Puedo participar aunque el idioma sea diferente?',
        differentLanguagesAnswer: '¡Sí! Puedes comunicarte en varios idiomas como coreano, inglés, español, portugués, etc. Puedes disfrutar de la cultura coreana sin barreras idiomáticas.'
      },
      meeting: {
        howToMeet: '¿Cómo puedo conocer amigos coreanos?',
        howToMeetAnswer: 'Puedes seleccionar amigos coreanos en la app y reservar un encuentro de video gratuito de 15 minutos. Si activas el modo de traducción, puedes conversar sin barreras idiomáticas.',
        translationMode: '¿Qué es el modo de traducción?',
        translationModeAnswer: 'Cuando activas el modo de traducción, traduce el coreano en tiempo real. Si lo desactivas, puedes recibir puntos de bonificación. Debe completarse la verificación de identidad para usar esta función.',
        howToUseCoupons: '¿Cómo uso los cupones?',
        howToUseCouponsAnswer: 'Puedes comprar y usar cupones de encuentro de 15 minutos. Puedes comprarlos en paquetes de 1, 2 o 3 cupones, y también puedes comprarlos con puntos.'
      },
      community: {
        howToGetPoints: '¿Cómo obtengo puntos?',
        howToGetPointsAnswer: 'Puedes recibir +3 puntos al escribir preguntas y +3 puntos al escribir respuestas. Los coreanos reciben más puntos, y puedes recibir puntos adicionales cuando recibes adopción o me gusta.',
        dailyPointLimit: '¿Hay un límite diario de puntos?',
        dailyPointLimitAnswer: 'Sí, hay un límite diario de obtención de puntos para prevenir spam. Se aplican diferentes límites para usuarios coreanos y latinos.',
        communityRules: '¿Hay reglas de la comunidad?',
        communityRulesAnswer: 'Por favor, participa en un ambiente amigable y respetuoso. El contenido inapropiado o spam puede resultar en sanciones, y se aplica un tiempo de espera.'
      },
      account: {
        whyVerificationNeeded: '¿Por qué es necesaria la verificación de identidad?',
        whyVerificationNeededAnswer: 'Es necesaria para un servicio seguro y confiable. Una vez completada la verificación, puedes usar emparejamiento de video, usar cupones y participar en actividades de la comunidad.',
        verificationMethods: '¿Qué métodos de verificación hay?',
        verificationMethodsAnswer: 'Los coreanos pueden elegir vinculación con Kakao y verificación SMS, y los usuarios de otros países pueden elegir verificación por WhatsApp, SMS o email.',
        verificationFailed: '¿Qué hago si la verificación falla?',
        verificationFailedAnswer: 'Puedes probar usando el código de verificación 123456. Si el problema persiste, contacta al servicio al cliente.'
      }
    },
    
    // 메뉴
    community: 'Comunidad',
    profileMenu: 'Perfil',
    settings: 'Configuración',
    
    // 달력
    calendar: {
      schedule: 'Horario',
      scheduleTitle: 'Horario de Agosto',
      scheduleSubtitle: 'Revisa el horario de la sala ZEP de este mes y selecciona la fecha que desees',
      detailedInfo: 'Información Detallada',
      detailedInfoTitle: '30 de Agosto (Sáb) Información Detallada',
      detailedInfoSubtitle: '¡Revisa el horario de la sala ZEP de este día y participa!',
      months: {
        january: 'Enero',
        february: 'Febrero',
        march: 'Marzo',
        april: 'Abril',
        may: 'Mayo',
        june: 'Junio',
        july: 'Julio',
        august: 'Agosto',
        september: 'Septiembre',
        october: 'Octubre',
        november: 'Noviembre',
        december: 'Diciembre'
      },
      days: {
        sun: 'Dom',
        mon: 'Lun',
        tue: 'Mar',
        wed: 'Mié',
        thu: 'Jue',
        fri: 'Vie',
        sat: 'Sáb'
      }
    },
    
    // 영상통화
    videoCall: {
      title: 'AI Videollamada',
      subtitle: 'AI Videollamada en tiempo real conectando Corea y América Latina',
      description: '¡Aprende coreano y español con un compañero de intercambio de idiomas!',
      quickStart: 'Inicio rápido',
      quickStartDescription: 'Conecta directamente con un compañero de intercambio de idiomas',
      startCall: 'Iniciar llamada',
      startConversation: 'Iniciar conversación',
      offline: 'Desconectado',
      oneOnOne: 'AI Videollamada 1:1',
      oneOnOneDescription: 'Conversación personalizada',
      languageExchange: 'Intercambio de idiomas',
      languageExchangeDescription: 'Coreano ↔ Español',
      sessionTime: 'Sesión de 20 min',
      sessionTimeDescription: 'Aprendizaje eficiente',
      enterChannelName: 'Por favor ingresa el nombre del canal.',
      loading: 'Cargando AI videollamada...',
      callLoading: 'Cargando AI videollamada...',
      onlyKoreans: 'Solo coreanos',
      viewInfo: 'Ver información',
      partners: 'Lista de compañeros',
      noPartners: 'No hay compañeros disponibles actualmente.',
      profile: 'Información del perfil',
      close: 'Cerrar',
      channelName: 'Nombre del canal',
      channelShareTip: 'Comparte el nombre del canal con tu compañero para entrar a la misma sala.',
      noPartnersTitle: 'No hay compañeros',
      noPartnersDescription: 'Actualmente no hay compañeros registrados. Pronto se agregarán nuevos compañeros.',
      participants: 'Participantes',
      me: 'Yo (Local)',
      opponent: 'Oponente',
      muted: 'Silenciado',
      unmuted: 'Desilenciar',
      cameraOff: 'Cámara apagada',
      cameraOn: 'Encender cámara',
      endCall: 'Terminar llamada',
      waitingForOpponent: 'Esperando al oponente...',
      waitingMessage: 'Se conectará automáticamente cuando otro usuario se una al mismo canal',
      connecting: 'Conectando...',
      cameraOffMessage: 'La cámara está apagada',
      cameraOffSubtitle: 'Enciende la cámara para comunicarte con el oponente'
    },


    
    // 랜딩페이지
    landing: {
      platform: 'Aprende cultura coreana y haz nuevos amigos',
      loveKorean: 'Para ti que amas Corea',
      globalSpace: 'Espacio de comunicación global',
      introVideo: 'Video de introducción',
      clickToWatch: 'Haz clic para ver',
      start: 'Comenzar ahora',
      signupMessage: 'Regístrate y conoce nuevos amigos'
    },

    
    // 랜딩페이지 슬라이드
    heroSlides: {
      slide1: {
        badge: 'Con Amiko',
        title: 'Experimenta\nGlobal Community',
        description: 'Espacio de comunicación global para ti que amas Corea y América Latina',
        subtitle: 'Experiencia especial\ncon usuarios de todo el mundo',
        features: {
          curriculum: 'Comunidad global donde puedes aprender diversas culturas e idiomas',
          education: 'Experiencia vívida de intercambio cultural a través de comunicación en tiempo real',
          experience: 'Viaje de aprendizaje especial con amigos de todo el mundo'
        }
      },
      slide2: {
        badge: 'Con traducción AI integrada en Amiko',
        title: 'Comunícate por video',
        description: 'A través de nuestro sistema de videollamadas 1:1 y servicio de traducción AI,\npuedes intercambiar culturas e idiomas sin barreras, de manera simple y conveniente.',
        subtitle: 'Tutores coreanos verificados\nestán contigo.',
        experience1: '¿Has tenido experiencia usando aplicaciones de videollamadas con IA para conocer personas con buenas imágenes de sus países?',
        experience2: '¿Acaso esa experiencia no te llegó como una decepción?',
        experience3: 'Amiko te ofrece una buena experiencia a través de tutores coreanos verificados y un sistema de calificaciones.',
        features: {
          curriculum: 'Currículo personalizado para extranjeros que quieren aprender coreano',
          education: 'Sistema educativo sistemático que aprende cultura e idioma coreano juntos',
          experience: 'Experiencia de aprendizaje de coreano vívida a través de videollamadas en tiempo real'
        }
      },
      slide3: {
        subtitle: 'Comunícate con el otro lado del mundo.',
        title: 'Servicio de Comunidad Amiko',
        description: 'Amiko es un puente que conecta el otro lado del mundo. Acércate más a las culturas mutuas a través de la comunidad.',
        cards: {
          topicBoard: {
            title: 'Foro por Temas',
            description: 'Comunícate libremente sobre diversos temas como K-POP, K-DRAMA, K-Beauty, tendencias, viajes, etc.'
          },
          freeBoard: {
            title: 'Foro Libre',
            description: 'Comunícate libremente con el otro lado del mundo sobre temas libres.'
          },
          story: {
            title: 'Historia',
            description: 'Comparte tu vida diaria y conversa sobre la vida cotidiana.'
          },
          qna: {
            title: 'P&R',
            description: 'Haz preguntas sobre lo que te interesa mutuamente a través de la comunidad P&R y recibe respuestas directamente.'
          }
        },
        ktrend: {
          title: 'K-Trend',
          description: 'Experimenta K-Trend preciso y rápido transmitido directamente por coreanos en Amiko.'
        },
        freeboard: {
          title: 'Foro Libre',
          description: 'Experimenta comunicación libre a través de foros de K-POP, K-DRAMA, viajes y foros libres.'
        },
        qna: {
          title: 'P&R',
          description: 'Haz preguntas sobre lo que te interesa mutuamente a través de la comunidad P&R y recibe respuestas directamente de locales.'
        }
      }
    },
    
    hero: {
      title: 'Aprende cultura coreana y\nhaz nuevos amigos',
      subtitle: 'Experimenta la cultura coreana sin barreras lingüísticas y comunícate con personas de todo el mundo',
      cta: 'Comenzar Ahora',
      video: 'Ver Video de Introducción'
    },
    
    // 특별 서비스
    specialService: {
      title: 'Servicios Especiales',
      heading: 'Experimenta los servicios especiales únicos de Amiko',
      description: 'Servicios personalizados para el intercambio cultural coreano que proporcionan una experiencia más rica'
    },
    
    // 기능 카드들
    features: {
      meeting: {
        title: 'Comunicación por Video (Video llamada)',
        description: 'Puedes comenzar fácilmente con una consulta gratuita de 15 minutos con un amigo coreano',
        videoSupport: 'Soporte de consulta por video',
        verifiedFriends: 'Amigos coreanos verificados',
        button: 'Obtener cupón'
      },
      loungePage: {
        title: 'Sala ZEP',
        description: 'Experimenta tiempo para conocerse mutuamente con un operador una vez por fin de semana',
        maxParticipants: 'Máximo 30 participantes',
        freeTime: 'Tiempo de comunicación libre',
        button: 'Guía de la sala'
      }
    },
    
    // 라운지 페이지 (스페인어)
    loungePage: {
      title: 'Sala ZEP de Fin de Semana',
      subtitle: '¡Tiempo divertido de charla sobre cultura coreana con el operador!',
      description: 'Te esperamos todos los sábados por la noche',
      time: 'Todos los sábados 20:00 (KST)',
      maxParticipants: 'Máx. 30 participantes',
      nextSession: 'Próxima Sesión',
      saturday: 'Sábado',
      specialTime: 'Tiempo especial con el operador',
      specialDescription: 'Conversación libre y tiempo de Q&A sobre cultura coreana',
      enterZep: 'Entrar a ZEP',
      specialEvent: '🎯 Tiempo especial con el operador todos los sábados por la noche',
      schedule: 'Horario',
      scheduleDescription: 'Revisa el horario de la sala ZEP de este mes y selecciona la fecha que desees',
      selectedDateInfo: 'Información Detallada',
      selectedDateDescription: '¡Revisa el horario de la sala ZEP de este día y participa!',
      activities: 'Qué hacemos en la sala',
      freeConversation: 'Conversación libre',
      freeConversationDescription: 'Conversamos sobre diversos temas como cultura coreana, viajes, comida, etc.',
      culturalExperience: 'Experiencia cultural',
      culturalExperienceDescription: 'Puedes experimentar la cultura tradicional y moderna de Corea',
      specialEvents: 'Eventos especiales',
      specialEventsDescription: 'Proporcionamos eventos especiales y regalos regularmente',
      ctaTitle: '¡Participa en la sala ZEP ahora mismo!',
      ctaDescription: 'Tiempo especial para aprender cultura coreana y hacer nuevos amigos',
      ctaInstruction: '🎈 Haz clic en el botón "Entrar a ZEP" de arriba para participar en la sala',
      timezone: {
        myTime: 'Mi hora'
      },
      filters: {
        topic: 'Tema',
        language: 'Idioma',
        level: 'Nivel',
        price: 'Gratis/Pago',
        reset: 'Restablecer',
        topics: {
          freeTalk: 'Charla libre',
          kCulture: 'Cultura coreana',
          travel: 'Viajes',
          food: 'Comida'
        },
        languages: {
          korean: 'Coreano',
          spanish: 'Español',
          english: 'Inglés'
        },
        levels: {
          beginner: 'Principiante',
          intermediate: 'Intermedio',
          advanced: 'Avanzado'
        },
        priceOptions: {
          all: 'Todos',
          free: 'Gratis',
          paid: 'Pago'
        }
      },
      sessions: {
        upcoming: 'Próximas sesiones',
        seatsLeft: 'Plazas',
        startsAt: 'Inicio',
        joinNow: 'Entrar'
      },
      highlights: {
        title: 'Historias destacadas',
        subtitle: 'Mejores momentos de participantes anteriores'
      },
      guide: {
        title: 'Guía y Preguntas Frecuentes',
        etiquette: {
          title: 'Etiqueta',
          content: 'Conversa con respeto y consideración. Prohibido insultos, discriminación y spam.'
        },
        verification: {
          title: 'Verificación',
          content: 'Para un espacio seguro y confiable, recomendamos una verificación simple.'
        },
        points: {
          title: 'Puntos',
          content: 'Puedes ganar puntos por participar y contribuir; canjeables por beneficios más adelante.'
        }
      },
      mobileCta: {
        todayStart: 'Hoy comienza a las {{time}}',
        enterNow: 'Entrar'
      }
    },
    
    // 메인페이지
    main: {
      meet: 'Comunicación por Video',
      community: 'Comunidad',
      me: 'Mi Perfil',
      meetDescription: 'Aprende cultura coreana con amigos coreanos a través de consultas por video',
      communityDescription: 'Haz preguntas, responde y acumula puntos para recibir beneficios especiales',
      meDescription: 'Gestiona tu perfil, puntos, cupones y otra información personal',
      weekendLounge: 'Sala de fin de semana',
      time: 'Hora',
      maxParticipants: 'Máx. 30 personas',
      viewCalendar: 'Ver calendario'
    },
    
    // 만남 탭
    meetTab: {
      verificationRequired: 'Verificación de identidad requerida',
      verificationDescription: 'Para usar el emparejamiento por video, se requiere verificación de identidad. ¡Por favor, proceda con la verificación!',
      verificationBenefits: 'Después de la verificación, podrá usar todas las funciones de Amiko.',
      verifyNow: 'Verificar ahora',
      searchFriends: 'Buscar amigos',
      all: 'Todos',
      byActivityScore: 'Por puntuación',
      byName: 'Por nombre',
      selectCoupon: 'Seleccionar cupón',
      quickMatch: 'Emparejamiento rápido',
      unverified: 'No verificado',
      bookConsultation: 'Reservar consulta',
      viewProfile: 'Ver perfil',
      customizedMatching: 'Emparejamiento personalizado',
      customizedDescription: 'Emparejamiento personalizado considerando intereses, nivel de idioma y tiempo disponible',
      videoSupport: 'Soporte de video',
      // 쿠폰 옵션들
      freeCoupon: 'Cupón gratuito nuevo (1 hoja)',
      bundleCoupon2: 'Paquete de 2 cupones de 15 min',
      bundleCoupon3: 'Paquete de 3 cupones de 15 min',
      verifiedFriends: 'Amigos verificados',
      flexibleTime: 'Tiempo flexible',
      online: 'En línea',
      offline: 'Desconectado'
    },
    
    // 라운지 미니
    loungeMini: {
      weekendEvent: 'Evento especial de fin de semana',
      title: 'Sala ZEP',
      subtitle: 'Experimenta tiempo especial con la participación directa del operador',
      saturdayEvent: 'Evento de sábado',
      time: '20:00',
      kst: 'KST',
      operationTime: 'Hora de operación',
      participants: '30',
      maxParticipants: 'Máx. participantes',
      firstComeFirstServed: 'Primero en llegar',
      timeByCountry: 'Hora por país',
      countries: {
        korea: 'Corea',
        peru: 'Perú',
        mexico: 'México'
      },
      timeFormat: {
        korea: 'Corea: 20:00 (KST)',
        peru: 'Perú: 06:00 (PET)',
        mexico: 'México: 05:00 (CST)'
      },
      specialTime: 'Tiempo especial',
      gettingToKnow: 'Tiempo para conocerse',
      description: 'Haz nuevos amigos a través de conversaciones libres y experiencias culturales coreanas',
      features: {
        freeTalk: 'Conversación libre',
        culturalExchange: 'Intercambio cultural',
        makeFriends: 'Hacer amigos'
      },
      button: 'Ir a la sala',
      message: '¡Te esperamos todos los sábados por la noche!'
    },
    
    // 기능 카드 배지
    featureBadges: {
      consultationCoupon: 'Cupón de 1 AKO',
      pointReward: 'Recompensa de puntos',
      weekendSpecial: 'Operación especial de fin de semana'
    },
    
    
    // 커뮤니티 탭
    communityTab: {
      story: 'Historia',
      qa: 'P&R',
      lounge: 'Sala',
      todayStory: 'Historia de hoy',
      uploadStory: '+ Subir historia',
      askQuestion: 'Hacer pregunta',
      noStories: 'No hay historias',
      newStory: 'Nueva historia',
      storyText: 'Texto de la historia',
      photoUpload: 'Subir foto',
      publicStory: 'Historia pública',
      privateStory: 'Historia privada',
      autoDelete: 'Se elimina automáticamente en 24 horas',
      like: 'Me gusta',
      comment: 'Comentario',
      writeComment: 'Escribe un comentario...',
      noComments: 'Aún no hay comentarios.',
      newQuestion: 'Nueva pregunta',
      title: 'Título',
      titlePlaceholder: 'Ingresa el título de tu pregunta',
      category: 'Categoría',
      tags: 'Etiquetas (separadas por comas)',
      tagsPlaceholder: 'Ej: cosméticos, piel sensible, recomendaciones',
      questionContent: 'Contenido de la pregunta',
      questionContentPlaceholder: 'Ingresa el contenido detallado de tu pregunta...',
      registerQuestion: 'Registrar pregunta',
      // 자유게시판
      freeboard: {
        writePost: 'Escribir publicación',
        writePostDescription: 'Escribe una nueva publicación. Ingresa el título y contenido, y selecciona una categoría.',
        titlePlaceholder: 'Ingresa el título',
        postType: 'Tipo de publicación',
        normalPost: 'Publicación normal',
        survey: 'Encuesta',
        notice: 'Aviso (solo administradores)',
        surveyTips: 'Consejos para escribir encuestas:',
        surveyTip1: 'Escribe la pregunta de manera clara',
        surveyTip2: 'Es mejor proporcionar múltiples opciones',
        surveyTip3: 'Ej: "¿Cuál es tu grupo de K-pop favorito? 1) BTS 2) BLACKPINK 3) NewJeans 4) Otro"',
        surveyOptions: 'Opciones de encuesta',
        author: 'Autor',
        createdAt: 'Fecha de creación',
        views: 'Vistas',
        likes: 'Me gusta',
        loadingPosts: 'Cargando publicaciones...',
        noPosts: 'No hay publicaciones.',
        retry: 'Reintentar',
        searchPlaceholder: 'Buscar por título, contenido, autor',
        allPosts: 'Todas las publicaciones',
        freeBoard: 'Tablero libre',
        latest: 'Más recientes',
        popular: 'Más populares',
        comments: 'Más comentados'
      },
      // 게시글 상세
      postDetail: {
        loadingPost: 'Cargando publicación...',
        views: 'Vistas',
        comments: 'Comentarios',
        reply: 'Responder',
        replyPlaceholder: 'Escribe tu respuesta...',
        writeReply: 'Escribir respuesta',
        noComments: 'Aún no hay comentarios.',
        writeComment: 'Escribir comentario',
        commentPlaceholder: 'Escribe tu comentario...'
      },
      categories: {
        all: 'Todos',
        beauty: 'Belleza',
        fashion: 'Moda',
        travel: 'Viaje a Corea',
        culture: 'Cultura coreana',
        free: 'Libre'
      },
      pointRules: 'Reglas de obtención de puntos',
      todayActivity: 'Actividad de hoy',
      searchQuestions: 'Buscar preguntas...',
      unverified: 'No verificado (prueba)',
      koreans: 'Coreanos',
      question: 'Pregunta',
      answer: 'Respuesta',
      dailyLimit: 'Límite diario',
      adoptionLikeBonus: 'Bono de adopción/me gusta',
      latinUsers: 'Usuarios latinos',
      spamCooldown: 'Tiempo de espera anti-spam',
      myQuestions: 'Mis preguntas',
      myAnswers: 'Mis respuestas',
      pointsAcquired: 'Puntos obtenidos',
      upvotesReceived: 'Me gusta recibidos',
      loungeHooks: {
        thisWeekLounge: 'Sala de esta semana',
        joinSpecialTime: 'Participa en tiempo especial con el operador',
        goToLounge: 'Ir a la sala',
        specialReward: 'Recompensa especial',
        points: 'puntos',
        nativeAdTitle: '🎈 ¡Disfruta de un momento especial en la sala!',
        nativeAdDescription: 'Todos los sábados por la noche, charla sobre cultura coreana con el operador',
        seatsRemaining: 'plazas restantes',
        joinNow: 'Participar ahora',
        sponsored: 'Patrocinado',
        loungeParticipation: 'Participación en sala',
        specialBonusPoints: 'Obtener puntos de bonificación especial',
        nextLounge: 'Próxima sala',
        rewards: 'Recompensas',
        weeklySchedule: 'Operación regular todos los sábados',
        whatWeDoInLounge: 'Qué hacemos en la sala'
      }
    },

    // 라운지 리워드 모달
    loungeReward: {
      welcome: '¡Bienvenido a la sala!',
      pointsEarned: 'puntos obtenidos',
      pointsDescription: 'Has recibido puntos especiales por participar en la sala',
      specialBenefits: 'Beneficios especiales de la sala',
      networkingOpportunity: 'Oportunidad de networking',
      meetNewFriends: 'Conoce nuevos amigos',
      languageExchange: 'Intercambio de idiomas',
      practiceLanguage: 'Práctica natural del idioma',
      specialEvents: 'Eventos especiales',
      weeklySpecialEvents: 'Participa en eventos especiales semanales',
      showGuide: 'Ver guía',
      startNow: 'Comenzar ahora',
      quickGuide: 'Guía de uso de la sala',
      guide: {
        step1: {
          title: 'Presentarte',
          description: 'Saluda brevemente y preséntate'
        },
        step2: {
          title: 'Participar en conversaciones',
          description: 'Participa libremente en temas que te interesen'
        },
        step3: {
          title: 'Disfrutar',
          description: 'Pasa un momento agradable a través del intercambio cultural'
        }
      },
      back: 'Anterior',
      gotIt: 'Entendido'
    },

    // 라운지 참여자
    loungeParticipants: {
      noParticipants: 'Aún no hay participantes',
      participants: 'participando'
    },
    
    // 포인트 현황
    pointStatus: {
      title: 'Estado de Puntos',
      totalPoints: 'Total de Puntos',
      acquiredToday: 'Obtenidos Hoy',
      remainingLimit: 'Límite Restante',
      korean: '🇰🇷 Coreano',
      local: '🌎 Local',
      recentPointEarnings: 'Ganancias Recientes de Puntos'
    },
    
    // 프로필
    profile: {
      myProfile: 'Mi Perfil',
      name: 'Nombre',
      major: 'Carrera',
      year: 'Año',
      university: 'Universidad',
      selfIntroduction: 'Autointroducción',
      availableTime: 'Tiempo disponible',
      interests: 'Intereses',
      joinDate: 'Fecha de registro',
      myPoints: 'Mis puntos',
      thisMonthPoints: 'Puntos de este mes',
      consecutiveDays: 'Días consecutivos',
      exchangeCount: 'Número de videollamadas',
      totalCases: 'Total de {count} casos',
              successfulExchanges: 'Videollamadas exitosas',
      myCoupons: 'Mis cupones',
      expirationDate: 'Fecha de vencimiento',
      noExpiration: 'Sin vencimiento',
      purchaseHistory: 'Historial de compras',
      purchaseItems: {
        consultation15min2: 'Cupón AKO x2'
      },
      edit: 'Editar',
      native: 'Nativo',
      unverified: 'No verificado',
      consultation15min: 'Consulta de 15 min',
      weekdayEvening: 'Tarde de semana',
      weekendAfternoon: 'Tarde de fin de semana',
      koreanLanguage: 'Idioma coreano',
      koreanCulture: 'Cultura coreana',
      cooking: 'Cocina',
      travel: 'Viaje',
      music: 'Música',
      units: {
        cases: 'casos',
        points: 'pts',
        rank: 'º'
      }
    },
    
    // 알림 설정
    notificationSettings: {
      title: 'Configuración de Notificaciones',
      subtitle: 'Selecciona y configura las notificaciones que deseas recibir.',
      systemStatus: 'Estado del Sistema',
      reset: 'Restablecer',
      testNotification: 'Notificación de Prueba',
      saving: 'Guardando...',
      save: 'Guardar',
      autoSaving: 'Guardado automático...',
      saveSettings: 'Guardar Configuración',
      notificationChannels: 'Canales de Notificación',
      channelDescription: 'Selecciona cómo quieres recibir las notificaciones.',
      emailNotification: 'Notificaciones por Email',
      emailDescription: 'Recibe notificaciones por correo electrónico.',
      browserPushNotification: 'Notificaciones Push del Navegador',
      browserPushDescription: 'Recibe notificaciones push en tu navegador.',
      inAppNotification: 'Notificaciones en la Web',
      inAppDescription: 'Consulta las notificaciones en el sitio web.',
      notificationTypes: 'Configuración por Tipo de Notificación',
      typesDescription: 'Selecciona qué notificaciones quieres recibir en cada canal.',
      email: 'Email',
      push: 'Push',
      website: 'Sitio Web',
      successMessage: 'La configuración de notificaciones se ha guardado.',
      errorMessage: 'No se pudo cargar la configuración. Se usarán los valores predeterminados.',
      networkError: 'Ocurrió un error de red. Se usarán los valores predeterminados.',
      tableMissing: 'La tabla de configuración de notificaciones aún no se ha creado. Se usarán los valores predeterminados.',
      testSuccess: '¡Se ha enviado la notificación de prueba!',
      testError: 'Ocurrió un error al enviar la notificación de prueba.'
    },
    
    // 마이 탭
    myTab: {
      // 한국인 전용
      koreanRank: 'Ranking de Coreanos',
      koreanRankDescription: 'Entre {count} coreanos',
      top3: '🏆 TOP 3',
      top10: '🥈 TOP 10',
      normal: '🥉 General',
      
      // 커뮤니티 활동
      communityActivity: 'Actividad Comunitaria',
      communityDescription: 'Preguntas/Respuestas',
      thisMonthPoints: 'Este mes +{points} pts',
      
      // 알림 설정
      notificationSettings: 'Configuración de Notificaciones',
      webPushNotification: 'Notificaciones Push Web',
      webPushDescription: 'Nuevos mensajes, notificaciones de actualización',
      emailNotification: 'Notificaciones por Email',
      emailDescription: 'Actualizaciones importantes y noticias de eventos',
      marketingNotification: 'Notificaciones de Marketing',
      marketingDescription: 'Beneficios especiales e información de eventos',
      
      // 상태
      completed: 'Completado',
      pending: 'En Progreso',
      cancelled: 'Cancelado'
    },
    
    // 커뮤니티
    community: {
      title: 'Puntos de Comunidad',
      subtitle: '¡Acumula puntos con actividades!',
      pointRules: 'Reglas de obtención de puntos',
      askQuestion: 'Hacer pregunta',
      writeAnswer: 'Escribir respuesta',
      writeStory: 'Escribir historia',
      freeBoard: 'Foro libre',
      totalPoints: 'Total de puntos',
      todayAcquisition: 'Obtenido hoy',
      remainingLimit: 'Límite restante',
      points: 'puntos',
      qa: 'P&R',
      story: 'Historia',
      koreanNews: 'Noticias coreanas',
      userType: {
        korean: 'Coreano',
        latin: 'Local'
      }
    },
    
    // 스토리 설정
    
    // 푸터
    footer: {
      description: 'Plataforma global para aprender cultura coreana y hacer nuevos amigos',
      madeWithLove: 'Hecho con amor y pasión',
      copyright: 'Todos los derechos reservados',
      privacy: 'Política de Privacidad',
      terms: 'Términos de Servicio',
      cookies: 'Política de Cookies',
      support: 'Soporte',
      help: 'Ayuda',
      faq: 'Preguntas Frecuentes',
      contact: 'Contacto',
      feedback: 'Comentarios',
      company: 'Empresa',
      about: 'Acerca de',
      followUs: 'Síguenos',
      globalMessage: 'Hecho con ❤️ y ✨ para una comunidad global',
      bridgeDescription: 'Un puente que conecta Corea y América Latina, AMIKO',
      officialSns: 'SNS Oficial de AMIKO'
    },

    // 새로 추가된 섹션들 (스페인어)
    // 문의 페이지
    inquiry: {
      title: 'Consultas',
      subtitle: 'Si tienes alguna pregunta, no dudes en contactarnos',
      heroTitle: 'Cuéntanos\nsobre inconvenientes',
      heroSubtitle: 'Si tienes inconvenientes o sugerencias de mejora durante el uso, no dudes en consultarnos en cualquier momento.\nTe responderemos lo antes posible.',
      inquiryType: 'Tipo de consulta',
      inquiryTypeSubtitle: 'Por favor, deja cualquier tipo de consulta cómodamente',
      inquiryTypes: {
        general: 'Consulta general',
        technical: 'Consulta técnica',
        business: 'Consulta comercial',
        other: 'Otro',
        bug: 'Reporte de errores',
        feature: 'Sugerencia de función',
        payment: 'Consulta de pago',
        account: 'Consulta de cuenta'
      },
      inquiryTypeDescriptions: {
        bug: 'Por favor, reporta errores encontrados en la aplicación o sitio web',
        feature: 'Por favor, sugiere nuevas funciones o mejoras',
        general: 'Otras preguntas o contenido que necesita ayuda',
        payment: 'Problemas relacionados con pagos o consultas de reembolso',
        account: 'Problemas relacionados con inicio de sesión, registro o cuenta',
        other: 'Consultas que no corresponden a las categorías anteriores'
      },
      priority: 'Prioridad',
      priorities: {
        low: 'Baja',
        medium: 'Media',
        high: 'Alta',
        urgent: 'Urgente'
      },
      subject: 'Asunto',
      message: 'Mensaje',
      submit: 'Enviar consulta',
      submitSuccess: 'La consulta se ha enviado exitosamente',
      submitError: 'Ocurrió un error al enviar la consulta',
      successTitle: '¡La consulta se ha enviado exitosamente!',
      successMessage: 'Te responderemos lo antes posible. Gracias.',
      newInquiry: 'Nueva consulta',
      goHome: 'Volver al inicio'
    },

    // 제휴 문의 페이지
    partnership: {
      title: 'Consultas de Alianza',
      subtitle: 'Propuesta de Asociación Comercial',
      benefitsTitle: 'Creemos mayor valor a través de la asociación.',
      benefitsSubtitle: 'Con AMIKO, con el mundo.',
      benefits: {
        brandExpansion: {
          title: 'Promoción de Marca',
          description: 'Ayudamos a que la marca del socio se difunda de manera más amplia y natural\nentre los jóvenes clientes globales a través de la comunidad Amiko.'
        },
        customerExpansion: {
          title: 'Nuevo Mercado',
          description: 'Conectamos la marca del socio en ambos continentes\na través de la base de clientes Corea-América Latina de Amiko.'
        },
        revenueIncrease: {
          title: 'Nuevos Clientes',
          description: 'Apoyamos para que las marcas y servicios del socio\npuedan llegar a nuevos clientes globales a través de la plataforma Amiko.'
        }
      },
      companyName: 'Nombre de la empresa',
      ceoName: 'Nombre del CEO',
      contact: 'Contacto',
      businessField: 'Campo de negocio',
      companySize: 'Tamaño de la empresa',
      companySizes: {
        startup: 'Startup (1-10 personas)',
        small: 'Pequeña empresa (11-50 personas)',
        medium: 'Mediana empresa (51-200 personas)',
        large: 'Gran empresa (200+ personas)'
      },
      partnershipType: 'Tipo de alianza',
      partnershipTypes: {
        advertising: 'Alianza publicitaria',
        collaboration: 'Alianza de colaboración',
        investment: 'Alianza de inversión',
        distribution: 'Alianza de distribución',
        other: 'Otro'
      },
      budget: 'Presupuesto',
      expectedEffects: 'Efectos esperados',
      attachment: 'Archivo adjunto',
      attachmentDescription: 'Adjunta perfil de empresa, propuesta, etc.',
      submit: 'Enviar consulta de alianza',
      submitSuccess: 'La consulta de alianza se ha enviado exitosamente',
      submitError: 'Ocurrió un error al enviar la consulta de alianza'
    },


    // 메인페이지 헤더
    mainHeader: {
      home: 'Inicio',
      videoCall: 'Videollamada',
      community: 'Comunidad',
      charging: 'Tienda',
      event: 'Eventos',
      profile: 'Perfil',
      logout: 'Cerrar sesión',
      myInfo: 'Mi información',
      notifications: 'Notificaciones'
    },

    // 헤더 네비게이션
    header: {
      home: 'Inicio',
      about: 'Acerca de',
      inquiry: 'Consultas',
      partnership: 'Consultas de Alianza',
      startButton: 'Comenzar'
    },

    // 충전소 탭

    // 이벤트 탭



    // 영상통화 통계
    videoCallStats: {
      title: 'Mis estadísticas de llamadas',
      totalCalls: 'Total de llamadas',
      totalTime: 'Tiempo total (minutos)',
      conversationPartners: 'Compañeros de conversación',
      earnedPoints: 'Puntos obtenidos'
    },

    // 이벤트 탭
    eventTab: {
      attendanceCheck: {
        title: 'Registro de asistencia',
        subtitle: '¡Registra tu asistencia diaria y recibe recompensas especiales por asistencia consecutiva!',
        eventTitle: 'Evento de registro de asistencia',
        monthCompletion: 'completar un mes',
        monthCompletionDescription: 'Puedes recibir recompensas especiales por',
        calendarTitle: 'Registro de asistencia',
        yearMonthFormat: '{month} de {year}',
        rewardSystem: 'Sistema de recompensas',
        days: 'días',
        coupons: 'cupones',
        points: 'puntos',
        couponUnit: '',
        pointUnit: '',
        consecutiveDays: 'consecutivos',
        monthCompletionReward: 'completar un mes',
        pointMethods: {
          title: 'Cómo obtener puntos',
          attendance: 'Registro de asistencia',
          community: 'Participación en comunidad',
          attendanceDescription: 'Obtén puntos con el registro de asistencia',
          communityDescription: 'Escribir publicaciones, comentarios, dar me gusta'
        },
        specialEvents: {
          title: 'Eventos especiales',
          localEvent: {
            title: 'Evento especial para locales',
            description: 'Oportunidad de viaje y experiencia cultural en Corea',
            reward: 'Boleto de avión ida y vuelta a Corea + guía',
            specialBenefit: 'Operador como guía en Corea',
            firstPrize: 'Premio 1er lugar',
            specialBenefitTitle: 'Beneficio especial',
            period: '¡Se otorga al 1er lugar con los puntos más altos de junio a diciembre!'
          },
          koreanEvent: {
            title: 'Evento especial para coreanos',
            description: 'Apoyo para exámenes de mejora del inglés',
            toeic: 'Apoyo para examen TOEIC',
            toefl: 'Apoyo para examen TOEFL',
            examFeeSupport: 'Apoyo completo para tarifas de examen'
          }
        },
        welcomeReward: {
          title: 'Recompensa de bienvenida',
          description: 'Se otorga 1 cupón al registrarse por primera vez',
          coupon: '1 cupón',
          points: '50 puntos'
        },
        specialReward: 'VIP 15 días'
      }
    },

    // 헤더 네비게이션
    headerNav: {
      home: 'Inicio',
      videoCall: 'Videollamada',
      community: 'Comunidad',
      store: 'Tienda',
      storeShort: 'Tienda',
      chargingStation: 'Estación de carga',
      chargingStationShort: 'Carga',
      event: 'Eventos',
      logout: 'Cerrar sesión',
      myInfo: 'Mi información'
    },


    // 충전소
    chargingTab: {
      coupons: {
        title: 'Cupones AKO',
        subtitle: 'Compra cupones AKO para disfrutar videollamadas',
        popular: 'Popular',
        discount: 'descuento',
        perUnit: 'por unidad',
        buyNow: 'Comprar',
        unit: '',
        minutes: 'min'
      },
      search: {
        noResults: 'No se encontraron resultados',
        adjustFilters: 'Ajusta los términos de búsqueda o categorías',
        resetFilters: 'Restablecer filtros'
      },
      vip: {
        title: 'Funciones VIP',
        subtitle: 'Disfruta de una experiencia más especial con funciones premium',
        monthly: 'VIP Mensual',
        yearly: 'VIP Anual',
        period: '1 mes',
        periodYear: '1 año',
        mostPopular: 'Más popular',
        subscribe: 'Suscribirse',
        monthlySavings: 'Ahorra $3.3/mes',
        monthlyLevel: 'Nivel $6.7/mes',
        features: {
          beautyFilter: 'Filtro de belleza',
          communityBadge: 'Insignia de comunidad',
          adRemoval: 'Sin anuncios',
          simultaneousInterpretation: 'Interpretación simultánea'
        },
        featureDescriptions: {
          beautyFilter: 'Corrección facial en tiempo real durante videollamadas para una apariencia más hermosa',
          communityBadge: 'Muestra tu estatus especial como miembro premium',
          adRemoval: 'Disfruta de un entorno limpio sin banners ni pop-ups publicitarios',
          simultaneousInterpretation: 'Comunicación más rápida y natural con soporte de subtítulos/voz'
        },
        details: 'Detalles',
        warning: 'Solo con suscripción VIP no se puede hacer llamadas - Se requiere compra de cupones'
      }
    },

    // 프로필 설정
    profileSettings: {
      title: 'Configuración de perfil',
      subtitle: 'Administra configuraciones personales como idioma, zona horaria y país',
      timezone: {
        title: 'Configuración de zona horaria',
        description: 'Selecciona la zona horaria apropiada para tu ubicación actual y todos los tiempos se mostrarán en hora local',
        label: 'Zona horaria',
        placeholder: 'Seleccionar zona horaria',
        currentTime: 'Hora actual',
        currentTimeDescription: 'Esta es la hora actual en la zona horaria seleccionada',
        comparison: 'Comparación de hora de ciudades principales',
        noTimeInfo: 'Sin información de hora'
      },
      region: {
        title: 'Configuración de región e idioma',
        description: 'Configura tu país e idioma para recibir servicios personalizados',
        country: 'País',
        countryPlaceholder: 'Seleccionar país',
        language: 'Idioma',
        languagePlaceholder: 'Seleccionar idioma',
        displayName: 'Nombre de visualización (opcional)',
        displayNamePlaceholder: 'Nombre que verán otros usuarios'
      },
      actions: {
        cancel: 'Cancelar',
        save: 'Guardar configuración',
        saving: 'Guardando...',
        saved: '¡Configuración guardada!'
      },
      countries: {
        KR: 'Corea del Sur',
        US: 'Estados Unidos',
        GB: 'Reino Unido',
        FR: 'Francia',
        DE: 'Alemania',
        JP: 'Japón',
        CN: 'China',
        AU: 'Australia',
        CA: 'Canadá',
        SG: 'Singapur'
      },
      timezones: {
        'Asia/Seoul': 'Corea (UTC+9)',
        'America/New_York': 'Este de EE.UU. (UTC-5)',
        'America/Los_Angeles': 'Oeste de EE.UU. (UTC-8)',
        'Europe/London': 'Reino Unido (UTC+0)',
        'Europe/Paris': 'Francia (UTC+1)',
        'Asia/Tokyo': 'Japón (UTC+9)',
        'Asia/Shanghai': 'China (UTC+8)',
        'Australia/Sydney': 'Australia (UTC+10)',
        'Asia/Dubai': 'UAE (UTC+4)',
        'Asia/Singapore': 'Singapur (UTC+8)'
      }
    },

    // 스토리 설정
    storySettings: {
      globalSettings: {
        title: 'Configuración global de historias',
        autoPublic: {
          label: 'Publicación automática de nuevas historias',
          description: 'Establecer las historias recién subidas como públicas por defecto'
        },
        showInProfile: {
          label: 'Mostrar historias en perfil',
          description: 'Mostrar historial de historias en mi perfil'
        }
      },
      archiveSettings: {
        title: 'Configuración de archivo',
        autoArchive: {
          label: 'Archivo automático',
          description: 'Archivar automáticamente las historias expiradas'
        },
        archiveTiming: {
          label: 'Momento de archivo',
          options: {
            '1': 'Después de 1 hora',
            '6': 'Después de 6 horas',
            '12': 'Después de 12 horas',
            '24': 'Después de 24 horas'
          }
        }
      },
      individualSettings: {
        title: 'Configuración individual de historias',
        public: 'Público',
        private: 'Privado',
        delete: 'Eliminar',
        deleteConfirm: '¿Realmente quieres eliminar esta historia?',
        storyImage: 'Imagen de historia'
      }
    },

    // 채팅 관련
    chat: {
      rulesModal: {
        title: '📌 Guía de Reglas de Chat de Amiko',
        mentorRules: {
          title: 'Reglas de Operación de Mentores',
          description: 'Los mentores solo operan dentro de la plataforma Amiko y reciben especificaciones y recompensas.'
        },
        noContactExchange: {
          title: 'Prohibición de Intercambio de Contactos Personales',
          description: 'El intercambio de contactos personales o información de redes sociales está absolutamente prohibido.'
        },
        amikoServices: {
          title: 'Servicios de Amiko',
          description: 'Amiko proporciona traducción, puntos y un entorno seguro. Todas las conversaciones deben tener lugar solo dentro de Amiko.'
        },
        agreement: '☑ Entiendo y acepto el contenido anterior.',
        cancel: 'Cancelar',
        agreeAndEnter: 'Aceptar y Entrar'
      },
      room: {
        welcomeMessage: '¡Bienvenido a la sala de chat de Amiko! Ten conversaciones seguras y agradables.',
        noContactBanner: 'El intercambio de números está prohibido 🙏 Chatea solo dentro de Amiko.',
        mentorStatus: {
          online: 'Estado en línea.',
          busy: 'Actualmente en otra consulta. Inténtalo de nuevo más tarde.',
          offline: 'Actualmente fuera de línea. Recibirás una notificación cuando se conecte.'
        },
        messagePlaceholder: 'Escribe un mensaje...',
        disabledPlaceholder: 'Disponible después de aceptar las reglas de chat'
      }
    },

    // Reset Password 페이지
    resetPassword: {
      passwordMismatch: 'Las contraseñas no coinciden',
      passwordRequirements: 'La contraseña debe cumplir con todos los requisitos',
      resetFailed: 'Error al restablecer la contraseña',
      resetError: 'Error al restablecer la contraseña',
      passwordChanged: 'Contraseña cambiada exitosamente',
      loginWithNewPassword: 'Inicia sesión con tu nueva contraseña',
      login: 'Iniciar sesión',
      setNewPassword: 'Establecer nueva contraseña',
      enterNewPassword: 'Ingresa tu nueva contraseña',
      newPassword: 'Nueva contraseña',
      newPasswordPlaceholder: 'Ingresa tu nueva contraseña',
      confirmPassword: 'Confirmar contraseña',
      confirmPasswordPlaceholder: 'Confirma tu nueva contraseña',
      resetting: 'Restableciendo...',
      resetPassword: 'Restablecer contraseña',
      rememberAccount: '¿Recuerdas tu cuenta?',
      loginLink: 'Iniciar sesión',
      minLength: 'Mínimo 8 caracteres',
      hasNumber: 'Debe contener un número',
      hasSpecial: 'Debe contener un carácter especial',
      noRepeated: 'No debe tener caracteres repetidos consecutivos'
    },

    // Admin Inquiries 페이지
    adminInquiries: {
      title: 'Gestión de Consultas',
      subtitle: 'Revisa y responde las consultas de los usuarios',
      loading: 'Cargando lista de consultas...',
      filter: 'Filtro',
      all: 'Todos',
      count: '개',
      inquiryList: 'Lista de Consultas',
      inquiryDetail: 'Detalles de la Consulta',
      subject: 'Asunto',
      content: 'Contenido',
      author: 'Autor',
      responseList: 'Lista de Respuestas',
      writeResponse: 'Escribir Respuesta',
      responsePlaceholder: 'Ingresa tu respuesta...',
      submitResponse: 'Enviar Respuesta',
      submittingResponse: 'Enviando respuesta...',
      selectInquiry: 'Selecciona una consulta',
      selectInquiryDescription: 'Selecciona una consulta del lado izquierdo para ver los detalles y respuestas.',
      noResponses: 'Aún no hay respuestas.',
      admin: 'Administrador',
      user: 'Usuario',
      status: {
        placeholder: 'Estado',
        pending: 'Pendiente',
        inProgress: 'En Proceso',
        resolved: 'Resuelto',
        closed: 'Cerrado'
      },
      priority: {
        low: 'Bajo',
        medium: 'Medio',
        high: 'Alto',
        urgent: 'Urgente'
      },
      type: {
        placeholder: 'Tipo',
        bug: 'Reporte de Error',
        feature: 'Sugerencia de Función',
        general: 'Consulta General',
        payment: 'Consulta de Pago',
        account: 'Consulta de Cuenta',
        other: 'Otro'
      },
      errors: {
        fetchInquiries: 'No se pudo obtener la lista de consultas',
        fetchResponses: 'No se pudo obtener las respuestas',
        updateStatus: 'Error al actualizar el estado',
        submitResponse: 'Error al enviar la respuesta'
      },
      success: {
        submitResponse: 'Respuesta enviada exitosamente'
      }
    },

    // Landing FAQ 컴포넌트
    landingFaq: {
      title: 'Preguntas Frecuentes',
      description: 'Hemos recopilado preguntas frecuentes sobre Amiko.\nSi necesitas información más detallada, contáctanos en cualquier momento.',
      moreQuestions: '¿Tienes más preguntas?',
      moreQuestionsDescription: 'Si no encontraste la respuesta arriba,\n¡contáctanos en cualquier momento!',
      contactUs: 'Contactar',
      questions: {
        safety: '¿Es seguro Amiko?',
        howToStart: '¿Cómo empezar?',
        availability: '¿Puedo usarlo en cualquier momento?',
        community: '¿Qué puedo hacer en la comunidad?',
        verification: '¿Cómo verifico mi cuenta?'
      },
      answers: {
        safety: 'Sí, es muy seguro. Todos los usuarios comienzan como estudiantes universitarios verificados, y si hacen algo malo, pueden ser atrapados con la información de verificación, por lo que las personas malas no pueden entrar. Un sistema de verificación perfecto garantiza un ambiente seguro.',
        howToStart: '¡Es simple! Primero regístrate y completa la verificación, luego puedes comenzar fácilmente con una consulta gratuita de 15 minutos. Experimenta la especialidad de Amiko a través del primer encuentro con un amigo coreano.',
        availability: 'Sí, está disponible las 24 horas del día. Puedes reservar y realizar consultas en el momento que desees, lo que es muy conveniente.',
        community: 'Puedes hacer preguntas, responder y ganar puntos. Comunícate sobre diversos temas en 5 categorías y recibe beneficios especiales.',
        verification: 'Puedes completar la verificación con tu tarjeta de estudiante o documento de identidad. Solo los usuarios verificados pueden usar el servicio, lo que lo hace seguro.'
      },
      categories: {
        safety: 'Seguridad',
        usage: 'Uso',
        time: 'Tiempo',
        community: 'Comunidad'
      }
    },

    // Main FAQ 컴포넌트
    mainFaq: {
      title: 'Preguntas Frecuentes',
      subtitle: 'Revisa las preguntas frecuentes sobre el servicio Amiko',
      moreQuestions: 'Si tienes más preguntas, contáctanos en cualquier momento',
      emailContact: 'Consulta por Email',
      phoneContact: 'Consulta por Teléfono',
      questions: {
        service: '¿Qué servicios ofrece Amiko?',
        mentorSelection: '¿Cómo se seleccionan los mentores?',
        classFormat: '¿Cómo se realizan las clases?',
        scheduling: '¿Puedo reservar clases en cualquier momento?',
        beginner: '¿Puedo tomar clases sin saber coreano?',
        pricing: '¿Cuánto cuestan las clases?',
        reviews: '¿Puedo dejar reseñas después de las clases?',
        refund: '¿Cuál es la política de reembolso?'
      },
      answers: {
        service: 'Amiko es una plataforma de mentoría en línea para estudiantes de todo el mundo que quieren aprender cultura e idioma coreano. Ofrecemos diversos servicios como encuentros 1:1 por video, corrección de pronunciación e intercambio cultural.',
        mentorSelection: 'Todos los mentores son seleccionados a través de un proceso de evaluación estricto. Evaluamos integralmente certificaciones de enseñanza de coreano, experiencia y carácter para garantizar la mejor calidad.',
        classFormat: 'Se realiza a través de chat de video con IA. Puedes aprender efectivamente utilizando varias funciones como compartir pantalla, chat y grabación.',
        scheduling: 'Sí, puedes reservar las 24 horas del día. Puedes reservar clases en el momento que desees según el horario del mentor.',
        beginner: '¡Por supuesto! Ofrecemos currículos para todos los niveles, desde cursos básicos para principiantes hasta cursos avanzados. Las explicaciones están disponibles en varios idiomas como inglés, japonés y chino.',
        pricing: 'Se aplica diferencialmente según el tiempo de clase y la experiencia del mentor. Comienza con clases básicas de 30 minutos y también ofrecemos descuentos por paquetes. Puedes verificar el precio exacto al hacer la reserva.',
        reviews: 'Sí, puedes dejar reseñas y calificaciones sobre el mentor y la calidad de la clase después de la clase. Esto ayuda a otros estudiantes a referenciar y mejora la calidad del servicio.',
        refund: 'Es posible un reembolso del 100% hasta 24 horas antes del inicio de la clase. Después del inicio de la clase, se puede considerar un reembolso parcial según las circunstancias. Para más detalles, contacta el servicio al cliente.'
      }
    }
  }
}

export type Language = keyof typeof translations
export type TranslationKey = keyof typeof translations.ko
