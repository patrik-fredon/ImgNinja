const CACHE_NAME = "imgninja-v2";
const STATIC_CACHE = "imgninja-static-v2";
const DYNAMIC_CACHE = "imgninja-dynamic-v2";
const IMAGE_CACHE = "imgninja-images-v2";

// Critical resources to precache
const PRECACHE_URLS = [
  "/",
  "/en",
  "/cs",
  "/manifest.json",
  "/favicon-32x32.png",
  "/favicon-16x16.png",
];

// Install event - precache critical resources
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  const currentCaches = [CACHE_NAME, STATIC_CACHE, DYNAMIC_CACHE, IMAGE_CACHE];

  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (!currentCaches.includes(cacheName)) {
              return caches.delete(cacheName);
            }
            return Promise.resolve();
          })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch event - advanced caching strategies
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  if (!event.request.url.startsWith(self.location.origin)) return;

  const url = new URL(event.request.url);

  // Handle different resource types with appropriate strategies
  if (event.request.mode === "navigate") {
    // Navigation requests - network first, cache fallback
    event.respondWith(handleNavigationRequest(event.request));
  } else if (url.pathname.startsWith("/_next/static/")) {
    // Static assets - cache first (immutable)
    event.respondWith(handleStaticAssets(event.request));
  } else if (event.request.destination === "image") {
    // Images - cache first with size limit
    event.respondWith(handleImageRequest(event.request));
  } else if (url.pathname.includes("/api/")) {
    // API requests - network only
    event.respondWith(fetch(event.request));
  } else {
    // Other resources - stale while revalidate
    event.respondWith(handleOtherRequests(event.request));
  }
});

// Navigation request handler
async function handleNavigationRequest(request) {
  try {
    const response = await fetch(request);
    const cache = await caches.open(DYNAMIC_CACHE);
    cache.put(request, response.clone());
    return response;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    return cachedResponse || new Response("Offline", { status: 503 });
  }
}

// Static assets handler
async function handleStaticAssets(request) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    return new Response("Asset not available", { status: 404 });
  }
}

// Image request handler with size management
async function handleImageRequest(request) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(IMAGE_CACHE);

      // Manage cache size (keep under 50MB)
      const keys = await cache.keys();
      if (keys.length > 100) {
        await cache.delete(keys[0]); // Remove oldest
      }

      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    return new Response("Image not available", { status: 404 });
  }
}

// Other requests handler - stale while revalidate
async function handleOtherRequests(request) {
  const cachedResponse = await caches.match(request);

  const fetchPromise = fetch(request).then((response) => {
    if (response.ok) {
      const cache = caches.open(DYNAMIC_CACHE);
      cache.then((c) => c.put(request, response.clone()));
    }
    return response;
  });

  return cachedResponse || fetchPromise;
}
