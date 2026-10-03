import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { api } from './client';

function urlBase64ToUint8Array(base64: string): BufferSource {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const raw = window.atob((base64 + padding).replace(/-/g, '+').replace(/_/g, '/'));
  const bytes = Uint8Array.from([...raw].map((ch) => ch.charCodeAt(0)));
  return bytes.buffer as ArrayBuffer;
}

interface PushSubscriptionBody {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}

function toBody(sub: PushSubscription): PushSubscriptionBody {
  const key = (name: 'p256dh' | 'auth') => {
    const raw = sub.getKey(name);
    if (!raw) throw new Error(`Missing subscription key: ${name}`);
    return window.btoa(String.fromCharCode(...new Uint8Array(raw)));
  };
  return { endpoint: sub.endpoint, keys: { p256dh: key('p256dh'), auth: key('auth') } };
}

/**
 * Browser push subscription: asks permission, subscribes with the VAPID
 * key from /push/vapid-public-key, POSTs to /push/subscriptions.
 */
export function usePushSubscription() {
  const [permission, setPermission] = useState<NotificationPermission>(
    'Notification' in window ? Notification.permission : 'denied',
  );
  const mutation = useMutation({
    mutationFn: async () => {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        throw new Error('Push not supported');
      }
      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm !== 'granted') throw new Error('Permission denied');
      const registration = await navigator.serviceWorker.ready;
      const { key } = await api<{ key: string }>('/push/vapid-public-key', { auth: false });
      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(key),
      });
      await api('/push/subscriptions', { method: 'POST', body: JSON.stringify(toBody(sub)) });
    },
  });
  return { permission, ...mutation };
}
