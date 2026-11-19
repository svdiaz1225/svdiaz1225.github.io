/* Service worker de "Ayuda a mi salud".
   Solo guarda en caché los archivos de la propia app para que abra sin internet.
   No envía nada a ningún servidor, no rastrea y no toca tus registros:
   tus datos viven en el almacenamiento local del navegador, no aquí. */

const CACHE = "ayuda-a-mi-salud-v1";

const ARCHIVOS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png",
  "./icon-512-maskable.png",
  "./apple-touch-icon.png",
  "./favicon-32.png"
];

/* Al instalar: guardar los archivos en caché. */
self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE)
      .then((c) => c.addAll(ARCHIVOS))
      .catch(() => null)
      .then(() => self.skipWaiting())
  );
});

/* Al activar: borrar cachés de versiones viejas. */
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

/* Al navegar: primero la red (para traer actualizaciones),
   y si no hay internet, lo que esté en caché. */
self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // nada de terceros

  e.respondWith(
    fetch(req)
      .then((res) => {
        const copia = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copia)).catch(() => null);
        return res;
      })
      .catch(() =>
        caches.match(req).then((hit) => hit || caches.match("./index.html"))
      )
  );
});
