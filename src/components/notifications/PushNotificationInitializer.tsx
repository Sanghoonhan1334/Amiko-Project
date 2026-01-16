'use client'

import { useEffect } from 'react'
import { useSession } from '@/hooks/useSession'
import { initializePushNotifications } from '@/lib/push-notifications'
import { Capacitor } from '@capacitor/core'

export function PushNotificationInitializer() {
  const { user, loading } = useSession()

  useEffect(() => {
    console.log('[PUSH_INIT] Component mounted. Loading:', loading, 'User:', !!user);

    if (loading) {
      console.log('[PUSH_INIT] Still loading session, waiting...');
      return
    }

    if (!user) {
      console.log('[PUSH_INIT] No user session found. Aborting.');
      return
    }

    const isNative = Capacitor.isNativePlatform();
    console.log('[PUSH_INIT] Is native platform?', isNative);

    if (isNative) {
      console.log('[PUSH_INIT] Native platform detected. Initializing for user:', user.id);
      initializePushNotifications(user.id).then(success => {
        if (success) {
          console.log('[PUSH_INIT] Successfully initialized push notifications.')
        } else {
          console.error('[PUSH_INIT] Failed to initialize push notifications.')
        }
      }).catch(error => {
        console.error('[PUSH_INIT] Error during push initialization:', error);
      });
    } else {
      console.log('[PUSH_INIT] Not a native platform. Skipping native initialization.');
    }
  }, [user, loading])

  return null
}
