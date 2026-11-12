// Cache de la coquille de l'appli. Les notes passent toujours par le réseau
// (le dernier relevé est gardé par l'appli elle-même pour le hors-ligne).
const CACHE = 'ulco-v7';
const SHELL = ['./', 'index.html', 'parse.js', 'manifest.webmanifest', 'icons/icon-192.png', 'icons/icon-512.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL.map((u) => new Request(u, { cache: 'no-cache' })))).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE && k !== 'ulco-cfg').map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;
  // Réseau d'abord pour récupérer les mises à jour, cache en secours hors ligne.
  e.respondWith(
    fetch(e.request, { cache: 'no-cache' })
      .then((r) => {
        if (r.ok) {
          const copy = r.clone();
          caches.open(CACHE).then((c) => c.put(e.request, copy));
        }
        return r;
      })
      .catch(() => caches.match(e.request, { ignoreSearch: true }))
  );
});


// Notification envoyée par n8n (sans contenu) : nouvelle note détectée, ou test d'activation.
self.addEventListener('push', (e) => {
  e.waitUntil((async () => {
    const cfg = await caches.open('ulco-cfg');
    if (await cfg.match('test-pending')) {
      await cfg.delete('test-pending');
      return self.registration.showNotification('Notes ULCO', {
        body: 'Pastille activée. Vous serez prévenu des nouvelles notes.',
        icon: 'icons/icon-192.png', tag: 'ulco-test',
      });
    }
    const prev = await cfg.match('badge');
    const count = (prev ? Number(await prev.text()) || 0 : 0) + 1;
    await cfg.put('badge', new Response(String(count)));
    try { if (self.navigator.setAppBadge) await self.navigator.setAppBadge(count); } catch {}
    return self.registration.showNotification('Notes ULCO', {
      body: 'Nouvelle note publiée.', icon: 'icons/icon-192.png', tag: 'ulco-notes', renotify: true,
    });
  })());
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  e.waitUntil((async () => {
    const wins = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    if (wins.length) return wins[0].focus();
    return self.clients.openWindow('./');
  })());
});
