// Custom service worker extension for push notifications
const sw = self as any;

sw.addEventListener('push', (event: any) => {
  let data = { title: 'Ravense Alert', body: 'New dispatches received.', url: '/' };

  if (event.data) {
    try {
      data = event.data.json();
    } catch {
      const text = event.data.text();
      data = { title: 'Ravense Alert', body: text, url: '/' };
    }
  }

  const options = {
    body: data.body,
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    data: {
      url: data.url || '/'
    }
  };

  event.waitUntil(
    sw.registration.showNotification(data.title, options)
  );
});

sw.addEventListener('notificationclick', (event: any) => {
  event.notification.close();
  const urlToOpen = new URL(event.notification.data?.url || '/', sw.location.origin).href;

  event.waitUntil(
    sw.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients: any[]) => {
      // Focus if window already open
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      // Else open new window
      if (sw.clients.openWindow) {
        return sw.clients.openWindow(urlToOpen);
      }
    })
  );
});
