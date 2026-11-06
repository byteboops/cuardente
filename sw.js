const CACHE = 'cu-ardente-v1';

const ASSETS = [
  '/',
  '/index.html',
  '/login.html',
  '/criarconta.html',
  '/ingressos.html',
  '/noticias.html',
  '/historia.html',
  '/ajustes.html',
  '/vaga.html',
  '/vaga/peneira.html',
  '/vaga/dados.html',
  '/juridico/',
  '/juridico/index.html',
  '/juridico/termos.html',
  '/juridico/privacidade.html',
  '/manifest.webmanifest',
  '/logo-removebg-preview.png'
];

// Instala: pré-cacheia os assets
self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE).then(function (cache) {
      return Promise.all(
        ASSETS.map(function (url) {
          return cache.add(url).catch(function () {
            // ignora falhas individuais (ex: rota sem index)
          });
        })
      );
    }).then(function () {
      return self.skipWaiting();
    })
  );
});

// Ativa: limpa caches antigos
self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys.filter(function (k) { return k !== CACHE; })
            .map(function (k) { return caches.delete(k); })
      );
    }).then(function () {
      return self.clients.claim();
    })
  );
});

// Fetch: cache-first com fallback à rede (e salva o que buscar)
self.addEventListener('fetch', function (event) {
  if (event.request.method !== 'GET') return;

  // Não intercepta chamadas ao Supabase (upload de TXT precisa ir pra rede)
  if (event.request.url.indexOf('supabase.co') !== -1) return;

  // Não intercepta Google Fonts (deixa a rede/css normal cuidar)
  if (event.request.url.indexOf('fonts.googleapis.com') !== -1) return;
  if (event.request.url.indexOf('fonts.gstatic.com') !== -1) return;

  event.respondWith(
    caches.match(event.request).then(function (cached) {
      if (cached) return cached;

      return fetch(event.request).then(function (resp) {
        // Só cacheia respostas válidas do mesmo domínio
        if (resp && resp.ok && resp.type === 'basic') {
          var clone = resp.clone();
          caches.open(CACHE).then(function (cache) {
            cache.put(event.request, clone);
          });
        }
        return resp;
      }).catch(function () {
        // Fallback offline: tenta a home
        return caches.match('/');
      });
    })
  );
});
