// Custom service worker (injectManifest): precache + push -> showNotification,
// notificationclick -> focus/open the payload URL.
import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching';

const sw = self as unknown as ServiceWorkerGlobalScope;

cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST);

interface PushPayload {
  title?: string;
  body?: string;
  url?: string;
}

sw.addEventListener('push', (event) => {
  const pushEvent = event as unknown as PushEvent;
  const data = (pushEvent.data?.json() ?? {}) as PushPayload;
  const title = data.title ?? 'Otula';
  const options: NotificationOptions & { data: { url: string } } = {
    body: data.body ?? '',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    data: { url: data.url ?? '/' },
  };
  pushEvent.waitUntil(sw.registration.showNotification(title, options));
});

sw.addEventListener('notificationclick', (event) => {
  const clickEvent = event as unknown as NotificationEvent;
  clickEvent.notification.close();
  const url = (clickEvent.notification.data as { url?: string } | undefined)?.url ?? '/';
  clickEvent.waitUntil(
    (async () => {
      const windows = await sw.clients.matchAll({ type: 'window', includeUncontrolled: true });
      const target = new URL(url, sw.location.origin).href;
      for (const client of windows) {
        const windowClient = client as WindowClient;
        if (new URL(windowClient.url).pathname === new URL(target).pathname) {
          await windowClient.focus();
          return;
        }
      }
      await sw.clients.openWindow(target);
    })(),
  );
});
