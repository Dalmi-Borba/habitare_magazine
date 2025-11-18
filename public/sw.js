// Service Worker para Revista Habitare
const CACHE_NAME = 'habitare-v2';
const RUNTIME_CACHE = 'habitare-runtime-v2';

// Assets para cachear na instalação
const PRECACHE_ASSETS = [
  '/',
  '/css/styles.css',
  '/css/admin.css',
  '/js/main.js',
  '/js/admin-pins.js',
  '/img/h.ico',
  '/manifest.json',
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=Playfair+Display:wght@500;600&display=swap'
];

// Instalação do Service Worker
self.addEventListener('install', (event) => {
  console.log('[SW] Instalando Service Worker...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Cacheando assets iniciais');
        // Usar fetch com redirect follow para cada asset
        return Promise.all(
          PRECACHE_ASSETS.map((url) => {
            return fetch(url, { redirect: 'follow' })
              .then((response) => {
                if (response && response.status === 200) {
                  return cache.put(url, response);
                }
              })
              .catch((err) => {
                console.log(`[SW] Erro ao cachear ${url}:`, err);
              });
          })
        );
      })
      .then(() => self.skipWaiting())
  );
});

// Ativação do Service Worker
self.addEventListener('activate', (event) => {
  console.log('[SW] Ativando Service Worker...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE) {
            console.log('[SW] Removendo cache antigo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Estratégia: Cache First, depois Network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignorar requisições não-GET
  if (request.method !== 'GET') {
    return;
  }

  // Ignorar requisições de API/admin que precisam ser sempre frescas
  if (url.pathname.startsWith('/admin') && url.pathname !== '/admin') {
    return;
  }

  // Ignorar requisições de API
  if (url.pathname.startsWith('/api')) {
    return;
  }

  // Ignorar URLs externas que podem redirecionar (marketplace, etc)
  // Apenas processar recursos da mesma origem
  if (url.origin !== self.location.origin) {
    // Para recursos externos (como fonts), usar fetch normal com redirect follow
    if (url.hostname.includes('fonts.googleapis.com') || url.hostname.includes('fonts.gstatic.com')) {
      event.respondWith(
        fetch(request, { redirect: 'follow' }).catch(() => {
          // Se falhar, não fazer nada (deixa o navegador lidar)
          return;
        })
      );
    }
    return;
  }

  // Para uploads, sempre buscar da rede
  if (url.pathname.startsWith('/uploads/')) {
    event.respondWith(
      caches.open(RUNTIME_CACHE).then((cache) => {
        return fetch(request, { redirect: 'follow' }).then((response) => {
          if (response && response.status === 200 && response.type === 'basic') {
            cache.put(request, response.clone());
          }
          return response;
        }).catch(() => {
          return caches.match(request);
        });
      })
    );
    return;
  }

  // Para outros recursos, usar Cache First
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(request, { redirect: 'follow' }).then((response) => {
        // Só cachear respostas válidas e da mesma origem
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

        const responseToCache = response.clone();

        caches.open(RUNTIME_CACHE).then((cache) => {
          cache.put(request, responseToCache);
        });

        return response;
      }).catch(() => {
        // Se falhar e for uma página, retornar página offline
        const acceptHeader = request.headers.get('accept');
        if (acceptHeader && acceptHeader.includes('text/html')) {
          return caches.match('/');
        }
      });
    })
  );
});

// Notificações push (opcional, para implementação futura)
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification recebida');
  // Implementar notificações push no futuro
});

