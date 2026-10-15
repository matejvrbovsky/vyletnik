/* Service worker aplikace Odjezdy.
 * Slouží k instalaci jako PWA a jako záloha hlavní stránky při výpadku sítě.
 * Zachytává POUZE načtení stránky (navigate): nejdřív síť, při selhání poslední uložená kopie.
 * Mapové dlaždice, MHD/routing API, písma ani knihovna mapy tímto nevedou – fungují jako dřív. */
const CACHE = 'odjezdy-shell-v1';
const SHELL = ['./', 'manifest.json', 'icon-192.png', 'icon-512.png'];

self.addEventListener('install', e => {
  // každý soubor zvlášť: když jeden chybí (např. ./ u jinak pojmenované stránky), instalace tím neselže
  e.waitUntil(
    caches.open(CACHE)
      .then(c => Promise.all(SHELL.map(u => c.add(u).catch(() => {}))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || req.mode !== 'navigate') return; // vše ostatní řeší prohlížeč sám
  e.respondWith((async () => {
    try {
      const res = await fetch(req);
      if (res && res.ok) { const c = await caches.open(CACHE); c.put(req, res.clone()).catch(() => {}); }
      return res;
    } catch (err) {
      const cached = await caches.match(req, { ignoreSearch: true }) || await caches.match('./');
      if (cached) return cached;
      throw err;
    }
  })());
});
