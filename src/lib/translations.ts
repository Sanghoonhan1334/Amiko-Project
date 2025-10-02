export const translations = {
  ko: {
    // 헤더
    landingPage: '랜딩페이지',
    start: '시작하기',
    lounge: '라운지',
    korean: '한국어',
    spanish: 'Español',
    changeToSpanish: 'Cambiar a Español으로 변경',
    changeToKorean: '한국어로 변경',
    selectLanguage: '언어 선택',
    language: 'ko',
    
    // 공통 버튼
    buttons: {
      upload: '업로드',
      register: '등록',
      write: '작성',
      delete: '삭제',
      confirm: '확인',
      cancel: '취소',
      save: '저장',
      edit: '편집',
      submit: '제출',
      loading: '로딩 중...',
      login: '로그인',
      uploading: '업로드 중...',
      saving: '저장 중...',
      writing: '작성 중...',
      deleting: '삭제 중...',
      retry: '다시 시도',
      required: '필수'
    },

    // 인증 관련
    auth: {
      forgotPassword: '비밀번호 찾기',
      signUp: '회원가입',
      signIn: '로그인',
      signInDescription: '계정에 로그인하여 Amiko의 모든 기능을 이용하세요',
      signUpDescription: 'Amiko에 가입하여 한국어 학습과 문화 교류를 시작하세요',
      signingIn: '로그인 중...',
      signingUp: '회원가입 중...',
      emailOrPhone: '이메일 또는 전화번호',
      emailOrPhonePlaceholder: '이메일 또는 전화번호를 입력하세요',
      password: '비밀번호',
      passwordPlaceholder: '비밀번호를 입력하세요',
      confirmPassword: '비밀번호 확인',
      confirmPasswordPlaceholder: '비밀번호를 다시 입력하세요',
      name: '이름',
      namePlaceholder: '이름을 입력하세요',
      email: '이메일',
      emailPlaceholder: 'example@email.com',
      phone: '전화번호',
      country: '국가',
      countryCode: '국가 코드',
      selectCountry: '국가를 선택하세요',
      nationality: '국적',
      selectNationality: '국적을 선택해주세요',
      nextStep: '다음 단계',
      checking: '확인 중...',
      countries: {
        KR: '대한민국',
        MX: '멕시코',
        CO: '콜롬비아',
        AR: '아르헨티나',
        PE: '페루',
        VE: '베네수엘라',
        CL: '칠레',
        EC: '에콰도르',
        GT: '과테말라',
        HN: '온두라스',
        NI: '니카라과',
        PA: '파나마',
        PY: '파라과이',
        UY: '우루과이',
        BO: '볼리비아',
        CR: '코스타리카',
        DO: '도미니카공화국',
        SV: '엘살바도르',
        CU: '쿠바',
        PR: '푸에르토리코',
        BR: '브라질',
        US: '미국',
        CA: '캐나다',
        JP: '일본',
        CN: '중국',
        GB: '영국',
        FR: '프랑스',
        DE: '독일',
        AU: '호주',
        SG: '싱가포르'
      },
      passwordMinLength: '최소 8자 이상',
      passwordHasNumber: '숫자 포함',
      passwordHasSpecial: '특수문자 포함',
      passwordNoRepeated: '연속된 문자 없음',
      passwordMismatch: '비밀번호가 일치하지 않습니다',
      signUpSuccess: '회원가입이 완료되었습니다!',
      signUpFailed: '회원가입에 실패했습니다',
      signUpError: '회원가입 중 오류가 발생했습니다',
      alreadyHaveAccount: '이미 계정이 있으신가요?',
      noAccount: '계정이 없으신가요?',
      credentialsCheckMessage: '이메일/전화번호와 비밀번호를 확인해주세요',
      verifying: '인증 확인 중...',
      pleaseWait: '잠시만 기다려주세요.',
      checkingVerificationStatus: '인증 상태를 확인하는 중...',
      verificationStatusError: '인증 상태를 확인하는 중 오류가 발생했습니다.',
      
      // 이메일/SMS 인증
      emailVerification: '이메일 인증',
      smsVerification: '전화번호 인증',
      verificationCode: '인증코드',
      verificationCodePlaceholder: '6자리 인증코드를 입력하세요',
      sendVerificationCode: '인증코드 발송',
      resendCode: '인증코드 다시 발송',
      codeSent: '인증코드가 발송되었습니다',
      codeExpired: '인증코드가 만료되었습니다',
      invalidCode: '잘못된 인증코드입니다',
      verificationSuccess: '인증이 완료되었습니다',
      
      // 지문 인증
      biometricLogin: '지문으로 빠른 로그인',
      biometricSetup: '지문 인증 설정',
      biometricExplanation: '지문으로 더 빠르게 로그인하시겠습니까?',
      biometricSafe: '지문 정보는 디바이스에만 저장되며 서버로 전송되지 않습니다',
      biometricSkip: '나중에 설정',
      biometricEnable: '지문 인증 설정',
      biometricNotSupported: '이 디바이스는 지문 인증을 지원하지 않습니다',
      
      // 검증 절차 설명
      verificationNeeded: '왜 검증 절차가 필요한가요?',
      verificationReason1: '서로를 지켜주기 위해서: 검증된 사용자만이 커뮤니티에 참여할 수 있어 안전한 환경을 유지합니다',
      verificationReason2: '신뢰할 수 있는 커뮤니티: 모든 사용자가 실제 사람임을 확인하여 가짜 계정을 방지합니다',
      verificationReason3: '개인정보 보호: 검증된 사용자만이 다른 사용자의 정보에 접근할 수 있습니다',
      verificationSteps: '검증 절차 안내',
      step1Title: '이메일 인증',
      step1Desc: '이메일 주소가 실제로 사용 가능한지 확인합니다',
      step2Title: '전화번호 인증',
      step2Desc: 'SMS로 인증코드를 발송하여 실제 사용자임을 확인합니다',
      step3Title: '프로필 완성',
      step3Desc: '자기소개와 관심사를 작성하여 커뮤니티에 참여합니다',
      
      // 세션 관련
      sessionUpdateFailed: '세션 업데이트에 실패했습니다',
      sessionExpired: '세션이 만료되었습니다',
      sessionInvalid: '유효하지 않은 세션입니다',
      sessionRefreshFailed: '세션 갱신에 실패했습니다'
    },

    // Hero 슬라이드
    heroSlides: {
      slide1: {
        badge: '글로벌 커뮤니티',
        title: 'Global Community',
        subtitle: '남미와 한국을 잇는',
        description: 'AMIKO에서 다양한 사람들과 교류하며 새로운 세상을 경험하세요.',
        startButton: '시작하기'
      },
       slide2: {
         badge: 'Amiko에 탑재된 AI 통역과 함께',
         title: '화상으로 소통하세요',
        subtitle: '검증된 한국인 튜터들이\n여러분들과 함께합니다.',
        description: '자체 플랫폼을 통한 1:1 화상 미팅 시스템과\nAI 통역 서비스로 막힘없이, 간편하게,\n서로의 문화와 언어를 교류할 수 있습니다.',
        experience1: '서로의 나라에 대한 좋은 이미지를 가지고 그들을 만나기 위해\n화상 채팅 어플을 사용했던 경험이 있으신가요?',
        experience2: '혹시 그 경험이 당신에게 실망으로 다가오시지는 않으셨나요?',
        experience3: 'Amiko는 검증된 한국인 튜터들과 별점 시스템을 통해 좋은 경험을 여러분들께 선사합니다.'
      },
      slide3: {
        subtitle: '지구 반대편과 소통하세요.',
        title: 'Amiko 커뮤니티 서비스',
        description: 'Amiko는 지구 반대편을 연결하는 다리입니다. 커뮤니티를 통해 서로의 문화에 더욱 가까이 다가가보세요.',
        cards: {
          topicBoard: {
            title: '주제별 게시판',
            description: '다양한 주제를 자유롭게 소통해보세요.'
          },
          koreanNews: {
            title: '한국뉴스',
            description: '한국의 최신 소식과 트렌드를 확인해보세요.'
          },
          story: {
            title: '스토리',
            description: '나의 일상을 공유하고 일상에 대해서 대화해보세요.'
          },
          koreanTest: {
            title: '한국성향테스트',
            description: ''
          }
        },
        startButton: {
          title: '시작하기',
          subtitle: '지금 바로 AMIKO와 함께하세요'
        }
      }
    },


    // 헤더 네비게이션
    headerNav: {
      home: '홈',
      videoCall: '화상채팅',
      community: '커뮤니티',
      chargingStation: '충전소',
      chargingStationShort: '충전소',
      event: '이벤트',
      logout: '로그아웃',
      store: '상점',
      storeShort: '상점',
      worldTime: '세계 시간',
      countries: {
        korea: '한국',
        mexico: '멕시코',
        peru: '페루',
        colombia: '콜롬비아'
      }
    },

    // 메인 페이지
    mainPage: {
      title: '다양한 방법으로 즐기세요',
      videoCall: '화상채팅',
      videoCallDescription: '72시간마다 한국인과 AKO를 사용해 대화하세요',
      community: '커뮤니티',
      communityDescription: '커뮤니티를 통해 서로 알아가고\n소통해보세요',
      openEvent: '오픈 이벤트',
      openEventDescription: '신규 회원가입하고\n3 AKO를 받으세요!',
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
      akoExplanation: '1 AKO = 1 화상채팅 (20분)'
    },

    // 홈 탭
    homeTab: {
      community: '커뮤니티',
      openingOctober: '10월 오픈 예정'
    },

    // 메인 화상채팅 섹션
    main: {
      meet: 'AI 화상 채팅',
      meetDescription: '한국인 친구와 AI 화상 채팅을 통해 한국 문화를 배워보세요',
      community: '커뮤니티',
      communityDescription: '',
      me: '내 프로필',
      meDescription: '내 활동 내역과 포인트를 확인하세요'
    },

    // 화상채팅 페이지
    videoCall: {
      title: 'AI 화상 채팅',
      subtitle: '한국인 친구와 AI 화상 채팅을 통해 한국 문화를 배워보세요',
      description: '언어 교환과 문화 체험을 통해 새로운 경험을 만들어보세요',
      quickStart: '빠른 시작',
      quickStartDescription: '지금 바로 화상채팅을 시작해보세요',
      startCall: '채팅 시작',
      oneOnOne: '1:1 대화',
      oneOnOneDescription: '한국인과 개인적으로 대화하며\n언어를 배우세요',
      languageExchange: '언어 교환',
      languageExchangeDescription: '서로의 언어를 가르치고\n배우며 소통하세요',
      sessionTime: '세션 시간',
      sessionTimeDescription: '20분간 대화를 나눠보세요\n부족할 시 시간을 추가하세요',
      partners: '대화 상대',
      onlyKoreans: '한국인만 보기',
      enterChannelName: '채널명을 입력하세요',
      channelName: '채널명',
      channelShareTip: '채널명을 친구와 공유하면 함께 대화할 수 있습니다',
      viewInfo: '정보 보기',
      startConversation: '대화 시작',
      offline: '오프라인',
      noPartnersTitle: '파트너가 없습니다',
      noPartnersDescription: '현재 등록된 파트너가 없습니다. 곧 새로운 파트너들이 추가될 예정입니다.'
    },

    // 커뮤니티 탭
    communityTab: {
      story: '스토리',
      uploadStory: '스토리 업로드',
      noStories: '스토리가 없습니다',
      uploadFirstStory: '첫 번째 스토리를 업로드해보세요!',
      searchQuestions: '게시글 검색',
      askQuestion: '글쓰기',
      categories: {
        all: '전체',
        beauty: '뷰티',
        fashion: '패션',
        travel: '여행',
        culture: '문화',
        free: '자유'
      }
    },

    // 커뮤니티 섹션
    community: {
      story: '스토리',
      qa: 'Q&A',
      freeBoard: '주제별 게시판',
      koreanNews: '한국 뉴스',
      freeBoardDescription: '',
      koreanNewsDescription: '',
      qaDescription: '',
      loadingNews: '뉴스를 불러오는 중...',
      backToHome: '이전',
      viewMoreNews: '더 많은 한국 뉴스 보기',
      categories: {
        all: '전체글',
        free: '자유게시판',
        kpop: 'K-POP게시판',
        kdrama: 'K-Drama게시판',
        beauty: '뷰티',
        korean: '한국어',
        spanish: '스페인어'
      },
      noPosts: '게시물이 없습니다',
      beFirstToWrite: '첫 번째 게시글을 작성해보세요!',
      sortBy: '정렬:',
      sortOptions: {
        latest: '최신순',
        popular: '인기순',
        views: '조회순'
      },
      writePost: '글쓰기',
      galleryList: {
        title: '갤러리',
        subtitle: '',
        beauty: '뷰티 갤러리',
        fashion: '패션 갤러리',
        travel: '여행 갤러리',
        culture: '문화 갤러리',
        food: '음식 갤러리',
        language: '언어 갤러리',
        free: '자유주제 갤러리',
        daily: '일상 갤러리',
        writePost: '글쓰기',
        latest: '최신순',
        popular: '인기순',
        hot: '핫글순',
        mostCommented: '댓글많은순',
        mostViewed: '조회많은순',
        all: '전체',
        today: '오늘',
        week: '이번주',
        month: '이번달',
        withImages: '이미지 포함',
        textOnly: '텍스트만',
        pinned: '고정글',
        hotPosts: '핫글',
        popularPosts: '인기글',
        searchPlaceholder: '제목, 내용으로 검색...',
        search: '검색',
        clear: '지우기',
        advancedFilters: '고급 필터',
        simpleView: '간단히 보기',
        clearFilters: '필터 초기화',
        appliedFilters: '적용된 필터',
        sort: '정렬',
        period: '기간',
        type: '타입',
        status: '상태',
        quickAccess: '빠른 액세스',
        totalPosts: '총 {count}개의 게시물',
        noPosts: '아직 게시물이 없습니다',
        writeFirstPost: '첫 번째 게시물을 작성해보세요!',
        loginToVote: '로그인 후 투표 가능',
        loginToComment: '로그인 후 댓글을 작성해보세요!',
        noComments: '아직 댓글이 없습니다',
        writeComment: '댓글을 작성해주세요...',
        replyTo: '님에게 답글...',
        reply: '답글',
        cancel: '취소',
        submitComment: '댓글 작성',
        submitReply: '답글 작성',
        writing: '작성 중...',
        comments: '댓글 {count}개',
        views: '조회 {count}',
        likes: '추천 {count}',
        dislikes: '비추천 {count}',
        timeAgo: {
          now: '방금 전',
          minutes: '{count}분 전',
          hours: '{count}시간 전',
          yesterday: '어제',
          days: '{count}일 전'
        },
        errors: {
          loadPostsFailed: '게시물을 불러오는데 실패했습니다',
          loadGalleriesFailed: '갤러리를 불러오는데 실패했습니다',
          unknownError: '알 수 없는 오류가 발생했습니다'
        },
        loginRequired: '로그인이 필요합니다',
        loginRequiredDescription: '이 서비스를 이용하려면 먼저 로그인해주세요.',
        loginButton: '로그인하기'
      }
    },

    // 주제별 게시판 섹션
    freeboard: {
      allPosts: '전체 게시글',
      notice: '공지사항',
      freeBoard: '주제별 게시판',
      survey: '설문조사',
      latest: '최신순',
      popular: '인기순',
      likes: '좋아요',
      comments: '댓글',
      searchPlaceholder: '게시글을 검색하세요...',
      writePost: '게시글 작성',
      writePostDescription: '새로운 게시글을 작성해보세요',
      titlePlaceholder: '제목을 입력하세요',
      postType: '게시글 유형',
      normalPost: '일반 게시글',
      surveyTips: '설문조사 작성 팁',
      surveyTip1: '명확한 질문을 작성하세요',
      surveyTip2: '선택지를 다양하게 제공하세요',
      surveyTip3: '결과를 공유해보세요',
      surveyOptions: '선택지',
      loadingPosts: '게시글을 불러오는 중...',
      retry: '다시 시도',
      noPosts: '게시글이 없습니다',
      author: '작성자',
      createdAt: '작성일',
      views: '조회수'
    },

    // 충전소 탭
    chargingTab: {
      search: {
        noResults: '검색 결과가 없습니다',
        adjustFilters: '필터를 조정해보세요',
        resetFilters: '필터 초기화'
      },
      coupons: {
        title: 'AKO 쿠폰',
        subtitle: '화상채팅를 위한 AKO를 구매하세요',
        unit: '개',
        perUnit: '개당',
        minutes: '분',
        buyNow: '지금 구매',
        popular: '인기',
        discount: '할인'
      },
      vip: {
        title: 'VIP 멤버십',
        subtitle: '특별한 혜택을 누려보세요',
        warning: '주의',
        monthly: '월간',
        yearly: '연간',
        period: '기간',
        periodYear: '기간 (연간)',
        monthlySavings: '월간 절약',
        monthlyLevel: '월간 레벨',
        subscribe: '구독하기',
        details: '상세 정보',
        mostPopular: '가장 인기',
        features: {
          beautyFilter: '뷰티 필터',
          communityBadge: '커뮤니티 배지',
          adRemoval: '광고 제거',
          simultaneousInterpretation: '동시 통역'
        },
        featureDescriptions: {
          beautyFilter: '화상채팅에서 자연스러운 뷰티 필터를 사용하세요',
          communityBadge: '커뮤니티에서 VIP 멤버임을 알리는 특별한 배지를 받으세요',
          adRemoval: '모든 광고를 제거하고 깔끔한 환경에서 이용하세요',
          simultaneousInterpretation: '실시간 동시 통역 서비스를 이용하세요'
        }
      }
    },

    // 이벤트 탭
    eventTab: {
      attendanceCheck: {
        specialEvents: {
          title: '특별 이벤트',
          localEvent: {
            title: '로컬 이벤트',
            description: '한국 여행 상품권을 받아보세요!',
            firstPrize: '1등',
            flightTicket: '항공권',
            guideService: '가이드 서비스',
            accommodation: '숙박',
            period: '기간'
          },
          koreanEvent: {
            title: '한국어 이벤트',
            description: '한국어 시험 응시료 지원',
            dele: 'DELE',
            flex: 'FLEX',
            examFeeSupport: '시험 응시료 지원'
          }
        }
      },
      
      // 포인트 시스템
      pointSystem: {
        title: '포인트 시스템 안내',
        earningMethods: {
          title: '포인트 획득 방법',
          subtitle: '커뮤니티 활동을 통해 포인트를 획득하세요! (하루 최대 +40점)',
          points: '+5점',
          questionWriting: {
            title: '질문 작성',
            description: '유의미한 질문을 올리면 포인트를 획득할 수 있어요',
            limit: '하루 최대 3개까지만 포인트 지급'
          },
          answerWriting: {
            title: '답변 작성',
            description: '다른 사용자의 질문에 도움이 되는 답변을 작성하세요',
            limit: '하루 최대 5개까지만 포인트 지급'
          },
          storyUpload: {
            title: '스토리 업로드',
            description: '일상 스토리를 공유하고 포인트를 획득하세요',
            limit: '하루 최대 2개까지만 포인트 지급'
          },
          receiveLikes: {
            title: '좋아요 받기',
            description: '다른 사용자로부터 좋아요를 받으면 포인트를 획득!',
            limit: '제한 없음'
          },
          warning: {
            title: '주의사항',
            message: '도배글, 스팸, 부적절한 내용은 오히려 계정 정지의 원인이 될 수 있습니다. 의미 있는 활동을 통해 포인트를 획득해주세요.'
          }
        },
        usage: {
          title: '포인트 사용처',
          subtitle: '포인트로 얻을 수 있는 특별한 혜택들',
          current: {
            title: '현재 진행 중',
            description: '누적 포인트 1등에게 비행기 티켓 지급!',
            detail: '매월 누적 포인트 1등 사용자에게 한국 왕복 항공권을 지급합니다!'
          },
          upcoming: {
            title: '준비 중',
            description: '포인트 상점에서 다양한 아이템 구매 가능',
            detail: '곧 포인트로 구매할 수 있는 다양한 아이템들이 준비될 예정입니다!'
          }
        },
        couponEvent: {
          title: '쿠폰 이벤트',
          subtitle: '누적 출석으로 쿠폰을 획득하세요!',
          attendanceReward: {
            title: '누적 출석 보상',
            progress: '누적 {current}/3일 출석',
            completion: '축하합니다! AKO 쿠폰 1개가 지급되었습니다!',
            tip: '출석체크 3번 완료 시마다 AKO 쿠폰을 받을 수 있어요!'
          },
          messages: {
            alreadyCompleted: '오늘은 이미 출석체크를 완료했습니다!',
            streakBroken: '연속 출석이 끊어졌습니다. 다시 시작해주세요!',
            completed: '출석체크 완료! 누적 {days}일째입니다.',
            congratulations: '축하합니다! AKO 쿠폰 1개가 지급되었습니다!'
          }
        }
      },
      pointRanking: {
        title: '포인트 랭킹',
        myRank: '내 순위',
        totalPoints: '총 포인트',
        rank: '순위',
        outOf: '중',
        users: '명',
        topRanking: '상위 랭킹',
        loading: '로딩 중...',
        noData: '랭킹 데이터가 없습니다',
        startActivity: '활동을 시작해보세요!'
      },
      points: '포인트',
      pointRules: {
        title: '포인트 규칙',
        subtitle: '포인트 획득 방법',
        description: '다양한 활동을 통해 포인트를 획득하세요',
        goToStore: '상점으로 이동'
      },
      rewardAchieved: '보상 달성!',
      pointsEarned: '획득한 포인트',
      rewardObtained: '보상 획득'
    },

    // 헤더
    header: {
      home: '홈',
      about: '소개',
      inquiry: '문의',
      partnership: '제휴 문의',
      startButton: '시작하기'
    },

    // 소개 페이지
    about: {
      introVideo: '소개 영상',
      introVideoTitle: 'AMIKO 소개 영상',
      companyDescription: 'Amigo(친구) + Korea',
      bridgeDescription: '이어주는 다리',
      closerDescription: 'A mí(나에게) Korea를 더 가깝게',
      greeting: '안녕하세요.',
      thankYou: 'Amiko를 찾아주셔서 감사합니다.',
      teamIntroduction: 'Amiko의 CTO 한상훈(Samuel), CMO 박겸(Pablo)입니다.',
      latinAmericaExperience: '저희는 여러 남미 국가에서 살며 그들의 문화와 사람들을 진심으로 사랑하게 되었습니다.',
      koreanInterest: '최근 한국의 다양한 매체를 통해 남미의 아름다움이 소개되면서, 많은 한국인들이 점차 지구 반대편의 매력적인 대륙에 대해 알아가고 있습니다.',
      culturalExchange: 'AMIKO에서 다양한 사람들과 교류하며\n새로운 세상을 경험하세요.',
      bridgePromise: '그래서 다짐했습니다. 한국과 남미를 이어주는 다리를 만들자.',
      platformDescription: 'Amiko는 화상 채팅과 커뮤니티 서비스를 기반으로, 철저히 검증된 멤버십을 통해 신뢰할 수 있는 플랫폼을 제공합니다.',
      communityVision: '단순한 소통을 넘어 한국의 트렌드, 패션, K-POP, 라이프스타일까지 공유할 수 있는 커뮤니티로 발전해 나가겠습니다.',
      finalMessage: 'Amiko를 통해 서로에게 가까이 다가가보세요.'
    },

    // 푸터
    footer: {
      bridgeDescription: '한국과 남미를 잇는 다리, AMIKO',
      officialSns: 'AMIKO 공식 SNS',
      support: '고객지원',
      help: '도움말',
      faq: '자주 묻는 질문',
      contact: '문의하기',
      feedback: '피드백',
      copyright: '© 2025 Amiko. 모든 권리 보유.',
      privacy: '개인정보처리방침',
      terms: '이용약관',
      cookies: '쿠키 정책'
    },

    // 개인정보처리방침
    privacy: {
      title: '개인정보처리방침',
      lastUpdated: '최종 수정일',
      lastUpdatedDate: '2025년 1월 17일',
      contactEmail: 'privacy@amiko.com',
      supportEmail: 'support@amiko.com',
      sections: {
        purpose: {
          title: '1. 개인정보의 처리 목적',
          content: 'Amiko는 다음의 목적을 위하여 개인정보를 처리합니다.',
          items: [
            '서비스 제공: 화상 채팅 및 커뮤니티 서비스 제공',
            '회원 관리: 회원 가입, 인증, 탈퇴 등 회원 관리',
            '고객 지원: 문의사항 응답 및 기술 지원',
            '마케팅: 서비스 개선 및 새로운 서비스 안내'
          ]
        },
        collection: {
          title: '2. 수집하는 개인정보 항목',
          content: 'Amiko는 서비스 제공을 위해 다음과 같은 개인정보를 수집합니다.',
          items: [
            '필수 정보: 이메일, 전화번호, 이름',
            '선택 정보: 프로필 사진, 관심사',
            '자동 수집: IP 주소, 접속 기록, 쿠키'
          ]
        },
        retention: {
          title: '3. 개인정보의 처리 및 보유 기간',
          content: '개인정보는 수집·이용에 관한 동의일로부터 회원 탈퇴 시까지 보유·이용됩니다.',
          items: [
            '회원 정보: 탈퇴 시 즉시 삭제',
            '서비스 이용 기록: 1년간 보관',
            '법적 의무 기록: 관련 법령에 따라 보관'
          ]
        },
        rights: {
          title: '4. 정보주체의 권리',
          content: '정보주체는 개인정보 처리에 대해 다음의 권리를 가집니다.',
          items: [
            '개인정보 처리 현황에 대한 열람 요구',
            '오류 등이 있을 경우 정정·삭제 요구',
            '처리정지 요구'
          ]
        },
        contactInfo: {
          title: '5. 개인정보 보호책임자',
          content: '개인정보 처리에 관한 업무를 총괄해서 책임지고, 개인정보 처리와 관련한 정보주체의 불만처리 및 피해구제 등을 위하여 아래와 같이 개인정보 보호책임자를 지정하고 있습니다.',
          items: [
            '개인정보 보호책임자: privacy@amiko.com',
            '고객지원: support@amiko.com',
            '운영시간: 월-금 09:00-18:00 (KST)'
          ]
        }
      }
    },

    // 서비스 이용약관
    terms: {
      title: '서비스 이용약관',
      lastUpdated: '최종 수정일',
      lastUpdatedDate: '2025년 1월 17일',
      contactEmail: 'legal@amiko.com',
      supportEmail: 'support@amiko.com',
      sections: {
        introduction: {
          title: '1. 서비스 소개',
          content: 'Amiko는 한국과 스페인 간의 문화 교류를 위한 화상 채팅 및 커뮤니티 서비스입니다.',
          services: {
            title: '제공 서비스',
            items: [
              'AI 화상 채팅: 실시간 번역과 함께하는 화상 채팅',
              '커뮤니티: 질문과 답변, 스토리 공유',
              '포인트 시스템: 서비스 이용을 위한 포인트 충전'
            ]
          }
        },
        effectiveness: {
          title: '2. 약관의 효력',
          content: '본 약관은 서비스 이용 시 즉시 효력을 발생합니다.',
          items: [
            '약관 변경 시 7일 전 공지',
            '중대한 변경 시 30일 전 공지',
            '이용자의 동의 없이 불리한 변경 불가'
          ]
        },
        membership: {
          title: '3. 회원 가입 및 관리',
          content: '회원 가입 시 다음 정보를 제공해야 합니다.',
          items: [
            '필수 정보: 이메일, 전화번호, 이름',
            '선택 정보: 프로필 사진, 관심사',
            '인증: 이메일 및 SMS 인증 필요'
          ]
        },
        service: {
          title: '4. 서비스 이용',
          content: 'Amiko는 화상 채팅 및 커뮤니티 서비스를 제공합니다.',
          prohibited: {
            title: '금지 행위',
            items: [
              '타인의 권리를 침해하는 행위',
              '불법적인 콘텐츠 게시',
              '서비스의 안정적 운영을 방해하는 행위',
              '스팸성 메시지 발송',
              '허위 정보 유포'
            ]
          }
        },
        liability: {
          title: '5. 책임의 한계',
          content: 'Amiko는 다음과 같은 경우 책임을 지지 않습니다.',
          items: [
            '이용자의 귀책사유로 인한 손해',
            '제3자가 제공한 정보의 정확성',
            '서비스 이용 중 발생한 개인적 손해',
            '통신망 장애로 인한 서비스 중단'
          ]
        },
        responsibility: {
          title: '6. 이용자의 책임',
          content: '이용자는 서비스 이용 시 다음 사항을 준수해야 합니다.',
          items: [
            '타인의 권리를 침해하지 않을 것',
            '불법적인 행위를 하지 않을 것',
            '서비스의 안정적 운영을 방해하지 않을 것'
          ]
        }
      }
    },

    // 쿠키 정책
    cookies: {
      title: '쿠키 정책',
      lastUpdated: '최종 수정일',
      lastUpdatedDate: '2025년 1월 17일',
      contactEmail: 'privacy@amiko.com',
      supportEmail: 'support@amiko.com',
      sections: {
        definition: {
          title: '1. 쿠키의 정의',
          content: '쿠키는 웹사이트가 사용자의 컴퓨터에 저장하는 작은 텍스트 파일입니다.',
          note: '쿠키는 개인을 식별할 수 있는 정보를 포함하지 않으며 컴퓨터에 해를 끼치지 않습니다.'
        },
        types: {
          title: '2. 쿠키의 종류',
          content: 'Amiko는 다음과 같은 종류의 쿠키를 사용합니다.',
          essential: {
            title: '필수 쿠키',
            content: '서비스의 기본 기능을 위해 필요한 쿠키입니다.',
            items: [
              '세션 관리: 로그인 상태 유지',
              '보안: CSRF 방지 및 보안 토큰',
              '기본 설정: 언어 및 지역 설정'
            ]
          },
          functional: {
            title: '기능 쿠키',
            content: '서비스의 편의 기능을 제공하는 쿠키입니다.',
            items: [
              '사용자 설정: 테마, 알림 설정',
              '편의 기능: 자동 로그인, 폼 데이터 저장',
              '개인화: 맞춤형 콘텐츠 추천'
            ]
          },
          analytics: {
            title: '분석 쿠키',
            content: '서비스 이용 현황을 분석하는 쿠키입니다.',
            items: [
              '사용 통계: 페이지 방문, 체류 시간',
              '성능 분석: 서비스 속도, 오류 분석',
              '개선 방향: 사용자 행동 패턴 분석'
            ]
          },
          marketing: {
            title: '마케팅 쿠키',
            content: '맞춤형 광고 및 마케팅을 위한 쿠키입니다.',
            items: [
              '광고 타겟팅: 관심사 기반 광고',
              '성과 측정: 광고 클릭, 전환율',
              '재마케팅: 방문한 페이지 기반 광고'
            ]
          }
        },
        management: {
          title: '3. 쿠키 관리',
          content: '사용자는 브라우저 설정을 통해 쿠키를 관리할 수 있습니다.',
          browser: {
            title: '브라우저 설정',
            items: [
              'Chrome: 설정 > 개인정보 보호 및 보안 > 쿠키',
              'Firefox: 설정 > 개인정보 보호 및 보안 > 쿠키',
              'Safari: 환경설정 > 개인정보 보호 > 쿠키',
              'Edge: 설정 > 쿠키 및 사이트 권한 > 쿠키'
            ]
          },
          service: {
            title: '서비스 내 설정',
            items: [
              '쿠키 동의 관리: 쿠키 설정 페이지에서 관리',
              '분석 쿠키: Google Analytics 설정에서 비활성화',
              '마케팅 쿠키: 광고 설정에서 비활성화'
            ]
          }
        },
        consent: {
          title: '4. 쿠키 동의',
          content: 'Amiko는 사용자의 동의를 받아 쿠키를 사용합니다.',
          procedure: {
            title: '동의 절차',
            items: [
              '최초 방문: 쿠키 동의 팝업 표시',
              '선택적 동의: 필수/선택 쿠키 구분',
              '동의 철회: 언제든지 설정에서 변경 가능'
            ]
          },
          legal: {
            title: '법적 근거',
            items: [
              '개인정보보호법: 개인정보 처리 동의',
              '정보통신망법: 쿠키 사용 고지',
              'GDPR: 유럽 개인정보 보호 규정'
            ]
          }
        },
        changes: {
          title: '5. 정책 변경',
          content: '쿠키 정책은 필요에 따라 변경될 수 있습니다.',
          items: [
            '변경 사전 공지: 7일 전 웹사이트 공지',
            '중요 변경: 30일 전 이메일 공지',
            '동의 재요청: 새로운 쿠키 사용 시'
          ]
        }
      }
    },

    // 문의 페이지
    inquiry: {
      heroTitle: '궁금한 점이 있으시면\n언제든지 연락주세요',
      heroSubtitle: 'AMIKO 팀이\n빠르고 정확하게\n답변드리겠습니다',
      title: '문의하기',
      subtitle: '궁금한 점이 있으시면 언제든지 연락주세요',
      submit: '문의하기',
      successTitle: '문의가 성공적으로 전송되었습니다!',
      successMessage: '빠른 시일 내에 답변드리겠습니다.',
      newInquiry: '새 문의하기',
      goToCommunity: '커뮤니티로 이동',
      inquiryType: '이런 것들 문의할 수 있습니다',
      selectInquiryType: '문의 유형을 선택하세요',
      priority: '우선순위',
      selectPriority: '우선순위를 선택하세요',
      subject: '제목',
      subjectPlaceholder: '문의 제목을 입력하세요',
      message: '내용',
      messagePlaceholder: '문의 내용을 자세히 입력해주세요',
      submitSuccessMessage: '문의가 성공적으로 전송되었습니다!',
      submitting: '전송 중...',
      submitInquiry: '문의 전송',
      loginRequired: '로그인이 필요합니다',
      submitFailed: '문의 전송에 실패했습니다',
      submitError: '문의 전송 중 오류가 발생했습니다',
      inquiryTypes: {
        bug: '버그 신고',
        feature: '기능 요청',
        general: '일반 문의',
        payment: '결제 문의',
        account: '계정 문의',
        other: '기타'
      },
      inquiryTypeDescriptions: {
        bug: '오류나 문제점을 신고합니다',
        feature: '새로운 기능을 요청합니다',
        general: '일반적인 질문이나 문의사항입니다',
        payment: '결제 관련 문의입니다',
        account: '계정 관련 문의입니다',
        other: '기타 문의사항입니다'
      },
      priorities: {
        low: '낮음',
        medium: '보통',
        high: '높음',
        urgent: '긴급'
      }
    },

    // 제휴 문의 페이지
    partnership: {
      title: '제휴 문의',
      subtitle: 'AMIKO와 함께 성장하세요',
      submit: '제휴 문의하기',
      benefitsTitle: '제휴 혜택',
      benefitsSubtitle: 'AMIKO와의 제휴로 얻을 수 있는 혜택들',
      partnershipInquiry: '제휴 문의하기',
      companyInfo: '회사 정보',
      companyName: '회사명',
      companyNamePlaceholder: '회사명을 입력하세요',
      submitError: '제휴 문의 전송 중 오류가 발생했습니다',
      networkError: '네트워크 오류가 발생했습니다',
      benefits: {
        brandExpansion: {
          title: '브랜드 확장',
          description: '한국과 남미 시장에서 브랜드 인지도를 높일 수 있습니다'
        },
        customerExpansion: {
          title: '고객 확장',
          description: '새로운 고객층과 시장에 접근할 수 있습니다'
        },
        revenueIncrease: {
          title: '매출 증대',
          description: '제휴를 통한 새로운 수익 창출 기회를 제공합니다'
        }
      }
    },

    // 테스트 탭
    tests: {
      title: '테스트',
      subtitle: '',
      description: '',
      categories: {
        all: '전체',
        personality: '성격',
        celebrity: '연예인',
        knowledge: '지식',
        fun: '재미'
      },
      noPosts: '테스트가 없습니다',
      beFirst: '첫 번째 테스트를 만들어보세요!',
      participants: '참여자',
      questions: '질문',
      minutes: '분',
      startTest: '테스트 시작',
      startButton: '테스트 시작',
      retakeTest: '다시 하기',
      shareResult: '결과 공유',
      myResults: '내 결과',
      question: '질문',
      of: '/',
      next: '다음',
      previous: '이전',
      submit: '제출',
      viewResult: '결과 보기',
      errorLoading: '테스트를 불러오는 중 오류가 발생했습니다',
      result: {
        title: '테스트 결과',
        yourType: '당신의 타입은',
        description: '결과 설명',
        shareText: '나는 {result} 타입! 당신은?'
      }
    },

    // 프로필 관련
    profile: {
      myProfile: '마이프로필',
      koreanLanguage: '한국어',
      koreanCulture: '한국문화',
      cooking: '요리',
      travel: '여행',
      music: '음악',
      consultation15min: '15분 상담',
      joinDate: '가입일',
      edit: '편집',
      name: '이름',
      spanishName: '스페인어 이름',
      spanishNamePlaceholder: '스페인어 이름을 입력하세요',
      noSpanishName: '스페인어 이름 없음',
      university: '대학교',
      major: '전공',
      year: '학년',
      selfIntroduction: '자기소개',
      interests: '관심사',
      myCoupons: '내 쿠폰',
      expirationDate: '만료일',
      noExpiration: '만료일 없음',
      purchaseHistory: '구매 내역'
    },

    // 마이탭 관련
    myTab: {
      fileSizeLimit: '파일 크기 제한 (5MB)',
      imageOnly: '이미지 파일만 업로드 가능',
      profileSaved: '프로필이 저장되었습니다',
      profileSaveFailed: '프로필 저장 실패',
      unknownError: '알 수 없는 오류',
      profileSaveError: '프로필 저장 중 오류가 발생했습니다',
      profileLoadFailed: '프로필을 불러올 수 없습니다',
      retry: '다시 시도',
      uploadedPhotos: '업로드된 사진',
      profilePhoto: '프로필 사진',
      addProfilePhoto: '프로필 사진 추가',
      photoSelectionTip: '사진을 클릭하여 대표 사진으로 설정하세요',
      korean: '한국인',
      local: '현지인',
      student: '학생',
      professional: '직장인',
      profileVerified: '인증됨',
      noName: '이름 없음',
      universityPlaceholder: '대학교를 입력하세요',
      noUniversity: '대학교 없음',
      majorPlaceholder: '전공을 입력하세요',
      noMajor: '전공 없음',
      occupation: '직업',
      occupationPlaceholder: '직업을 입력하세요',
      noOccupation: '직업 없음',
      company: '회사',
      companyPlaceholder: '회사를 입력하세요',
      noCompany: '회사 없음',
      gradePlaceholder: '학년을 선택하세요',
      grade1: '1학년',
      grade2: '2학년',
      grade3: '3학년',
      grade4: '4학년',
      graduate: '대학원',
      noGrade: '학년 없음',
      experience: '경력',
      experiencePlaceholder: '경력을 입력하세요',
      noExperience: '경력 없음',
      introductionPlaceholder: '자기소개를 입력하세요',
      noIntroduction: '자기소개 없음',
      noInterests: '관심사 없음',
      consultation15min2: '15분 상담 쿠폰 2장',
      completed: '완료',
      pending: '대기중',
      cancelled: '취소됨',
      notificationSettings: '알림 설정',
      webPushNotification: '웹 푸시 알림',
      webPushDescription: '브라우저를 통한 알림을 받습니다',
      emailNotification: '이메일 알림',
      emailDescription: '이메일을 통한 알림을 받습니다',
      marketingNotification: '마케팅 알림',
      marketingDescription: '마케팅 정보 및 이벤트 알림을 받습니다',
    },

    // 알림 관련
    notifications: {
      title: '알림',
      loadingNotifications: '알림을 불러오는 중...',
      noNewNotifications: '새로운 알림이 없습니다.',
      markAllAsRead: '모두 읽음',
      viewAllNotifications: '모든 알림 보기',
      verificationComplete: '인증 완료',
      verified: '인증완료',
      unverified: '인증필요',
      checking: '확인중',
      authRequired: '인증이 필요합니다',
      authRequiredDescription: '이 기능을 이용하려면 인증이 필요합니다. 인증센터로 이동하시겠습니까?',
      goToAuthCenter: '인증센터로 이동'
    },

    // 인증 페이지
    verification: {
      loginRequired: '로그인이 필요합니다',
      loginRequiredDescription: '인증을 위해 먼저 로그인해주세요.',
      loginButton: '로그인하기',
      title: '상세 인증',
      subtitle: '더 많은 기능을 이용하기 위해 추가 정보를 입력해주세요.',
      infoCollectionGuide: '정보 수집 안내',
      infoCollectionDescription: '아래 정보들은 매칭과 커뮤니티 활동에 활용됩니다.',
      publicInfo: '공개 정보',
      publicInfoDescription: '다른 사용자들에게 공개되는 정보입니다.',
      privateInfo: '비공개 정보',
      privateInfoDescription: '개인정보로 보호되며 공개되지 않습니다.',
      name: '이름',
      major: '전공',
      languageLevel: '언어 수준',
      interests: '관심사',
      introduction: '자기소개',
      phone: '전화번호',
      university: '대학교',
      studentId: '학번',
      occupation: '직업',
      experience: '경력',
      availableTime: '가능한 시간',
      basicInfoStep: '기본 정보',
      matchingStep: '매칭 정보',
      basicInfoDescription: '기본적인 개인 정보를 입력해주세요.',
      matchingDescription: '매칭에 필요한 정보를 입력해주세요.',
      userType: '사용자 유형',
      student: '학생',
      studentDescription: '대학교 재학 중인 학생',
      general: '일반인',
      generalDescription: '직장인 또는 기타',
      nationality: '국적',
      korean: '한국인',
      koreanDescription: '한국 국적을 가진 사용자',
      nonKorean: '외국인',
      nonKoreanDescription: '한국 외 국적을 가진 사용자',
      profilePhoto: '프로필 사진',
      profilePreview: '프로필 미리보기',
      selectPhoto: '사진 선택',
      photoRequirements: 'JPG, PNG 파일만 업로드 가능합니다.',
      namePlaceholder: '실명을 입력해주세요',
      phonePlaceholder: '010-1234-5678',
      universityPlaceholder: '대학교명을 입력해주세요',
      majorPlaceholder: '전공을 입력해주세요',
      gradePlaceholder: '학년을 선택해주세요',
      grade: '학년'
    },

    // 상점 탭
    storeTab: {
      title: '충전소',
      subtitle: 'AKO • VIP • 포인트',
      akoExplanation: '1 AKO = 1 화상채팅 (20분)',
      charging: {
        title: 'AKO 충전',
        subtitle: 'AKO를 충전하여 AI 화상 채팅을 즐기세요',
        chargeButton: '충전하기',
        popular: '인기',
        perUnit: '개당',
        minutes: '분',
        units: '개',
        freeAkoTitle: '무료 AKO 받는 방법',
        freeAkoDescription: 'AKO충전을 하지않아도 이벤트 탭에서 3번 출석체크하면 AKO를 받을 수 있습니다.<br />72시간마다 한번씩 무료로 한국인들과 영상통화를 즐겨보세요.'
      },
      vip: {
        title: 'VIP 구독',
        subtitle: '프리미엄 기능으로 더욱 특별한 Amiko를 경험하세요',
        monthly: '월간 구독',
        yearly: '연간 구독',
        popular: '인기',
        subscribe: '구독하기',
        save: '절약',
        features: {
          title: 'VIP 기능',
          beautyFilter: '뷰티필터',
          aiTranslation: 'AI동시통역기능',
          gameFunction: '영상 통화중 게임 기능'
        }
      },
      pointStore: {
        title: '포인트 상점',
        subtitle: '포인트로 다양한 아이템을 구매하세요',
        comingSoon: '준비중',
        points: '포인트',
        items: {
          pointShop: '포인트 상점',
          specialFeatures: '특별한 기능들',
          premiumItems: '프리미엄 아이템',
          newFeatures: '새로운 기능'
        },
        descriptions: {
          pointShop: '곧 다양한 아이템들이 준비될 예정이에요',
          specialFeatures: '더 많은 기능들이 준비 중이에요',
          premiumItems: '특별한 아이템들이 곧 출시될 예정이에요',
          newFeatures: '흥미로운 기능들이 준비 중이에요'
        }
      },
      pointStatus: {
        title: '내 포인트 현황',
        availablePoints: '사용 가능한 포인트',
        availablePointsDesc: '상점 구매용',
        totalPoints: '누적 포인트',
        totalPointsDesc: '랭킹/이벤트용'
      },
      pointCard: {
        title: 'AKO • VIP • 포인트',
        availableAKO: '사용 가능한 AKO',
        currentPoints: '현재 포인트'
      },
      items: {
        chatExtension: {
          name: '채팅 연장',
          description: '모든 멘토와 채팅 연장 (6시간)'
        },
        amikoMerchandise: {
          name: 'Amiko 굿즈',
          description: 'Amiko 브랜드 상품 (머그컵, 스티커 등)'
        },
        kBeautyTicket: {
          name: 'K-뷰티 체험권',
          description: '한국 뷰티 체험 및 제품'
        },
        specialEventTicket: {
          name: '특별 이벤트 참가권',
          description: '특별 이벤트 참가 기회'
        }
      },
      messages: {
        purchaseSuccess: '채팅 연장권을 구매했습니다! 6시간 동안 모든 멘토와 채팅할 수 있습니다.',
        insufficientPoints: '포인트가 부족합니다. 더 많은 포인트를 모아주세요!'
      },
      comingSoon: '준비 중',
      points: '포인트',
      buy: '구매',
      preparing: '준비 중',
      pointEarning: {
        title: '포인트 획득 방법',
        communityActivities: '커뮤니티 활동',
        videoCalls: '화상채팅'
      },
      footerMessage: '✨ 앞으로 더 많은 보상이 추가될 예정입니다! 포인트를 모아주세요 🙌'
    },

    // 스토리 설정
    storySettings: {
      globalSettings: {
        title: '스토리 설정',
        autoPublic: {
          label: '자동 공개',
          description: '업로드한 스토리를 자동으로 공개합니다'
        },
        showInProfile: {
          label: '프로필에 표시',
          description: '스토리를 프로필에서 볼 수 있도록 합니다'
        }
      },
      archiveSettings: {
        title: '저장소 설정',
        autoArchive: {
          label: '자동 저장',
          description: '지정된 시간 후 스토리를 자동으로 저장합니다'
        },
        archiveTiming: {
          label: '저장 타이밍',
          options: {
            '24': '24시간 후',
            '48': '48시간 후',
            '72': '72시간 후',
            '168': '1주일 후'
          }
        }
      },
      individualSettings: {
        title: '개별 스토리 설정',
        public: '공개',
        private: '비공개',
        delete: '삭제'
      }
    },

    // 피드백 페이지
    feedback: {
      title: '피드백',
      subtitle: 'AMIKO 서비스 개선을 위한 여러분의 소중한 의견을 기다립니다',
      sections: {
        guidelines: {
          title: '피드백 가이드라인',
          content: '효과적인 피드백을 위한 가이드라인입니다.',
          items: [
            '구체적이고 명확한 내용으로 작성해주세요',
            '개선 제안 시 이유와 근거를 함께 제시해주세요',
            '건설적이고 예의 바른 언어를 사용해주세요',
            '개인정보는 포함하지 말아주세요'
          ]
        },
        types: {
          title: '피드백 유형',
          content: '다음과 같은 피드백을 받고 있습니다.',
          bug: {
            title: '버그 신고',
            content: '서비스에서 발견한 오류나 문제점'
          },
          feature: {
            title: '기능 제안',
            content: '새로운 기능이나 개선 사항 제안'
          },
          ux: {
            title: '사용자 경험',
            content: '사용자 인터페이스 및 경험 개선 제안'
          },
          general: {
            title: '일반 피드백',
            content: '서비스 전반에 대한 의견 및 제안'
          }
        },
        submission: {
          title: '피드백 제출 방법',
          content: '피드백을 제출하는 방법입니다.',
          items: [
            '이메일: feedback@amiko.com',
            '문의 페이지를 통한 제출',
            '앱 내 피드백 기능 이용',
            '소셜 미디어를 통한 제출'
          ]
        },
        process: {
          title: '피드백 처리 과정',
          content: '제출된 피드백의 처리 과정입니다.',
          items: [
            '피드백 접수 및 검토',
            '개발팀 검토 및 우선순위 결정',
            '구현 가능성 평가',
            '개선 사항 반영 및 결과 공유'
          ]
        }
      }
    },

    // 도움말 페이지
    help: {
      title: '도움말',
      subtitle: 'AMIKO 서비스 이용에 도움이 되는 정보를 제공합니다',
      sections: {
        gettingStarted: {
          title: '시작하기',
          content: 'AMIKO 서비스를 처음 이용하시는 분들을 위한 가이드입니다.',
          items: [
            '회원가입 및 프로필 설정 방법',
            '서비스 이용 방법 및 기본 기능',
            '언어 설정 및 지역 설정',
            '계정 보안 설정 방법'
          ]
        },
        videoChat: {
          title: '화상채팅',
          content: '화상채팅 서비스 이용에 대한 도움말입니다.',
          items: [
            '화상채팅 시작 및 종료 방법',
            'AI 통역 기능 사용법',
            '화상채팅 중 문제 해결',
            '화상채팅 품질 개선 방법'
          ]
        },
        community: {
          title: '커뮤니티',
          content: '커뮤니티 서비스 이용에 대한 도움말입니다.',
          items: [
            '게시글 작성 및 관리 방법',
            '댓글 작성 및 답글 기능',
            '커뮤니티 규칙 및 가이드라인',
            '신고 및 차단 기능 사용법'
          ]
        },
        points: {
          title: '포인트 시스템',
          content: '포인트 시스템 이용에 대한 도움말입니다.',
          items: [
            '포인트 획득 방법',
            '포인트 사용 방법',
            '포인트 충전 및 결제',
            '포인트 내역 확인 방법'
          ]
        },
        troubleshooting: {
          title: '문제 해결',
          content: '자주 발생하는 문제들의 해결 방법입니다.',
          items: [
            '로그인 문제 해결',
            '화상채팅 연결 문제',
            '앱 성능 최적화',
            '기타 기술적 문제'
          ]
        }
      }
    },

    // FAQ 페이지
    faq: {
      title: '자주 묻는 질문',
      subtitle: 'AMIKO 서비스 이용 중 자주 묻는 질문과 답변입니다',
      totalQuestions: '총 {count}개',
      categories: {
        lounge: '라운지',
        videoChat: '화상채팅',
        meeting: '미팅',
        community: '커뮤니티',
        points: '포인트',
        account: '계정',
        technical: '기술 지원'
      },
      lounge: {
        whatDoWeDo: '라운지에서는 무엇을 할 수 있나요?',
        whatDoWeDoAnswer: '라운지에서는 다양한 주제에 대해 자유롭게 대화할 수 있습니다. 한국어 학습, 문화 교류, 일상 대화 등 다양한 주제로 소통할 수 있어요.',
        pointsAvailable: '라운지에서도 포인트를 받을 수 있나요?',
        pointsAvailableAnswer: '네, 라운지에서도 대화 참여 시 포인트를 받을 수 있습니다. 활발한 참여와 유용한 정보 공유 시 추가 포인트가 지급됩니다.',
        whenOpen: '라운지는 언제 열리나요?',
        whenOpenAnswer: '라운지는 24시간 언제든지 이용 가능합니다. 다만 활성 사용자가 많은 시간대에는 더 많은 대화 상대를 만날 수 있어요.',
        differentLanguages: '다른 언어로도 대화할 수 있나요?',
        differentLanguagesAnswer: '네, 한국어와 스페인어 모두 지원합니다. AI 통역 기능을 통해 서로 다른 언어를 사용하는 사용자들도 자연스럽게 대화할 수 있습니다.'
      },
      videoChat: {
        howToStart: '화상채팅은 어떻게 시작하나요?',
        howToStartAnswer: '메인 페이지의 화상채팅 탭에서 "채팅 시작" 버튼을 클릭하면 됩니다. 상대방이 연결되면 자동으로 화상채팅이 시작됩니다.',
        aiTranslation: 'AI 통역 기능은 어떻게 사용하나요?',
        aiTranslationAnswer: '화상채팅 중 실시간으로 상대방의 말을 번역해주는 기능입니다. 설정에서 켜고 끌 수 있으며, 한국어와 스페인어를 지원합니다.',
        connectionIssues: '화상채팅 연결에 문제가 있어요',
        connectionIssuesAnswer: '인터넷 연결을 확인하고, 브라우저를 새로고침해보세요. 문제가 지속되면 고객지원팀에 문의해주세요.'
      },
      meeting: {
        howToMeet: '미팅은 어떻게 시작하나요?',
        howToMeetAnswer: '메인 페이지의 미팅 탭에서 "미팅 시작" 버튼을 클릭하면 됩니다. 매칭이 완료되면 자동으로 미팅이 시작됩니다.',
        translationMode: '번역 모드는 어떻게 사용하나요?',
        translationModeAnswer: '미팅 중 실시간 번역 기능을 사용할 수 있습니다. 설정에서 번역 모드를 켜고 끌 수 있으며, 한국어와 스페인어를 지원합니다.',
        howToUseCoupons: '쿠폰은 어떻게 사용하나요?',
        howToUseCouponsAnswer: '미팅 연장이나 특별 기능 이용 시 쿠폰을 사용할 수 있습니다. 쿠폰은 자동으로 적용되며, 사용 가능한 쿠폰이 있을 때 자동으로 사용됩니다.'
      },
      community: {
        howToPost: '게시글은 어떻게 작성하나요?',
        howToPostAnswer: '커뮤니티 탭에서 "글쓰기" 버튼을 클릭하고 제목과 내용을 입력한 후 게시하면 됩니다. 이미지도 함께 업로드할 수 있어요.',
        categories: '게시글 카테고리는 어떻게 선택하나요?',
        categoriesAnswer: '게시글 작성 시 카테고리를 선택할 수 있습니다. 뷰티, 패션, 여행, 문화 등 다양한 카테고리 중에서 선택하세요.',
        moderation: '부적절한 게시글은 어떻게 신고하나요?',
        moderationAnswer: '게시글 우측 상단의 신고 버튼을 클릭하여 신고할 수 있습니다. 운영진이 검토 후 적절한 조치를 취합니다.',
        howToGetPoints: '커뮤니티에서 포인트는 어떻게 얻나요?',
        howToGetPointsAnswer: '게시글 작성, 댓글 작성, 좋아요 받기, 일일 출석체크 등을 통해 포인트를 얻을 수 있습니다. 품질 높은 콘텐츠일수록 더 많은 포인트를 받을 수 있어요.',
        dailyPointLimit: '일일 포인트 획득 제한이 있나요?',
        dailyPointLimitAnswer: '네, 일일 포인트 획득에는 제한이 있습니다. 게시글 작성은 하루 5개, 댓글 작성은 하루 20개까지 포인트를 받을 수 있습니다.',
        communityRules: '커뮤니티 이용 규칙이 있나요?',
        communityRulesAnswer: '네, 모든 사용자가 즐겁게 이용할 수 있도록 기본적인 이용 규칙이 있습니다. 타인을 존중하고, 스팸이나 부적절한 내용을 게시하지 않도록 해주세요.'
      },
      points: {
        howToEarn: '포인트는 어떻게 얻나요?',
        howToEarnAnswer: '화상채팅 참여, 게시글 작성, 댓글 작성, 출석체크 등 다양한 활동을 통해 포인트를 얻을 수 있습니다.',
        howToUse: '포인트는 어떻게 사용하나요?',
        howToUseAnswer: '포인트는 화상채팅 연장, VIP 구독, 특별 기능 이용 등에 사용할 수 있습니다. 상점에서 다양한 상품을 구매할 수 있어요.',
        expiration: '포인트는 만료되나요?',
        expirationAnswer: '포인트는 만료되지 않습니다. 다만 장기간 미사용 시 관리 목적으로 정리될 수 있으니 정기적으로 사용해주세요.'
      },
      account: {
        profileSetup: '프로필은 어떻게 설정하나요?',
        profileSetupAnswer: '내 프로필 탭에서 프로필 사진, 이름, 관심사 등을 설정할 수 있습니다. 완성된 프로필은 더 나은 매칭에 도움이 됩니다.',
        passwordChange: '비밀번호는 어떻게 변경하나요?',
        passwordChangeAnswer: '설정 > 계정 관리에서 비밀번호 변경이 가능합니다. 보안을 위해 정기적으로 비밀번호를 변경하는 것을 권장합니다.',
        accountDeletion: '계정을 삭제하고 싶어요',
        accountDeletionAnswer: '계정 삭제는 고객지원팀에 문의해주세요. 삭제 시 모든 데이터가 영구적으로 삭제되므로 신중히 결정해주세요.',
        whyVerificationNeeded: '왜 인증이 필요한가요?',
        whyVerificationNeededAnswer: '인증은 서비스의 안전성과 신뢰성을 보장하기 위해 필요합니다. 인증된 사용자만 화상채팅과 미팅 기능을 이용할 수 있습니다.',
        verificationMethods: '인증 방법은 어떤 것들이 있나요?',
        verificationMethodsAnswer: '전화번호 인증, 이메일 인증, 소셜 로그인 인증 등 다양한 방법으로 인증할 수 있습니다. 가장 간단한 방법은 전화번호 인증입니다.',
        verificationFailed: '인증에 실패했어요',
        verificationFailedAnswer: '인증 코드를 다시 확인해보시고, 문제가 지속되면 고객지원팀에 문의해주세요. 네트워크 연결이나 입력 오류를 확인해보세요.'
      },
      technical: {
        browserSupport: '어떤 브라우저를 지원하나요?',
        browserSupportAnswer: 'Chrome, Firefox, Safari, Edge 등 최신 브라우저를 지원합니다. 최신 버전 사용을 권장합니다.',
        mobileSupport: '모바일에서도 이용할 수 있나요?',
        mobileSupportAnswer: '네, 모바일 브라우저에서도 이용 가능합니다. 앱과 유사한 경험을 위해 PWA 기능도 지원합니다.',
        performanceIssues: '앱이 느려요',
        performanceIssuesAnswer: '브라우저 캐시를 삭제하고, 불필요한 탭을 닫아보세요. 문제가 지속되면 고객지원팀에 문의해주세요.'
      },
      moreQuestions: '더 궁금한 점이 있으신가요?',
      moreQuestionsDescription: '위에서 답을 찾지 못하셨다면 언제든지 문의해주세요. 빠르고 정확한 답변을 드리겠습니다.',
      emailInquiry: '이메일 문의',
      customerService: '고객지원팀'
    },

    // 연락처 페이지
    contact: {
      title: '연락처',
      subtitle: 'AMIKO 팀과 직접 연락하실 수 있습니다',
      sections: {
        info: {
          title: '연락처 정보',
          email: {
            title: '이메일',
            content: 'info@amiko.com'
          },
          hours: {
            title: '운영 시간',
            content: '월요일 - 금요일, 09:00 - 18:00 (KST)'
          }
        },
        types: {
          title: '문의 유형',
          content: '다음과 같은 문의를 받고 있습니다.',
          technical: {
            title: '기술 지원',
            content: '서비스 이용 중 발생하는 기술적 문제'
          },
          billing: {
            title: '결제 문의',
            content: '결제 및 환불 관련 문의'
          },
          general: {
            title: '일반 문의',
            content: '서비스 이용 및 정책 관련 문의'
          },
          partnership: {
            title: '제휴 문의',
            content: '비즈니스 제휴 및 협력 관련 문의'
          }
        },
        response: {
          title: '응답 시간',
          content: '문의 유형에 따른 응답 시간입니다.',
          items: [
            '기술 지원: 24시간 이내',
            '결제 문의: 12시간 이내',
            '일반 문의: 48시간 이내',
            '제휴 문의: 72시간 이내'
          ]
        }
      }
    }
  },
  
  es: {
    // 헤더
    landingPage: 'Página de Inicio',
    start: 'Comenzar',
    lounge: 'Sala',
    korean: '한국어',
    spanish: 'Español',
    changeToSpanish: 'Cambiar a Español',
    changeToKorean: '한국어로 변경',
    selectLanguage: 'Seleccionar idioma',
    language: 'es',
    
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
      login: 'Iniciar sesión',
      uploading: 'Subiendo...',
      saving: 'Guardando...',
      writing: 'Escribiendo...',
      deleting: 'Eliminando...',
      retry: 'Reintentar',
      required: 'Requerido'
    },

    // 인증 관련
    auth: {
      forgotPassword: 'Recuperar contraseña',
      signUp: 'Registrarse',
      signIn: 'Iniciar sesión',
      signInDescription: 'Inicia sesión en tu cuenta para acceder a todas las funciones de Amiko',
      signUpDescription: 'Únete a Amiko para comenzar a aprender coreano e intercambiar culturas',
      signingIn: 'Iniciando sesión...',
      signingUp: 'Registrándose...',
      emailOrPhone: 'Correo electrónico o teléfono',
      emailOrPhonePlaceholder: 'Ingresa tu correo electrónico o número de teléfono',
      password: 'Contraseña',
      passwordPlaceholder: 'Ingresa tu contraseña',
      confirmPassword: 'Confirmar contraseña',
      confirmPasswordPlaceholder: 'Ingresa tu contraseña nuevamente',
      name: 'Nombre',
      namePlaceholder: 'Ingresa tu nombre',
      email: 'Correo electrónico',
      emailPlaceholder: 'ejemplo@email.com',
      phone: 'Teléfono',
      country: 'País',
      countryCode: 'Código de país',
      selectCountry: 'Selecciona un país',
      nationality: 'Nacionalidad',
      selectNationality: 'Selecciona tu nacionalidad',
      nextStep: 'Siguiente paso',
      checking: 'Verificando...',
      countries: {
        KR: 'Corea del Sur',
        MX: 'México',
        CO: 'Colombia',
        AR: 'Argentina',
        PE: 'Perú',
        VE: 'Venezuela',
        CL: 'Chile',
        EC: 'Ecuador',
        GT: 'Guatemala',
        HN: 'Honduras',
        NI: 'Nicaragua',
        PA: 'Panamá',
        PY: 'Paraguay',
        UY: 'Uruguay',
        BO: 'Bolivia',
        CR: 'Costa Rica',
        DO: 'República Dominicana',
        SV: 'El Salvador',
        CU: 'Cuba',
        PR: 'Puerto Rico',
        BR: 'Brasil',
        US: 'Estados Unidos',
        CA: 'Canadá',
        JP: 'Japón',
        CN: 'China',
        GB: 'Reino Unido',
        FR: 'Francia',
        DE: 'Alemania',
        AU: 'Australia',
        SG: 'Singapur'
      },
      passwordMinLength: 'Mínimo 8 caracteres',
      passwordHasNumber: 'Incluir números',
      passwordHasSpecial: 'Incluir caracteres especiales',
      passwordNoRepeated: 'Sin caracteres repetidos',
      passwordMismatch: 'Las contraseñas no coinciden',
      signUpSuccess: '¡Registro completado exitosamente!',
      signUpFailed: 'El registro falló',
      signUpError: 'Ocurrió un error durante el registro',
      alreadyHaveAccount: '¿Ya tienes una cuenta?',
      noAccount: '¿No tienes cuenta?',
      credentialsCheckMessage: 'Por favor verifica tu correo electrónico/teléfono y contraseña',
      verifying: 'Verificando autenticación...',
      pleaseWait: 'Por favor espere.',
      checkingVerificationStatus: 'Verificando estado de autenticación...',
      verificationStatusError: 'Ocurrió un error al verificar el estado de autenticación.',
      
      // 이메일/SMS 인증
      emailVerification: 'Verificación por correo electrónico',
      smsVerification: 'Verificación por teléfono',
      verificationCode: 'Código de verificación',
      verificationCodePlaceholder: 'Ingresa el código de verificación de 6 dígitos',
      sendVerificationCode: 'Enviar código de verificación',
      resendCode: 'Reenviar código de verificación',
      codeSent: 'El código de verificación ha sido enviado',
      codeExpired: 'El código de verificación ha expirado',
      invalidCode: 'Código de verificación inválido',
      verificationSuccess: 'Verificación completada',
      
      // 지문 인증
      biometricLogin: 'Inicio de sesión rápido con huella dactilar',
      biometricSetup: 'Configurar autenticación biométrica',
      biometricExplanation: '¿Te gustaría iniciar sesión más rápido con tu huella dactilar?',
      biometricSafe: 'La información biométrica se almacena solo en el dispositivo y no se envía al servidor',
      biometricSkip: 'Configurar más tarde',
      biometricEnable: 'Configurar autenticación biométrica',
      biometricNotSupported: 'Este dispositivo no soporta autenticación biométrica',
      
      // 검증 절차 설명
      verificationNeeded: '¿Por qué es necesario el proceso de verificación?',
      verificationReason1: 'Para protegernos mutuamente: Solo usuarios verificados pueden participar en la comunidad, manteniendo un entorno seguro',
      verificationReason2: 'Comunidad confiable: Verificamos que todos los usuarios sean personas reales para prevenir cuentas falsas',
      verificationReason3: 'Protección de datos personales: Solo usuarios verificados pueden acceder a la información de otros usuarios',
      verificationSteps: 'Guía del proceso de verificación',
      step1Title: 'Verificación por correo electrónico',
      step1Desc: 'Verificamos que la dirección de correo electrónico sea realmente utilizable',
      step2Title: 'Verificación por teléfono',
      step2Desc: 'Enviamos un código de verificación por SMS para confirmar que eres un usuario real',
      step3Title: 'Completar perfil',
      step3Desc: 'Escribe tu presentación e intereses para participar en la comunidad',
      
      // 세션 관련
      sessionUpdateFailed: 'Error al actualizar la sesión',
      sessionExpired: 'La sesión ha expirado',
      sessionInvalid: 'Sesión inválida',
      sessionRefreshFailed: 'Error al renovar la sesión'
    },

    // Hero 슬라이드
    heroSlides: {
      slide1: {
        badge: 'Comunidad Global',
        title: 'Global Community',
        subtitle: 'Aprende coreano y experimenta la cultura',
        description: 'Construyamos juntos con Amiko',
        startButton: 'Comenzar'
      },
      slide2: {
        badge: 'Con IA de interpretación integrada en Amiko',
        title: 'Comunícate por videollamada',
        subtitle: 'Los tutores coreanos verificados\nestán contigo',
        description: 'A través del sistema de videollamadas 1:1 de nuestra propia plataforma y\nservicio de interpretación IA, puedes intercambiar culturas y\nidiomas de manera fluida y conveniente.',
        experience1: '¿Has usado aplicaciones de chat de video para conocer personas con una buena imagen de los países de cada uno?',
        experience2: '¿Quizás esa experiencia te decepcionó?',
        experience3: 'Amiko te ofrece una buena experiencia a través de tutores coreanos verificados y un sistema de calificaciones.'
      },
      slide3: {
        subtitle: 'Comunícate con el otro lado del mundo.',
        title: 'Servicio de Comunidad Amiko',
        description: 'Amiko es un puente que conecta el otro lado del mundo. Acércate más a las culturas mutuas a través de la comunidad.',
        cards: {
          topicBoard: {
            title: 'Foro por Temas',
            description: 'Comunícate libremente sobre diversos temas.'
          },
          koreanNews: {
            title: 'Noticias Coreanas',
            description: 'Consulta las últimas noticias y tendencias de Corea.'
          },
          story: {
            title: 'Historia',
            description: 'Comparte tu vida diaria y conversa sobre la vida cotidiana.'
          },
          koreanTest: {
            title: 'Test de Personalidad Coreana',
            description: ''
          }
        },
        startButton: {
          title: 'Comenzar',
          subtitle: 'Únete a AMIKO ahora mismo'
        }
      }
    },


    // 헤더 네비게이션
    headerNav: {
      home: 'Inicio',
      videoCall: 'Video',
      community: 'Chat',
      chargingStation: 'Estación de Carga',
      chargingStationShort: 'Carga',
      event: 'Eventos',
      logout: 'Cerrar Sesión',
      store: 'Tienda',
      storeShort: 'Tienda',
      worldTime: 'Hora Mundial',
      countries: {
        korea: 'Corea',
        mexico: 'México',
        peru: 'Perú',
        colombia: 'Colombia'
      }
    },

    // 메인 페이지
    mainPage: {
      title: 'Disfruta de diversas formas',
      videoCall: 'Videollamada',
      videoCallDescription: 'Participa en las actividades de la comunidad y habla con el coreano que quieras usando AKO.',
      community: 'Comunidad',
      communityDescription: 'Conócete unos a otros a través de la comunidad\ny comunícate',
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

    // 홈 탭
    homeTab: {
      community: 'Comunidad',
      openingOctober: 'Apertura programada para octubre'
    },

    // 메인 화상채팅 섹션
    main: {
      meet: 'AI Videollamada',
      meetDescription: 'Conoce a coreanos reales a través de videollamadas',
      community: 'Comunidad',
      communityDescription: '',
      me: 'Mi Perfil',
      meDescription: 'Revisa tu historial de actividad y puntos'
    },

    // 화상채팅 페이지
    videoCall: {
      title: 'Chat de Video IA',
      subtitle: 'Conoce a coreanos reales a través de videollamadas',
      description: 'Crea nuevas experiencias a través del intercambio de idiomas y experiencias culturales',
      quickStart: 'Inicio Rápido',
      quickStartDescription: 'Comienza una videollamada ahora mismo',
      startCall: 'Iniciar Llamada',
      oneOnOne: 'Conversación 1:1',
      oneOnOneDescription: 'Habla personalmente con coreanos\ny aprende el idioma',
      languageExchange: 'Intercambio de Idiomas',
      languageExchangeDescription: 'Enseña y aprende idiomas mutuamente\nmientras te comunicas',
      sessionTime: 'Tiempo de Sesión',
      sessionTimeDescription: 'Conversa durante 20 minutos\ny extiende el tiempo si es necesario',
      partners: 'Compañeros de Conversación',
      onlyKoreans: 'Solo Coreanos',
      enterChannelName: 'Ingresa el nombre del canal',
      channelName: 'Nombre del Canal',
      channelShareTip: 'Comparte el nombre del canal con amigos para conversar juntos',
      viewInfo: 'Ver Información',
      startConversation: 'Iniciar Conversación',
      offline: 'Desconectado',
      noPartnersTitle: 'No hay compañeros',
      noPartnersDescription: 'Actualmente no hay compañeros registrados. Pronto se agregarán nuevos compañeros.'
    },

    // 커뮤니티 탭
    communityTab: {
      story: 'Historia',
      uploadStory: 'Subir Historia',
      noStories: 'No hay historias',
      uploadFirstStory: '¡Sube tu primera historia!',
      searchQuestions: 'Buscar Publicaciones',
      askQuestion: 'Escribir',
      categories: {
        all: 'Todos',
        beauty: 'Belleza',
        fashion: 'Moda',
        travel: 'Viajes',
        culture: 'Cultura',
        free: 'Libre'
      }
    },

    // 커뮤니티 섹션
    community: {
      qa: 'P&R',
      freeBoard: 'Tablero por Temas',
      koreanNews: 'Noticias de Corea',
      freeBoardDescription: '',
      koreanNewsDescription: '',
      qaDescription: '',
      loadingNews: 'Cargando noticias...',
      backToHome: 'Anterior',
      viewMoreNews: 'Ver más noticias de Corea',
      categories: {
        all: 'Todas las Publicaciones',
        free: 'Foro Libre',
        kpop: 'Foro K-POP',
        kdrama: 'Foro K-Drama',
        beauty: 'Belleza',
        korean: 'Coreano',
        spanish: 'Español'
      },
      noPosts: 'No hay publicaciones disponibles',
      beFirstToWrite: '¡Sé el primero en escribir una publicación!',
      sortBy: 'Ordenar por:',
      sortOptions: {
        latest: 'Más Recientes',
        popular: 'Más Populares',
        views: 'Más Vistos'
      },
      writePost: 'Escribir',
      galleryList: {
        title: 'Galerías',
        subtitle: '',
        beauty: 'Galería de Belleza',
        fashion: 'Galería de Moda',
        travel: 'Galería de Viajes',
        culture: 'Galería de Cultura',
        food: 'Galería de Comida',
        language: 'Galería de Idioma',
        free: 'Galería de Temas Libres',
        daily: 'Galería de Vida Diaria',
        writePost: 'Escribir',
        latest: 'Más Reciente',
        popular: 'Más Popular',
        hot: 'Más Caliente',
        mostCommented: 'Más Comentado',
        mostViewed: 'Más Visto',
        all: 'Todo',
        today: 'Hoy',
        week: 'Esta Semana',
        month: 'Este Mes',
        withImages: 'Con Imágenes',
        textOnly: 'Solo Texto',
        pinned: 'Fijado',
        hotPosts: 'Caliente',
        popularPosts: 'Popular',
        searchPlaceholder: 'Buscar por título, contenido...',
        search: 'Buscar',
        clear: 'Limpiar',
        advancedFilters: 'Filtros Avanzados',
        simpleView: 'Vista Simple',
        clearFilters: 'Limpiar Filtros',
        appliedFilters: 'Filtros Aplicados',
        sort: 'Ordenar',
        period: 'Período',
        type: 'Tipo',
        status: 'Estado',
        quickAccess: 'Acceso Rápido',
        totalPosts: '{count} publicaciones en total',
        noPosts: 'Aún no hay publicaciones',
        writeFirstPost: '¡Escribe la primera publicación!',
        loginToVote: 'Inicia sesión para votar',
        loginToComment: '¡Inicia sesión para escribir comentarios!',
        noComments: 'Aún no hay comentarios',
        writeComment: 'Escribe un comentario...',
        replyTo: 'Responder a {name}...',
        reply: 'Responder',
        cancel: 'Cancelar',
        submitComment: 'Enviar Comentario',
        submitReply: 'Enviar Respuesta',
        writing: 'Escribiendo...',
        comments: '{count} comentarios',
        views: '{count} vistas',
        likes: '{count} me gusta',
        dislikes: '{count} no me gusta',
        timeAgo: {
          now: 'Ahora',
          minutes: 'Hace {count} minutos',
          hours: 'Hace {count} horas',
          yesterday: 'Ayer',
          days: 'Hace {count} días'
        },
        errors: {
          loadPostsFailed: 'Error al cargar las publicaciones',
          loadGalleriesFailed: 'Error al cargar las galerías',
          unknownError: 'Ocurrió un error desconocido'
        },
        loginRequired: 'Se requiere iniciar sesión',
        loginRequiredDescription: 'Para usar este servicio, primero debe iniciar sesión.',
        loginButton: 'Iniciar sesión'
      }
    },

    // 주제별 게시판 섹션
    freeboard: {
      allPosts: 'Todas las Publicaciones',
      notice: 'Avisos',
      freeBoard: 'Tablero por Temas',
      survey: 'Encuestas',
      latest: 'Más Recientes',
      popular: 'Más Populares',
      likes: 'Me Gusta',
      comments: 'Comentarios',
      searchPlaceholder: 'Buscar publicaciones...',
      writePost: 'Escribir Publicación',
      writePostDescription: 'Escribe una nueva publicación',
      titlePlaceholder: 'Ingresa el título',
      postType: 'Tipo de Publicación',
      normalPost: 'Publicación Normal',
      surveyTips: 'Consejos para Encuestas',
      surveyTip1: 'Escribe preguntas claras',
      surveyTip2: 'Proporciona opciones diversas',
      surveyTip3: 'Comparte los resultados',
      surveyOptions: 'Opciones',
      loadingPosts: 'Cargando publicaciones...',
      retry: 'Reintentar',
      noPosts: 'No hay publicaciones',
      author: 'Autor',
      createdAt: 'Fecha de Creación',
      views: 'Vistas'
    },

    // 충전소 탭
    chargingTab: {
      search: {
        noResults: 'No hay resultados de búsqueda',
        adjustFilters: 'Ajusta los filtros',
        resetFilters: 'Restablecer Filtros'
      },
      coupons: {
        title: 'Cupones AKO',
        subtitle: 'Compra AKO para videollamadas',
        unit: 'unidad',
        perUnit: 'por unidad',
        minutes: 'minutos',
        buyNow: 'Comprar Ahora',
        popular: 'Popular',
        discount: 'Descuento'
      },
      vip: {
        title: 'Membresía VIP',
        subtitle: 'Disfruta de beneficios especiales',
        warning: 'Advertencia',
        monthly: 'Mensual',
        yearly: 'Anual',
        period: 'Período',
        periodYear: 'Período (Anual)',
        monthlySavings: 'Ahorro Mensual',
        monthlyLevel: 'Nivel Mensual',
        subscribe: 'Suscribirse',
        details: 'Detalles',
        mostPopular: 'Más Popular',
        features: {
          beautyFilter: 'Filtro de Belleza',
          communityBadge: 'Insignia de Comunidad',
          adRemoval: 'Eliminación de Anuncios',
          simultaneousInterpretation: 'Interpretación Simultánea'
        },
        featureDescriptions: {
          beautyFilter: 'Usa filtros de belleza naturales en videollamadas',
          communityBadge: 'Recibe una insignia especial que muestra que eres miembro VIP',
          adRemoval: 'Elimina todos los anuncios y disfruta de un entorno limpio',
          simultaneousInterpretation: 'Usa servicios de interpretación simultánea en tiempo real'
        }
      }
    },

    // 이벤트 탭
    eventTab: {
      attendanceCheck: {
        specialEvents: {
          title: 'Eventos Especiales',
          localEvent: {
            title: 'Evento Local',
            description: '¡Recibe un boleto de viaje a Corea!',
            firstPrize: 'Primer Lugar',
            flightTicket: 'Boleto de Avión',
            guideService: 'Servicio de Guía',
            accommodation: 'Alojamiento',
            period: 'Período'
          },
          koreanEvent: {
            title: 'Evento de Coreano',
            description: 'Apoyo para tarifas de examen de coreano',
            dele: 'DELE',
            flex: 'FLEX',
            examFeeSupport: 'Apoyo para Tarifa de Examen'
          }
        }
      },
      
      // 포인트 시스템
      pointSystem: {
        title: 'Guía del Sistema de Puntos',
        earningMethods: {
          title: 'Métodos para Obtener Puntos',
          subtitle: '¡Obtén puntos a través de actividades comunitarias! (Máximo +40 puntos por día)',
          points: '+5 puntos',
          questionWriting: {
            title: 'Escribir Pregunta',
            description: 'Puedes obtener puntos publicando preguntas significativas',
            limit: 'Máximo 3 por día para obtener puntos'
          },
          answerWriting: {
            title: 'Escribir Respuesta',
            description: 'Escribe respuestas útiles a las preguntas de otros usuarios',
            limit: 'Máximo 5 por día para obtener puntos'
          },
          storyUpload: {
            title: 'Subir Historia',
            description: 'Comparte historias diarias y obtén puntos',
            limit: 'Máximo 2 por día para obtener puntos'
          },
          receiveLikes: {
            title: 'Recibir Me Gusta',
            description: '¡Obtén puntos cuando recibas me gusta de otros usuarios!',
            limit: 'Sin límite'
          },
          warning: {
            title: 'Advertencia',
            message: 'Publicaciones spam, spam o contenido inapropiado pueden resultar en suspensión de cuenta. Por favor, obtén puntos a través de actividades significativas.'
          }
        },
        usage: {
          title: 'Uso de Puntos',
          subtitle: 'Beneficios especiales que puedes obtener con puntos',
          current: {
            title: 'En Progreso',
            description: '¡Boleto de avión para el usuario con más puntos acumulados!',
            detail: '¡Se otorga un boleto de avión de ida y vuelta a Corea mensualmente al usuario con más puntos acumulados!'
          },
          upcoming: {
            title: 'Preparando',
            description: 'Compra varios artículos en la tienda de puntos',
            detail: '¡Pronto estarán disponibles varios artículos que se pueden comprar con puntos!'
          }
        },
        couponEvent: {
          title: 'Evento de Cupones',
          subtitle: '¡Obtén cupones con asistencia acumulada!',
          attendanceReward: {
            title: 'Recompensa de Asistencia Acumulada',
            progress: 'Asistencia acumulada {current}/3 días',
            completion: '¡Felicidades! Se ha otorgado 1 cupón AKO!',
            tip: '¡Puedes recibir un cupón AKO cada vez que completes 3 asistencias!'
          },
          messages: {
            alreadyCompleted: 'Ya completaste la verificación de asistencia hoy!',
            streakBroken: 'La asistencia continua se ha interrumpido. ¡Por favor, comienza de nuevo!',
            completed: 'Verificación de asistencia completada! Día {days} acumulado.',
            congratulations: '¡Felicidades! Se ha otorgado 1 cupón AKO!'
          }
        }
      },
      pointRanking: {
        title: 'Ranking de Puntos',
        myRank: 'Mi Ranking',
        totalPoints: 'Puntos Totales',
        rank: 'Ranking',
        outOf: 'de',
        users: 'usuarios',
        topRanking: 'Top Ranking',
        loading: 'Cargando...',
        noData: 'No hay datos de ranking',
        startActivity: '¡Comienza a participar!'
      },
      points: 'puntos',
      pointRules: {
        title: 'Reglas de Puntos',
        subtitle: 'Cómo Ganar Puntos',
        description: 'Gana puntos a través de diversas actividades',
        goToStore: 'Ir a la Tienda'
      },
      rewardAchieved: '¡Recompensa Lograda!',
      pointsEarned: 'Puntos Ganados',
      rewardObtained: 'Recompensa Obtenida'
    },

    // 헤더
    header: {
      home: 'Inicio',
      about: 'Acerca de',
      inquiry: 'Consultas',
      partnership: 'Consultas de Alianza',
      startButton: 'Comenzar'
    },

    // 소개 페이지
    about: {
      introVideo: 'Video de Introducción',
      introVideoTitle: 'Video de Introducción de AMIKO',
      companyDescription: 'Amigo(amigo) + Korea',
      bridgeDescription: 'Puente que conecta entre AMerica y KOrea',
      closerDescription: 'A mí(para mí) Korea más cerca',
      greeting: '¡Hola!',
      thankYou: 'Gracias por visitar Amiko.',
      teamIntroduction: 'Somos Han Sang-hoon (Samuel), CTO de Amiko,\ny Park Gyeom (Pablo), CMO de Amiko.',
      latinAmericaExperience: 'Hemos vivido en varios países de América del Sur y hemos llegado a amar sinceramente sus culturas y personas.',
      koreanInterest: 'Recientemente, a medida que la belleza de América del Sur se ha introducido a través de varios medios coreanos, muchos coreanos están aprendiendo gradualmente sobre este atractivo continente al otro lado del mundo.',
      culturalExchange: 'En AMIKO, interactúa con diversas personas y\nexperimenta un nuevo mundo.',
      bridgePromise: 'Así que nos comprometimos. Construyamos un puente que conecte Corea del Sur y América del Sur.',
      platformDescription: 'Amiko proporciona una plataforma confiable basada en videollamadas y servicios comunitarios, a través de membresías completamente verificadas.',
      communityVision: 'Evolucionaremos hacia una comunidad donde podamos compartir no solo comunicación simple, sino también tendencias coreanas, moda, K-POP e incluso estilo de vida.',
      finalMessage: 'Acérquense unos a otros a través de Amiko.'
    },

    // 푸터
    footer: {
      bridgeDescription: 'Puente entre Corea del Sur y América del Sur, AMIKO',
      officialSns: 'SNS Oficial de AMIKO',
      support: 'Soporte al Cliente',
      help: 'Ayuda',
      faq: 'Preguntas Frecuentes',
      contact: 'Contactar',
      feedback: 'Comentarios',
      copyright: '© 2025 Amiko. Todos los derechos reservados.',
      privacy: 'Política de Privacidad',
      terms: 'Términos de Uso',
      cookies: 'Política de Cookies'
    },

    // 개인정보처리방침
    privacy: {
      lastUpdated: 'Última actualización',
      contactEmail: 'privacy@amiko.com',
      supportEmail: 'support@amiko.com',
      title: 'Política de Privacidad',
      lastUpdatedDate: '17 de enero de 2025',
      sections: {
        purpose: {
          title: '1. Propósito de recolección y uso de información personal',
          content: 'Amiko recolecta y utiliza información personal para los siguientes propósitos:',
          items: [
            'Registro y gestión de miembros: Identificación de usuarios del servicio, verificación de identidad, confirmación de intención de registro',
            'Provisión de servicios: Aprendizaje de coreano, intercambio cultural, provisión de servicios de videollamadas',
            'Soporte al cliente: Procesamiento de consultas, recolección de retroalimentación para mejora del servicio',
            'Seguridad y seguridad: Prevención de uso indebido, garantía de estabilidad del servicio',
            'Marketing: Provisión de servicios personalizados, notificación de información de eventos (con consentimiento)'
          ]
        },
        collection: {
          title: '2. Información personal recolectada',
          content: 'Amiko recolecta la siguiente información personal:',
          items: [
            'Información de registro: Nombre, correo electrónico, número de teléfono',
            'Información de perfil: Edad, género, intereses, nivel de idioma',
            'Información de uso: Historial de uso del servicio, tiempo de conexión',
            'Información de dispositivo: Dirección IP, tipo de dispositivo, sistema operativo'
          ]
        },
        retention: {
          title: '3. Período de retención y uso de información personal',
          content: 'Amiko retiene y utiliza información personal durante el siguiente período:',
          items: [
            'Información de registro: Hasta la retirada del servicio',
            'Información de perfil: Hasta la retirada del servicio',
            'Información de uso: 3 años desde la última actividad',
            'Información de dispositivo: 1 año desde la última conexión'
          ]
        },
        rights: {
          title: '4. Derechos del titular de la información personal',
          content: 'Los usuarios tienen los siguientes derechos:',
          items: [
            'Derecho de acceso: Solicitar acceso a información personal',
            'Derecho de rectificación: Solicitar corrección de información personal',
            'Derecho de eliminación: Solicitar eliminación de información personal',
            'Derecho de limitación: Solicitar limitación del procesamiento de información personal'
          ]
        },
        contactInfo: {
          title: '5. Contacto para consultas sobre información personal',
          content: 'Para consultas sobre información personal, contacte:',
          items: [
            'Correo electrónico: privacy@amiko.com',
            'Soporte al cliente: support@amiko.com',
            'Horario de atención: Lunes a Viernes, 9:00 - 18:00 (KST)'
          ]
        }
      }
    },

    // 서비스 이용약관
    terms: {
      lastUpdated: 'Última actualización',
      contactEmail: 'legal@amiko.com',
      supportEmail: 'support@amiko.com',
      title: 'Términos de Servicio',
      lastUpdatedDate: '17 de enero de 2025',
      sections: {
        introduction: {
          title: 'Artículo 1 (Introducción del servicio)',
          content: 'Amiko es una plataforma de intercambio de idiomas e intercambio cultural que conecta Corea del Sur y América del Sur.',
          services: {
            title: 'Servicios principales',
            items: [
              'Videollamadas: Intercambio de idiomas a través de videollamadas 1:1 con coreanos',
              'Comunidad: Comunidad para compartir cultura coreana, K-POP, estilo de vida',
              'Sistema de puntos: Acumulación y uso de puntos según actividades',
              'Eventos: Varios eventos de experiencia cultural coreana'
            ]
          }
        },
        effectiveness: {
          title: 'Artículo 2 (Efectividad y cambios de términos)',
          content: 'Estos términos se aplican a todos los usuarios que utilizan el servicio.',
          items: [
            'Los términos pueden ser modificados con notificación previa de 7 días',
            'Los usuarios pueden retirarse del servicio en cualquier momento',
            'El uso continuado del servicio después de los cambios constituye aceptación de los nuevos términos'
          ]
        },
        membership: {
          title: 'Artículo 3 (Registro y gestión de miembros)',
          content: 'Para utilizar el servicio, debe registrarse como miembro.',
          items: [
            'Registro: Proporcionar información personal precisa',
            'Verificación: Verificación de identidad a través de número de teléfono',
            'Gestión: Mantener información de cuenta actualizada',
            'Retiro: Proceso de retiro disponible en cualquier momento'
          ]
        },
        service: {
          title: 'Artículo 4 (Uso del servicio)',
          content: 'Los usuarios deben usar el servicio de acuerdo con estos términos.',
          prohibited: {
            title: 'Actividades prohibidas',
            items: [
              'Actividades ilegales o que violen las leyes',
              'Actividades que dañen a otros usuarios',
              'Actividades comerciales no autorizadas',
              'Actividades que interfieran con el funcionamiento del servicio'
            ]
          }
        },
        liability: {
          title: 'Artículo 5 (Limitación de responsabilidad)',
          content: 'Amiko no será responsable de los siguientes daños:',
          items: [
            'Daños causados por uso indebido del servicio',
            'Daños causados por problemas de red o sistema',
            'Daños causados por terceros',
            'Daños indirectos o consecuenciales'
          ]
        }
      }
    },

    // 쿠키 정책
    cookies: {
      lastUpdated: 'Última actualización',
      contactEmail: 'privacy@amiko.com',
      supportEmail: 'support@amiko.com',
      title: 'Política de Cookies',
      lastUpdatedDate: '17 de enero de 2025',
      sections: {
        definition: {
          title: '1. ¿Qué son las cookies?',
          content: 'Las cookies son pequeños archivos de texto que los sitios web almacenan en la computadora o dispositivo móvil del usuario. Amiko utiliza las siguientes cookies para proporcionar servicios:',
          note: 'Las cookies no contienen información que pueda identificar a una persona y no dañan la computadora.'
        },
        types: {
          title: '2. Cookies utilizadas por Amiko',
          essential: {
            title: 'Cookies esenciales',
            content: 'Necesarias para el funcionamiento básico del servicio',
            items: [
              'Cookies de sesión: Mantenimiento de sesión de usuario',
              'Cookies de seguridad: Prevención de uso indebido',
              'Cookies de configuración: Configuración de preferencias del usuario'
            ]
          },
          functional: {
            title: 'Cookies funcionales',
            content: 'Mejoran la funcionalidad del servicio',
            items: [
              'Cookies de idioma: Recordar preferencia de idioma',
              'Cookies de tema: Recordar configuración de tema',
              'Cookies de ubicación: Servicios basados en ubicación'
            ]
          },
          analytics: {
            title: 'Cookies de análisis',
            content: 'Recopilan información sobre el uso del servicio',
            items: [
              'Google Analytics: Análisis de tráfico del sitio web',
              'Cookies de rendimiento: Medición del rendimiento del servicio',
              'Cookies de error: Recopilación de información de errores'
            ]
          },
          marketing: {
            title: 'Cookies de marketing',
            content: 'Utilizadas para publicidad personalizada',
            items: [
              'Cookies de publicidad: Publicidad dirigida',
              'Cookies de seguimiento: Seguimiento de conversiones',
              'Cookies de redes sociales: Integración con redes sociales'
            ]
          }
        },
        management: {
          title: '3. Gestión de cookies',
          content: 'Los usuarios pueden gestionar las cookies de las siguientes maneras:',
          browser: {
            title: 'Configuración del navegador',
            items: [
              'Chrome: Configuración > Privacidad y seguridad > Cookies',
              'Firefox: Opciones > Privacidad y seguridad > Cookies',
              'Safari: Preferencias > Privacidad > Cookies',
              'Edge: Configuración > Cookies y permisos del sitio'
            ]
          },
          service: {
            title: 'Configuración del servicio',
            items: [
              'Centro de configuración: Gestión de preferencias de cookies',
              'Consentimiento granular: Consentimiento por tipo de cookie',
              'Retiro de consentimiento: Retiro en cualquier momento',
              'Configuración de privacidad: Configuración detallada de privacidad'
            ]
          }
        },
        consent: {
          title: '4. Consentimiento para uso de cookies',
          content: 'Amiko solicita consentimiento para el uso de cookies de la siguiente manera:',
          procedure: {
            title: 'Procedimiento de consentimiento',
            items: [
              'Primera visita: Notificación y solicitud de consentimiento para uso de cookies',
              'Consentimiento selectivo: Consentimiento individual para cookies esenciales/funcionales/análisis/marketing',
              'Cambio de configuración: Posibilidad de retirar consentimiento y cambiar configuración en cualquier momento',
              'Registro de consentimiento: Almacenamiento y gestión del historial de consentimiento/retiro'
            ]
          },
          legal: {
            title: 'Base legal',
            items: [
              'Cookies esenciales: Interés legítimo para provisión de servicios',
              'Cookies funcionales: Consentimiento del usuario',
              'Cookies de análisis: Consentimiento del usuario',
              'Cookies de marketing: Consentimiento explícito del usuario'
            ]
          }
        },
        changes: {
          title: '5. Cambios en la política de cookies',
          content: 'Amiko puede cambiar esta política de cookies cuando sea necesario.',
          items: [
            'Notificación: Notificación de cambios con 7 días de anticipación',
            'Consentimiento: Nuevo consentimiento para cambios significativos',
            'Historial: Mantenimiento del historial de cambios',
            'Contacto: Notificación de cambios por correo electrónico'
          ]
        }
      }
    },

    // FAQ 페이지
    faq: {
      title: 'Preguntas Frecuentes',
      subtitle: 'Preguntas y respuestas frecuentes sobre el uso del servicio AMIKO',
      totalQuestions: 'Total {count}',
      categories: {
        lounge: 'Sala',
        videoChat: 'Videollamadas',
        meeting: 'Reunión',
        community: 'Comunidad',
        points: 'Puntos',
        account: 'Cuenta',
        technical: 'Soporte Técnico'
      },
      lounge: {
        whatDoWeDo: '¿Qué puedo hacer en la sala?',
        whatDoWeDoAnswer: 'En la sala puedes conversar libremente sobre diversos temas. Puedes comunicarte sobre aprendizaje de coreano, intercambio cultural, conversaciones cotidianas y más.',
        pointsAvailable: '¿También puedo recibir puntos en la sala?',
        pointsAvailableAnswer: 'Sí, también puedes recibir puntos al participar en conversaciones en la sala. Se otorgan puntos adicionales por participación activa y compartir información útil.',
        whenOpen: '¿Cuándo está abierta la sala?',
        whenOpenAnswer: 'La sala está disponible las 24 horas del día. Sin embargo, puedes encontrar más compañeros de conversación durante las horas de mayor actividad.',
        differentLanguages: '¿Puedo conversar en otros idiomas?',
        differentLanguagesAnswer: 'Sí, soportamos tanto coreano como español. A través de la función de traducción AI, los usuarios que hablan diferentes idiomas pueden conversar naturalmente.'
      },
      videoChat: {
        howToStart: '¿Cómo inicio una videollamada?',
        howToStartAnswer: 'Haz clic en el botón "Iniciar Chat" en la pestaña de videollamadas de la página principal. La videollamada comenzará automáticamente cuando se conecte la otra persona.',
        aiTranslation: '¿Cómo uso la función de traducción AI?',
        aiTranslationAnswer: 'Es una función que traduce en tiempo real lo que dice la otra persona durante la videollamada. Puedes activarla y desactivarla en la configuración, y soporta coreano y español.',
        connectionIssues: 'Tengo problemas de conexión en videollamadas',
        connectionIssuesAnswer: 'Verifica tu conexión a internet y actualiza el navegador. Si el problema persiste, contacta al equipo de soporte al cliente.'
      },
      meeting: {
        howToMeet: '¿Cómo inicio una reunión?',
        howToMeetAnswer: 'Haz clic en el botón "Iniciar Reunión" en la pestaña de reuniones de la página principal. La reunión comenzará automáticamente cuando se complete el emparejamiento.',
        translationMode: '¿Cómo uso el modo de traducción?',
        translationModeAnswer: 'Puedes usar la función de traducción en tiempo real durante las reuniones. Puedes activar y desactivar el modo de traducción en la configuración, y soporta coreano y español.',
        howToUseCoupons: '¿Cómo uso los cupones?',
        howToUseCouponsAnswer: 'Puedes usar cupones para extender reuniones o usar funciones especiales. Los cupones se aplican automáticamente y se usan automáticamente cuando hay cupones disponibles.'
      },
      community: {
        story: 'Historia',
        howToPost: '¿Cómo escribo una publicación?',
        howToPostAnswer: 'Haz clic en el botón "Escribir" en la pestaña de comunidad, ingresa el título y contenido, luego publica. También puedes subir imágenes.',
        categories: '¿Cómo selecciono la categoría de la publicación?',
        categoriesAnswer: 'Puedes seleccionar una categoría al escribir la publicación. Elige entre diversas categorías como belleza, moda, viajes, cultura, etc.',
        moderation: '¿Cómo reporto una publicación inapropiada?',
        moderationAnswer: 'Puedes reportar haciendo clic en el botón de reporte en la esquina superior derecha de la publicación. El equipo de moderación revisará y tomará las medidas apropiadas.',
        howToGetPoints: '¿Cómo obtengo puntos en la comunidad?',
        howToGetPointsAnswer: 'Puedes obtener puntos escribiendo publicaciones, comentarios, recibiendo likes, asistencia diaria, etc. Cuanto mayor sea la calidad del contenido, más puntos puedes recibir.',
        dailyPointLimit: '¿Hay límite diario para obtener puntos?',
        dailyPointLimitAnswer: 'Sí, hay límites para obtener puntos diariamente. Puedes recibir puntos por escribir publicaciones hasta 5 por día y comentarios hasta 20 por día.',
        communityRules: '¿Hay reglas para usar la comunidad?',
        communityRulesAnswer: 'Sí, hay reglas básicas de uso para que todos los usuarios puedan disfrutar. Respeta a otros y no publiques spam o contenido inapropiado.'
      },
      points: {
        howToEarn: '¿Cómo obtengo puntos?',
        howToEarnAnswer: 'Puedes obtener puntos a través de diversas actividades como participar en videollamadas, escribir publicaciones, comentar, asistencia diaria, etc.',
        howToUse: '¿Cómo uso los puntos?',
        howToUseAnswer: 'Los puntos se pueden usar para extender videollamadas, suscripción VIP, usar funciones especiales, etc. Puedes comprar diversos productos en la tienda.',
        expiration: '¿Los puntos expiran?',
        expirationAnswer: 'Los puntos no expiran. Sin embargo, pueden ser organizados por motivos de gestión si no se usan por mucho tiempo, así que úsalos regularmente.'
      },
      account: {
        profileSetup: '¿Cómo configuro mi perfil?',
        profileSetupAnswer: 'Puedes configurar foto de perfil, nombre, intereses, etc. en la pestaña de mi perfil. Un perfil completo ayuda con mejores coincidencias.',
        passwordChange: '¿Cómo cambio mi contraseña?',
        passwordChangeAnswer: 'Puedes cambiar tu contraseña en Configuración > Gestión de cuenta. Se recomienda cambiar la contraseña regularmente por seguridad.',
        accountDeletion: 'Quiero eliminar mi cuenta',
        accountDeletionAnswer: 'Contacta al equipo de soporte al cliente para eliminar tu cuenta. Ten en cuenta que todos los datos se eliminarán permanentemente al eliminar la cuenta.',
        whyVerificationNeeded: '¿Por qué es necesaria la verificación?',
        whyVerificationNeededAnswer: 'La verificación es necesaria para garantizar la seguridad y confiabilidad del servicio. Solo los usuarios verificados pueden usar las funciones de videollamadas y reuniones.',
        verificationMethods: '¿Qué métodos de verificación hay?',
        verificationMethodsAnswer: 'Puedes verificar tu cuenta a través de verificación por teléfono, email, inicio de sesión social, etc. El método más simple es la verificación por teléfono.',
        verificationFailed: 'Falló la verificación',
        verificationFailedAnswer: 'Verifica nuevamente el código de verificación, y si el problema persiste, contacta al equipo de soporte al cliente. Verifica la conexión de red o errores de entrada.'
      },
      technical: {
        browserSupport: '¿Qué navegadores soportan?',
        browserSupportAnswer: 'Soportamos navegadores modernos como Chrome, Firefox, Safari, Edge, etc. Se recomienda usar la versión más reciente.',
        mobileSupport: '¿También puedo usarlo en móvil?',
        mobileSupportAnswer: 'Sí, también está disponible en navegadores móviles. También soportamos funciones PWA para una experiencia similar a una aplicación.',
        performanceIssues: 'La aplicación es lenta',
        performanceIssuesAnswer: 'Elimina la caché del navegador y cierra pestañas innecesarias. Si el problema persiste, contacta al equipo de soporte al cliente.'
      },
      moreQuestions: '¿Tienes más preguntas?',
      moreQuestionsDescription: 'Si no encontraste la respuesta arriba, no dudes en contactarnos. Te daremos una respuesta rápida y precisa.',
      emailInquiry: 'Consulta por Email',
      customerService: 'Equipo de Soporte al Cliente'
    },

    // 문의 페이지
    inquiry: {
      heroTitle: 'Si tienes alguna pregunta,\ncontáctanos en cualquier momento',
      heroSubtitle: 'El equipo AMIKO\nte responderá\nrápida y precisamente',
      title: 'Consultas',
      subtitle: 'Si tienes alguna pregunta, contáctanos en cualquier momento',
      submit: 'Enviar Consulta',
      successTitle: '¡Tu consulta se envió exitosamente!',
      successMessage: 'Te responderemos lo antes posible.',
      newInquiry: 'Nueva Consulta',
      goToCommunity: 'Ir a la Comunidad',
      inquiryType: 'Puedes consultar sobre estas cosas',
      selectInquiryType: 'Selecciona el tipo de consulta',
      priority: 'Prioridad',
      selectPriority: 'Selecciona la prioridad',
      subject: 'Asunto',
      subjectPlaceholder: 'Ingresa el asunto de la consulta',
      message: 'Contenido',
      messagePlaceholder: 'Por favor ingresa el contenido de la consulta en detalle',
      submitSuccessMessage: '¡Tu consulta se envió exitosamente!',
      submitting: 'Enviando...',
      submitInquiry: 'Enviar Consulta',
      loginRequired: 'Se requiere inicio de sesión',
      submitFailed: 'Error al enviar la consulta',
      submitError: 'Ocurrió un error al enviar la consulta',
      inquiryTypes: {
        bug: 'Reporte de Error',
        feature: 'Solicitud de Función',
        general: 'Consulta General',
        payment: 'Consulta de Pago',
        account: 'Consulta de Cuenta',
        other: 'Otros'
      },
      inquiryTypeDescriptions: {
        bug: 'Reporta errores o problemas',
        feature: 'Solicita nuevas funciones',
        general: 'Preguntas o consultas generales',
        payment: 'Consultas relacionadas con pagos',
        account: 'Consultas relacionadas con la cuenta',
        other: 'Otras consultas'
      },
      priorities: {
        low: 'Baja',
        medium: 'Media',
        high: 'Alta',
        urgent: 'Urgente'
      }
    },

    // 제휴 문의 페이지
    partnership: {
      title: 'Consulta de Asociación',
      subtitle: 'Crece junto con AMIKO',
      submit: 'Enviar Consulta de Asociación',
      benefitsTitle: 'Beneficios de Asociación',
      benefitsSubtitle: 'Beneficios que puedes obtener con la asociación de AMIKO',
      partnershipInquiry: 'Enviar Consulta de Asociación',
      companyInfo: 'Información de la Empresa',
      companyName: 'Nombre de la Empresa',
      companyNamePlaceholder: 'Ingresa el nombre de la empresa',
      submitError: 'Ocurrió un error al enviar la consulta de asociación',
      networkError: 'Ocurrió un error de red',
      benefits: {
        brandExpansion: {
          title: 'Expansión de Marca',
          description: 'Aumenta el reconocimiento de tu marca en el mercado coreano y latinoamericano'
        },
        customerExpansion: {
          title: 'Expansión de Clientes',
          description: 'Accede a nuevos segmentos de clientes y mercados'
        },
        revenueIncrease: {
          title: 'Aumento de Ingresos',
          description: 'Ofrece nuevas oportunidades de generación de ingresos a través de la asociación'
        }
      }
    },

    // 테스트 탭
    tests: {
      title: 'Tests',
      subtitle: 'Descubre más sobre ti con tests divertidos',
      description: 'Descubre más sobre ti con tests de personalidad',
      categories: {
        all: 'Todo',
        personality: 'Personalidad',
        celebrity: 'Celebridad',
        knowledge: 'Conocimiento',
        fun: 'Diversión'
      },
      noPosts: 'No hay tests disponibles',
      beFirst: '¡Sé el primero en crear un test!',
      participants: 'Participantes',
      questions: 'Preguntas',
      minutes: 'min',
      startTest: 'Iniciar Test',
      startButton: 'Iniciar Test',
      retakeTest: 'Repetir',
      shareResult: 'Compartir Resultado',
      myResults: 'Mis Resultados',
      question: 'Pregunta',
      of: 'de',
      next: 'Siguiente',
      previous: 'Anterior',
      submit: 'Enviar',
      viewResult: 'Ver Resultado',
      errorLoading: 'Error al cargar los tests',
      result: {
        title: 'Resultado del Test',
        yourType: 'Tu tipo es',
        description: 'Descripción del resultado',
        shareText: '¡Soy tipo {result}! ¿Y tú?'
      }
    },

    // 프로필
    profile: {
      myProfile: 'Mi Perfil',
      koreanLanguage: 'Idioma Coreano',
      koreanCulture: 'Cultura Coreana',
      cooking: 'Cocina',
      travel: 'Viajes',
      music: 'Música',
      consultation15min: 'Consulta de 15 min',
      joinDate: 'Fecha de Registro',
      edit: 'Editar',
      name: 'Nombre',
      spanishName: 'Nombre en Español',
      spanishNamePlaceholder: 'Ingresa tu nombre en español',
      noSpanishName: 'Sin nombre en español',
      university: 'Universidad',
      major: 'Carrera',
      year: 'Año',
      selfIntroduction: 'Autopresentación',
      interests: 'Intereses',
      myCoupons: 'Mis Cupones',
      expirationDate: 'Fecha de Vencimiento',
      noExpiration: 'Sin Vencimiento',
      purchaseHistory: 'Historial de Compras'
    },

    // 마이탭 관련
    myTab: {
      fileSizeLimit: 'Límite de tamaño de archivo (5MB)',
      imageOnly: 'Solo archivos de imagen',
      profileSaved: 'Perfil guardado',
      profileSaveFailed: 'Error al guardar perfil',
      unknownError: 'Error desconocido',
      profileSaveError: 'Error al guardar el perfil',
      profileLoadFailed: 'No se pudo cargar el perfil',
      retry: 'Reintentar',
      uploadedPhotos: 'Fotos subidas',
      profilePhoto: 'Foto de perfil',
      addProfilePhoto: 'Agregar foto de perfil',
      photoSelectionTip: 'Haz clic en una foto para establecerla como foto principal',
      korean: 'Coreano',
      local: 'Local',
      student: 'Estudiante',
      professional: 'Profesional',
      profileVerified: 'Verificado',
      noName: 'Sin nombre',
      universityPlaceholder: 'Ingresa tu universidad',
      noUniversity: 'Sin universidad',
      majorPlaceholder: 'Ingresa tu carrera',
      noMajor: 'Sin carrera',
      occupation: 'Ocupación',
      occupationPlaceholder: 'Ingresa tu ocupación',
      noOccupation: 'Sin ocupación',
      company: 'Empresa',
      companyPlaceholder: 'Ingresa tu empresa',
      noCompany: 'Sin empresa',
      gradePlaceholder: 'Selecciona tu año',
      grade1: '1er año',
      grade2: '2do año',
      grade3: '3er año',
      grade4: '4to año',
      graduate: 'Posgrado',
      noGrade: 'Sin año',
      experience: 'Experiencia',
      experiencePlaceholder: 'Ingresa tu experiencia',
      noExperience: 'Sin experiencia',
      introductionPlaceholder: 'Ingresa tu autopresentación',
      noIntroduction: 'Sin autopresentación',
      noInterests: 'Sin intereses',
      consultation15min2: 'Cupones de consulta de 15 min x2',
      completed: 'Completado',
      pending: 'Pendiente',
      cancelled: 'Cancelado',
      notificationSettings: 'Configuración de Notificaciones',
      webPushNotification: 'Notificaciones Push Web',
      webPushDescription: 'Recibe notificaciones a través del navegador',
      emailNotification: 'Notificaciones por Email',
      emailDescription: 'Recibe notificaciones por email',
      marketingNotification: 'Notificaciones de Marketing',
      marketingDescription: 'Recibe información de marketing y notificaciones de eventos',
    },

    // Notifications
    notifications: {
      title: 'Notificaciones',
      loadingNotifications: 'Cargando notificaciones...',
      noNewNotifications: 'No hay notificaciones nuevas.',
      markAllAsRead: 'Marcar todo como leído',
      viewAllNotifications: 'Ver todas las notificaciones',
      verificationComplete: 'Verificación completada',
      verified: 'Verificado',
      unverified: 'Verificación requerida',
      checking: 'Verificando',
      authRequired: 'Se requiere autenticación',
      authRequiredDescription: 'Se requiere autenticación para usar esta función. ¿Desea ir al centro de autenticación?',
      goToAuthCenter: 'Ir al centro de autenticación'
    },

    // 인증 페이지
    verification: {
      loginRequired: 'Se requiere iniciar sesión',
      loginRequiredDescription: 'Por favor inicie sesión primero para la verificación.',
      loginButton: 'Iniciar sesión',
      title: 'Verificación Detallada',
      subtitle: 'Por favor ingrese información adicional para usar más funciones.',
      infoCollectionGuide: 'Guía de Recopilación de Información',
      infoCollectionDescription: 'La siguiente información se utiliza para emparejamiento y actividades comunitarias.',
      publicInfo: 'Información Pública',
      publicInfoDescription: 'Información que se muestra a otros usuarios.',
      privateInfo: 'Información Privada',
      privateInfoDescription: 'Información personal protegida que no se muestra públicamente.',
      name: 'Nombre',
      major: 'Carrera',
      languageLevel: 'Nivel de Idioma',
      interests: 'Intereses',
      introduction: 'Introducción Personal',
      phone: 'Teléfono',
      university: 'Universidad',
      studentId: 'ID de Estudiante',
      occupation: 'Ocupación',
      experience: 'Experiencia',
      availableTime: 'Tiempo Disponible',
      basicInfoStep: 'Información Básica',
      matchingStep: 'Información de Emparejamiento',
      basicInfoDescription: 'Por favor ingrese información personal básica.',
      matchingDescription: 'Por favor ingrese información necesaria para el emparejamiento.',
      userType: 'Tipo de Usuario',
      student: 'Estudiante',
      studentDescription: 'Estudiante universitario actual',
      general: 'General',
      generalDescription: 'Empleado u otros',
      nationality: 'Nacionalidad',
      korean: 'Coreano',
      koreanDescription: 'Usuario con nacionalidad coreana',
      nonKorean: 'Extranjero',
      nonKoreanDescription: 'Usuario con nacionalidad no coreana',
      profilePhoto: 'Foto de Perfil',
      profilePreview: 'Vista Previa del Perfil',
      selectPhoto: 'Seleccionar Foto',
      photoRequirements: 'Solo se pueden subir archivos JPG, PNG.',
      namePlaceholder: 'Ingrese su nombre real',
      phonePlaceholder: '010-1234-5678',
      universityPlaceholder: 'Ingrese el nombre de la universidad',
      majorPlaceholder: 'Ingrese su carrera',
      gradePlaceholder: 'Seleccione su año académico',
      grade: 'Año Académico'
    },

    // 상점 탭
    storeTab: {
      title: 'Estación de Carga',
      subtitle: 'AKO • VIP • Puntos',
      akoExplanation: '1 AKO = 1 videollamada (20 minutos)',
      charging: {
        title: 'Carga AKO',
        subtitle: 'Carga AKO para disfrutar de videollamadas con IA',
        chargeButton: 'Cargar',
        popular: 'Popular',
        perUnit: 'por unidad',
        minutes: 'minutos',
        units: 'unidades',
        freeAkoTitle: 'Cómo obtener AKO gratis',
        freeAkoDescription: 'Puedes obtener AKO sin cargar, simplemente marcando asistencia 3 veces en la pestaña de eventos.<br />Disfruta de videollamadas gratuitas con coreanos cada 72 horas.'
      },
      vip: {
        title: 'Suscripción VIP',
        subtitle: 'Experimenta un Amiko más especial con funciones premium',
        monthly: 'Suscripción Mensual',
        yearly: 'Suscripción Anual',
        popular: 'Popular',
        subscribe: 'Suscribirse',
        save: 'Ahorrar',
        features: {
          title: 'Funciones VIP',
          beautyFilter: 'Filtro de Belleza',
          aiTranslation: 'Función de Interpretación Simultánea con IA',
          gameFunction: 'Función de Juegos durante Videollamadas'
        }
      },
      pointStore: {
        title: 'Tienda de Puntos',
        subtitle: 'Compra varios artículos con puntos',
        comingSoon: 'Próximamente',
        points: 'puntos',
        items: {
          pointShop: 'Tienda de Puntos',
          specialFeatures: 'Funciones Especiales',
          premiumItems: 'Artículos Premium',
          newFeatures: 'Nuevas Funciones'
        },
        descriptions: {
          pointShop: 'Pronto estarán disponibles varios artículos',
          specialFeatures: 'Más funciones están siendo preparadas',
          premiumItems: 'Artículos especiales estarán disponibles pronto',
          newFeatures: 'Funciones interesantes están siendo preparadas'
        }
      },
      pointStatus: {
        title: 'Mi estado de puntos',
        availablePoints: 'Puntos disponibles',
        availablePointsDesc: 'Para compras en la tienda',
        totalPoints: 'Puntos acumulados',
        totalPointsDesc: 'Para ranking/eventos'
      },
      pointCard: {
        title: 'AKO • VIP • Puntos',
        availableAKO: 'AKO Disponible',
        currentPoints: 'Puntos Actuales'
      },
      items: {
        chatExtension: {
          name: 'Extensión de chat',
          description: 'Extensión de chat con todos los mentores (6 horas)'
        },
        amikoMerchandise: {
          name: 'Productos Amiko',
          description: 'Productos de marca Amiko (tazas, pegatinas, etc.)'
        },
        kBeautyTicket: {
          name: 'Boleto de experiencia K-Beauty',
          description: 'Experiencia de belleza coreana y productos'
        },
        specialEventTicket: {
          name: 'Boleto de evento especial',
          description: 'Oportunidad de participar en eventos especiales'
        }
      },
      messages: {
        purchaseSuccess: '¡Extensión de chat comprada! Puedes chatear con todos los mentores durante 6 horas.',
        insufficientPoints: 'Puntos insuficientes. ¡Acumula más puntos!'
      },
      comingSoon: 'Próximamente',
      points: 'puntos',
      buy: 'Comprar',
      preparing: 'Preparando',
      pointEarning: {
        title: 'Cómo ganar puntos',
        communityActivities: 'Actividades de la comunidad',
        videoCalls: 'Videollamadas'
      },
      footerMessage: '✨ ¡Se agregarán más recompensas en el futuro! Acumula puntos 🙌'
    },

    // 스토리 설정
    storySettings: {
      globalSettings: {
        title: 'Configuración de Historias',
        autoPublic: {
          label: 'Público Automático',
          description: 'Publica automáticamente las historias subidas'
        },
        showInProfile: {
          label: 'Mostrar en Perfil',
          description: 'Permite ver las historias en el perfil'
        }
      },
      archiveSettings: {
        title: 'Configuración de Almacenamiento',
        autoArchive: {
          label: 'Guardado Automático',
          description: 'Guarda automáticamente las historias después del tiempo especificado'
        },
        archiveTiming: {
          label: 'Tiempo de Guardado',
          options: {
            '24': 'Después de 24 horas',
            '48': 'Después de 48 horas',
            '72': 'Después de 72 horas',
            '168': 'Después de 1 semana'
          }
        }
      },
      individualSettings: {
        title: 'Configuración Individual de Historias',
        public: 'Público',
        private: 'Privado',
        delete: 'Eliminar'
      }
    },

    // 도움말 페이지
    help: {
      title: 'Ayuda',
      subtitle: 'Proporcionamos información útil para usar el servicio AMIKO',
      sections: {
        gettingStarted: {
          title: 'Comenzar',
          content: 'Guía para usuarios que utilizan el servicio AMIKO por primera vez.',
          items: [
            'Método de registro y configuración de perfil',
            'Método de uso del servicio y funciones básicas',
            'Configuración de idioma y región',
            'Método de configuración de seguridad de cuenta'
          ]
        },
        videoChat: {
          title: 'Videollamadas',
          content: 'Ayuda para usar el servicio de videollamadas.',
          items: [
            'Método de inicio y finalización de videollamadas',
            'Cómo usar la función de traducción AI',
            'Método de mejora de calidad de videollamadas',
            'Resolución de problemas durante videollamadas'
          ]
        },
        community: {
          title: 'Comunidad',
          content: 'Ayuda para usar las funciones de comunidad.',
          items: [
            'Escritura y gestión de publicaciones',
            'Función de comentarios y me gusta',
            'Guía de la comunidad',
            'Función de reporte y bloqueo'
          ]
        },
        points: {
          title: 'Sistema de Puntos',
          content: 'Ayuda para acumular y usar puntos.',
          items: [
            'Método de acumulación de puntos',
            'Método de uso de puntos',
            'Verificación del historial de puntos',
            'Políticas y regulaciones de puntos'
          ]
        },
        troubleshooting: {
          title: 'Resolución de Problemas',
          content: 'Problemas frecuentes y métodos de solución.',
          items: [
            'Resolución de problemas de inicio de sesión',
            'Problemas de conexión de videollamadas',
            'Optimización del rendimiento de la aplicación',
            'Otros problemas técnicos'
          ]
        }
      }
    },

    // 피드백 페이지
    feedback: {
      title: 'Comentarios',
      subtitle: 'Esperamos tus valiosas opiniones para mejorar el servicio AMIKO',
      sections: {
        guidelines: {
          title: 'Guía de Comentarios',
          content: 'Guía para comentarios efectivos.',
          items: [
            'Por favor escribe con contenido específico y claro',
            'Al sugerir mejoras, presenta razones y fundamentos',
            'Usa un lenguaje constructivo y respetuoso',
            'No incluyas información personal'
          ]
        },
        types: {
          title: 'Tipos de Comentarios',
          content: 'Recibimos los siguientes tipos de comentarios.',
          bug: {
            title: 'Reporte de Errores',
            content: 'Errores o problemas encontrados en el servicio'
          },
          feature: {
            title: 'Sugerencia de Funciones',
            content: 'Sugerencias de nuevas funciones o mejoras'
          },
          ux: {
            title: 'Experiencia de Usuario',
            content: 'Sugerencias de mejora de interfaz y experiencia de usuario'
          },
          general: {
            title: 'Comentarios Generales',
            content: 'Opiniones y sugerencias sobre el servicio en general'
          }
        },
        submission: {
          title: 'Método de Envío de Comentarios',
          content: 'Cómo enviar comentarios.',
          items: [
            'Correo electrónico: feedback@amiko.com',
            'Envío a través de la página de consultas',
            'Usar la función de comentarios en la aplicación',
            'Envío a través de redes sociales'
          ]
        },
        process: {
          title: 'Proceso de Comentarios',
          content: 'Proceso de manejo de los comentarios enviados.',
          items: [
            'Recepción y revisión de comentarios',
            'Revisión del equipo de desarrollo y decisión de prioridades',
            'Evaluación de viabilidad de implementación',
            'Aplicación de mejoras y compartir resultados'
          ]
        }
      }
    },

    // 연락처 페이지
    contact: {
      title: 'Contacto',
      subtitle: 'Puedes contactar directamente con el equipo AMIKO',
      sections: {
        info: {
          title: 'Información de Contacto',
          email: {
            title: 'Correo Electrónico',
            content: 'info@amiko.com'
          },
          hours: {
            title: 'Horario de Atención',
            content: 'Lunes - Viernes, 09:00 - 18:00 (KST)'
          }
        },
        types: {
          title: 'Tipos de Consulta',
          content: 'Recibimos las siguientes consultas.',
          technical: {
            title: 'Soporte Técnico',
            content: 'Problemas técnicos que surgen durante el uso del servicio'
          },
          billing: {
            title: 'Consultas de Pago',
            content: 'Consultas relacionadas con pagos y reembolsos'
          },
          general: {
            title: 'Consultas Generales',
            content: 'Consultas sobre uso del servicio y políticas'
          },
          partnership: {
            title: 'Consultas de Alianza',
            content: 'Consultas sobre alianzas y cooperación empresarial'
          }
        },
        response: {
          title: 'Tiempo de Respuesta',
          content: 'Tiempo de respuesta según el tipo de consulta.',
          items: [
            'Soporte técnico: Dentro de 24 horas',
            'Consultas de pago: Dentro de 12 horas',
            'Consultas generales: Dentro de 48 horas',
            'Consultas de alianza: Dentro de 72 horas'
          ]
        }
      }
    }
  }
}

export type Language = keyof typeof translations
export type TranslationKey = keyof typeof translations.ko
