/**
 * Service Worker for Push Notifications
 * 웹 푸시 알림을 처리하는 서비스 워커
 */

const CACHE_NAME = 'oz-coding-school-v2';
const STATIC_CACHE_URLS = [
  '/',
  '/notifications',
  '/notifications/settings',
  '/bookings',
  '/consultants',
  '/profile',
  '/favicon.ico',
  '/manifest.json'
];

// Service Worker 설치
self.addEventListener('install', (event) => {
  console.log('[SW] Service Worker 설치 중...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] 정적 파일 캐싱 중...');
        // 캐시 실패를 방지하기 위해 개별적으로 추가
        const cachePromises = STATIC_CACHE_URLS.map(url => 
          cache.add(url).catch(err => {
            console.warn(`[SW] 캐시 실패 (${url}):`, err);
            return null;
          })
        );
        return Promise.allSettled(cachePromises);
      })
      .then(() => {
        console.log('[SW] Service Worker 설치 완료');
        return self.skipWaiting();
      })
  );
});

// Service Worker 활성화
self.addEventListener('activate', (event) => {
  console.log('[SW] Service Worker 활성화 중...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] 이전 캐시 삭제:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('[SW] Service Worker 활성화 완료');
      return self.clients.claim();
    })
  );
});

// 푸시 알림 수신
self.addEventListener('push', (event) => {
  console.log('[SW] 푸시 알림 수신:', event);
  
  if (!event.data) {
    console.log('[SW] 푸시 데이터 없음');
    // 데이터가 없어도 기본 알림 표시
    const options = {
      body: '새로운 알림이 있습니다',
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: 'default'
    };
    
    event.waitUntil(
      self.registration.showNotification('오즈코딩스쿨', options)
    );
    return;
  }
  
  try {
    const data = event.data.json();
    console.log('[SW] 푸시 데이터:', data);
    
    const options = {
      body: data.body || '새로운 알림이 있습니다',
      icon: data.icon || '/favicon.ico',
      badge: data.badge || '/favicon.ico',
      tag: data.tag || 'default',
      data: {
        url: data.data?.url || '/notifications',
        notificationId: data.data?.notificationId,
        ...data.data
      },
      actions: data.actions || [
        {
          action: 'view',
          title: '보기',
          icon: '/favicon.ico'
        },
        {
          action: 'close',
          title: '닫기'
        }
      ],
      requireInteraction: data.requireInteraction || false,
      silent: false,
      vibrate: [200, 100, 200, 100, 200],
      renotify: true,
      timestamp: Date.now()
    };
    
    // 알림 표시
    event.waitUntil(
      self.registration.showNotification(data.title || '오즈코딩스쿨', options)
        .then(() => {
          console.log('[SW] 알림 표시 완료');
          // 알림 표시 성공을 서버에 보고 (선택사항)
          if (data.data?.notificationId) {
            return fetch(`/api/notifications/${data.data.notificationId}/delivered`, {
              method: 'POST'
            }).catch(err => console.warn('[SW] 배달 확인 실패:', err));
          }
        })
        .catch(err => {
          console.error('[SW] 알림 표시 실패:', err);
        })
    );
    
  } catch (error) {
    console.error('[SW] 푸시 알림 처리 실패:', error);
    
    // 기본 알림 표시
    const options = {
      body: '새로운 알림이 있습니다',
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      data: { url: '/notifications' },
      actions: [
        {
          action: 'view',
          title: '보기'
        }
      ]
    };
    
    event.waitUntil(
      self.registration.showNotification('오즈코딩스쿨', options)
    );
  }
});

// 알림 클릭 처리
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] 알림 클릭:', event);
  console.log('[SW] 클릭된 액션:', event.action);
  console.log('[SW] 알림 데이터:', event.notification.data);
  
  event.notification.close();
  
  // 액션별 처리
  if (event.action === 'close') {
    console.log('[SW] 알림 닫기 액션');
    return;
  }
  
  // 클릭 통계 전송 (선택사항)
  if (event.notification.data?.notificationId) {
    fetch(`/api/notifications/${event.notification.data.notificationId}/clicked`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: event.action || 'click' })
    }).catch(err => console.warn('[SW] 클릭 통계 전송 실패:', err));
  }
  
  // 클라이언트 열기 또는 새 창 열기
  event.waitUntil(
    self.clients.matchAll({ 
      type: 'window',
      includeUncontrolled: true 
    }).then((clients) => {
      const targetUrl = event.notification.data?.url || '/notifications';
      
      // 이미 해당 URL이 열린 창이 있는지 확인
      for (const client of clients) {
        const clientUrl = new URL(client.url);
        const targetUrlObj = new URL(targetUrl, client.url);
        
        if (clientUrl.pathname === targetUrlObj.pathname && 'focus' in client) {
          console.log('[SW] 기존 창에 포커스:', client.url);
          return client.focus();
        }
      }
      
      // 기존 창이 있다면 해당 URL로 이동
      if (clients.length > 0 && 'navigate' in clients[0]) {
        console.log('[SW] 기존 창에서 이동:', targetUrl);
        return clients[0].focus().then(() => clients[0].navigate(targetUrl));
      }
      
      // 새 창 열기
      if (self.clients.openWindow) {
        console.log('[SW] 새 창 열기:', targetUrl);
        return self.clients.openWindow(targetUrl);
      }
    }).catch(err => {
      console.error('[SW] 클라이언트 처리 실패:', err);
      // 폴백: 새 창 열기
      if (self.clients.openWindow) {
        return self.clients.openWindow(event.notification.data?.url || '/notifications');
      }
    })
  );
});

// 알림 닫기 처리
self.addEventListener('notificationclose', (event) => {
  console.log('[SW] 알림 닫힘:', event);
  
  // 알림 통계 등에 활용 가능
  if (event.notification.data?.analytics) {
    // 분석 데이터 전송
    console.log('[SW] 알림 분석 데이터:', event.notification.data.analytics);
  }
});

// 백그라운드 동기화 (선택사항)
self.addEventListener('sync', (event) => {
  console.log('[SW] 백그라운드 동기화:', event);
  
  if (event.tag === 'background-sync') {
    event.waitUntil(
      // 백그라운드에서 동기화 작업 수행
      console.log('[SW] 백그라운드 동기화 실행')
    );
  }
});

// 메시지 처리 (메인 스레드와 통신)
self.addEventListener('message', (event) => {
  console.log('[SW] 메시지 수신:', event);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME });
  }
});

// 오류 처리
self.addEventListener('error', (event) => {
  console.error('[SW] Service Worker 오류:', event);
});

// 언핸들드 리젝션 처리
self.addEventListener('unhandledrejection', (event) => {
  console.error('[SW] 처리되지 않은 Promise 거부:', event);
});

console.log('[SW] Service Worker 로드됨');
