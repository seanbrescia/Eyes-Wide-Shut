// Service Worker for Push Notifications - Eyes Wide Shut

self.addEventListener('push', function(event) {
  if (!event.data) return

  const data = event.data.json()

  const options = {
    body: data.body || 'New event notification',
    icon: '/icons/icon-192.png',
    badge: '/icons/badge-72.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/',
      eventId: data.eventId,
      venueId: data.venueId
    },
    actions: [
      {
        action: 'view',
        title: 'View Event'
      },
      {
        action: 'close',
        title: 'Dismiss'
      }
    ],
    tag: data.eventId || 'notification',
    renotify: true
  }

  event.waitUntil(
    self.registration.showNotification(data.title || 'Eyes Wide Shut', options)
  )
})

self.addEventListener('notificationclick', function(event) {
  event.notification.close()

  if (event.action === 'close') return

  const url = event.notification.data?.url || '/'

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(function(clientList) {
        // Check if already have a window open
        for (const client of clientList) {
          if (client.url === url && 'focus' in client) {
            return client.focus()
          }
        }
        // Open new window
        if (clients.openWindow) {
          return clients.openWindow(url)
        }
      })
  )
})

// Activate immediately
self.addEventListener('activate', function(event) {
  event.waitUntil(self.clients.claim())
})
