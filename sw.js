// Versionamento do Aplicativo ApisApp Pro - Sincronizado com o App e HTML
const CACHE_NAME = 'apisapp-v1.1.7';

const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './css/styles.css',
  './js/app.js', // Corrigido: Removido storage.js que já está unificado no seu app.js
  './manifest.json',
  './assets/icon.png'
];

self.addEventListener('install', (event) => {
  console.log('[Service Worker] Instalando nova versão:', CACHE_NAME);
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Usamos uma estratégia de cacheamento forçada para não travar se um arquivo falhar
      return Promise.all(
        ASSETS_TO_CACHE.map(url => {
          return cache.add(url).catch(err => console.warn('[Service Worker] Erro ao cachear:', url, err));
        })
      );
    })
  );
  // Força a ativação imediata do worker recém-instalado
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Ativando nova versão:', CACHE_NAME);
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[Service Worker] Removendo cache antigo:', key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  // Garante que todas as abas abertas no celular usem a nova versão na mesma hora
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Ignora requisições de servidores externos (como Firebase ou APIs remotas de licença)
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // Estratégia Network-First para o index.html (garante checagem de licença e atualizações)
      if (event.request.mode === 'navigate') {
        return fetch(event.request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const responseToCache = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseToCache));
            }
            return networkResponse;
          })
          .catch(() => cachedResponse || caches.match('./index.html'));
      }

      // Estratégia Stale-While-Revalidate para os demais arquivos locais (css, js, imagens)
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(() => {
        // Se estiver totalmente sem sinal (Offline)
        return cachedResponse;
      });

      return cachedResponse || fetchPromise;
    })
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
