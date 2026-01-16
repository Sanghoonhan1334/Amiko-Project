/**
 * 웹 및 네이티브 앱 푸시 알림 관리 유틸리티
 */

import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { LocalNotifications } from '@capacitor/local-notifications';

export interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface NativePushToken {
  value: string;
  type: 'fcm' | 'apns';
}

export interface PushNotificationData {
  title: string
  body: string
  icon?: string
  badge?: string
  data?: Record<string, unknown>
}

/**
 * 푸시 알림 권한 요청
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    console.warn('[PUSH] 이 브라우저는 알림을 지원하지 않습니다');
    return 'denied';
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  if (Notification.permission === 'denied') {
    console.warn('[PUSH] 알림 권한이 거부되었습니다');
    return 'denied';
  }

  try {
    const permission = await Notification.requestPermission();
    console.log('[PUSH] 알림 권한 요청 결과:', permission);
    return permission;
  } catch (error) {
    console.error('[PUSH] 알림 권한 요청 실패:', error);
    return 'denied';
  }
}

/**
 * Service Worker 등록
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) {
    console.warn('[PUSH] 이 브라우저는 Service Worker를 지원하지 않습니다');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js');
    console.log('[PUSH] Service Worker 등록 성공:', registration);

    // Service Worker가 활성화될 때까지 기다림
    await navigator.serviceWorker.ready;
    console.log('[PUSH] Service Worker 준비 완료');

    // Service Worker 업데이트 확인
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      if (newWorker) {
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            console.log('[PUSH] Service Worker 업데이트 가능');
            // 사용자에게 업데이트 알림 가능
          }
        });
      }
    });

    return registration;
  } catch (error) {
    console.error('[PUSH] Service Worker 등록 실패:', error);
    return null;
  }
}

/**
 * VAPID 공개키를 Uint8Array로 변환
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  try {
    console.log('[PUSH] VAPID 키 변환 시작');
    console.log('[PUSH] 입력 키 길이:', base64String.length);
    console.log('[PUSH] 입력 키 (처음 50자):', base64String.substring(0, 50));

    // PEM 형식인지 확인
    if (base64String.includes('-----BEGIN PUBLIC KEY-----')) {
      console.error('[PUSH] PEM 형식 키가 감지되었습니다. raw Base64URL 형식이 필요합니다.');
      throw new Error('PEM 형식 키가 아닌 raw Base64URL 형식의 키가 필요합니다.');
    }

    // Base64URL을 Base64로 변환
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');

    console.log('[PUSH] 패딩 추가 후 길이:', base64.length);
    console.log('[PUSH] 변환된 Base64 (처음 50자):', base64.substring(0, 50));

    // Base64 디코딩
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }

    console.log('[PUSH] VAPID 키 변환 완료, 길이:', outputArray.length);
    console.log('[PUSH] 출력 배열 (처음 10바이트):', Array.from(outputArray.slice(0, 10)));
    return outputArray;
  } catch (error) {
    console.error('[PUSH] VAPID 키 변환 실패:', error);
    throw new Error(`VAPID 키 변환 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
  }
}

/**
 * 푸시 구독 생성
 */
export async function subscribeToPushNotifications(
  registration: ServiceWorkerRegistration
): Promise<PushSubscription | null> {
  try {
    // 기존 구독 확인
    let subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      console.log('[PUSH] 기존 구독 발견:', subscription);
      return subscription;
    }

    // VAPID 공개키 확인
    const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!vapidPublicKey) {
      throw new Error('VAPID 공개키가 설정되지 않았습니다.');
    }

    // 새 구독 생성
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey) as BufferSource
    });

    console.log('[PUSH] 새 구독 생성 성공:', subscription);
    return subscription;
  } catch (error) {
    console.error('[PUSH] 푸시 구독 생성 실패:', error);
    return null;
  }
}

/**
 * 푸시 구독 해제
 */
export async function unsubscribeFromPushNotifications(
  registration: ServiceWorkerRegistration
): Promise<boolean> {
  try {
    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      await subscription.unsubscribe();
      console.log('[PUSH] 푸시 구독 해제 성공');
      return true;
    }

    return false;
  } catch (error) {
    console.error('[PUSH] 푸시 구독 해제 실패:', error);
    return false;
  }
}

/**
 * 구독 데이터를 서버에 전송
 */
export async function sendSubscriptionToServer(
  subscription: PushSubscription,
  userId: string
): Promise<boolean> {
  try {
    const response = await fetch('/api/notifications/subscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId,
        subscription: {
          endpoint: subscription.endpoint,
          keys: {
            p256dh: btoa(String.fromCharCode.apply(null,
              Array.from(new Uint8Array(subscription.getKey('p256dh') || []))
            )),
            auth: btoa(String.fromCharCode.apply(null,
              Array.from(new Uint8Array(subscription.getKey('auth') || []))
            ))
          }
        }
      })
    });

    if (response.ok) {
      console.log('[PUSH] 구독 데이터 서버 전송 성공');
      return true;
    } else {
      console.error('[PUSH] 구독 데이터 서버 전송 실패:', response.status);
      return false;
    }
  } catch (error) {
    console.error('[PUSH] 구독 데이터 서버 전송 중 오류:', error);
    return false;
  }
}

/**
 * 로컬 알림 표시 (테스트용)
 */
export function showLocalNotification(payload: PushNotificationData): void {
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    console.warn('[PUSH] 로컬 알림을 표시할 수 없습니다');
    return;
  }

  try {
    const notification = new Notification(payload.title, {
      body: payload.body,
      icon: payload.icon || '/favicon.ico',
      badge: payload.badge || '/favicon.ico',
      data: payload.data,
    });

    // 알림 클릭 이벤트
    notification.onclick = () => {
      window.focus();
      notification.close();

      if (payload.data?.url) {
        window.location.href = payload.data.url as string;
      }
    };

    console.log('[PUSH] 로컬 알림 표시:', payload.title);
  } catch (error) {
    console.error('[PUSH] 로컬 알림 표시 실패:', error);
  }
}

/**
 * 네이티브 앱 푸시 알림 초기화
 */
async function initializeNativePushNotifications(userId: string): Promise<boolean> {
  try {
    console.log('[NATIVE_PUSH] Starting native push initialization for user:', userId);

    // 1. Check current permissions without prompting
    let check = await PushNotifications.checkPermissions();
    console.log('[NATIVE_PUSH] Initial permission status:', JSON.stringify(check));

    if (check.receive === 'prompt') {
      // 2. Request permissions if not already granted or denied
      console.log('[NATIVE_PUSH] Permission is "prompt", requesting now...');
      const permission = await PushNotifications.requestPermissions();
      console.log('[NATIVE_PUSH] Permission request result:', JSON.stringify(permission));

      if (permission.receive !== 'granted') {
        console.warn('[NATIVE_PUSH] Permission was not granted. Result:', permission.receive);
        return false;
      }
    } else if (check.receive === 'denied') {
      console.warn('[NATIVE_PUSH] Permissions have been explicitly denied. Cannot register.');
      // Optionally, guide user to settings
      return false;
    }

    console.log('[NATIVE_PUSH] Permissions are granted. Proceeding with registration.');

    // 4. Add listeners BEFORE registering
    await PushNotifications.removeAllListeners();
    console.log('[NATIVE_PUSH] All previous listeners removed.');

    PushNotifications.addListener('registration', async (token: NativePushToken) => {
      console.log('[NATIVE_PUSH] Registration successful. Token:', JSON.stringify(token));
      await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          nativeToken: token.value,
          platform: Capacitor.getPlatform(),
          tokenType: token.type
        })
      });
      console.log('[NATIVE_PUSH] Token sent to server.');
    });

    PushNotifications.addListener('registrationError', (error) => {
      console.error('[NATIVE_PUSH] Registration failed:', JSON.stringify(error));
    });

    PushNotifications.addListener('pushNotificationReceived', async (notification) => {
      console.log('[NATIVE_PUSH] Push received:', JSON.stringify(notification));

      // When app is in foreground on native, display a native local notification
      try {
        // Ensure local notifications permission (Android generally grants by default)
        const perm = await LocalNotifications.checkPermissions();
        if (perm.display !== 'granted') {
          try {
            await LocalNotifications.requestPermissions();
          } catch (e) {
            console.warn('[NATIVE_PUSH] Local notification permission request failed:', e);
          }
        }

        const title = (notification && (notification.title || notification.notification?.title)) || 'Notification';
        const body = (notification && (notification.body || notification.notification?.body)) || '';

        // Schedule a local notification so it appears in the system UI
        await LocalNotifications.schedule({
          notifications: [
            {
              id: Date.now() % 100000,
              title: String(title),
              body: String(body),
              smallIcon: undefined,
              extra: notification?.data || {}
            }
          ]
        });

        console.log('[NATIVE_PUSH] Local notification scheduled for foreground push');
      } catch (err) {
        console.error('[NATIVE_PUSH] Failed to show local notification for push:', err);
      }
    });

    PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
      console.log('[NATIVE_PUSH] Push action performed:', JSON.stringify(action));
      if (action.notification.data?.url) {
        window.location.href = action.notification.data.url as string;
      }
    });

    console.log('[NATIVE_PUSH] All listeners have been added.');

    // 3. Register with FCM/APNS (AFTER listeners are set)
    await PushNotifications.register();
    console.log('[NATIVE_PUSH] PushNotifications.register() called.');

    // ensure channel exists (call once during init)
    try {
      await LocalNotifications.createChannel({
        id: 'default',
        name: 'Default',
        importance: 5, // 5 = high
        description: 'General app notifications',
        sound: 'default'
      })
      console.log('[NATIVE_PUSH] Notification channel created')
    } catch (e) {
      console.warn('[NATIVE_PUSH] createChannel failed', e)
    }

    console.log('[NATIVE_PUSH] Native push initialization process completed.');
    return true;
  } catch (error) {
    console.error('[NATIVE_PUSH] A critical error occurred during initialization:', error);
    return false;
  }
}

/**
 * 푸시 알림 초기화 (웹 및 네이티브 앱 모두 지원)
 */
export async function initializePushNotifications(userId: string): Promise<boolean> {
  try {
    console.log('[PUSH] 푸시 알림 초기화 시작');

    const isNative = Capacitor.isNativePlatform();

    if (isNative) {
      // 네이티브 앱 (Android/iOS)
      return await initializeNativePushNotifications(userId);
    } else {
      // 웹 브라우저
      // 1. 알림 권한 요청
      console.log('[PUSH] 1단계: 알림 권한 요청');
      const permission = await requestNotificationPermission();
      if (permission !== 'granted') {
        console.log('[PUSH] 알림 권한이 허용되지 않음');
        return false;
      }
      console.log('[PUSH] 알림 권한 허용됨');

      // 2. Service Worker 등록
      console.log('[PUSH] 2단계: Service Worker 등록');
      const registration = await registerServiceWorker();
      if (!registration) {
        console.log('[PUSH] Service Worker 등록 실패');
        return false;
      }
      console.log('[PUSH] Service Worker 등록 성공:', registration);

      // 3. 푸시 구독 생성
      console.log('[PUSH] 3단계: 푸시 구독 생성');
      const subscription = await subscribeToPushNotifications(registration);
      if (!subscription) {
        console.log('[PUSH] 푸시 구독 생성 실패');
        return false;
      }
      console.log('[PUSH] 푸시 구독 생성 성공:', subscription);

      // 4. 구독 데이터를 서버에 전송
      console.log('[PUSH] 4단계: 서버 전송');
      const success = await sendSubscriptionToServer(subscription, userId);
      if (!success) {
        console.log('[PUSH] 서버 전송 실패');
        return false;
      }

      console.log('[PUSH] 푸시 알림 초기화 완료');
      return true;
    }
  } catch (error) {
    console.error('[PUSH] 푸시 알림 초기화 실패:', error);
    return false;
  }
}

/**
 * 푸시 알림 상태 확인
 */
export function getPushNotificationStatus(): {
  supported: boolean;
  permission: NotificationPermission | 'prompt' | 'granted' | 'denied';
  serviceWorker: boolean;
  isNative: boolean;
} {
  const isNative = Capacitor.isNativePlatform();

  if (isNative) {
    return {
      supported: true,
      permission: 'prompt', // 네이티브에서는 동적으로 확인 필요
      serviceWorker: false,
      isNative: true
    };
  }

  return {
    supported: 'Notification' in window,
    permission: 'Notification' in window ? Notification.permission : 'denied',
    serviceWorker: 'serviceWorker' in navigator,
    isNative: false
  };
}

