// Service Worker版本号(更新时改这个数字)
const CACHE_VERSION = 'v1.0.0';
const CACHE_NAME = `vision-training-${CACHE_VERSION}`;

// 需要缓存的文件列表
const urlsToCache = [
  '/',
  '/index.html',
  'https://unpkg.com/react@18/umd/react.production.min.js',
  'https://unpkg.com/react-dom@18/umd/react-dom.production.min.js',
  'https://unpkg.com/@babel/standalone/babel.min.js',
  'https://cdn.tailwindcss.com'
];

// 安装Service Worker
self.addEventListener('install', (event) => {
  console.log('[Service Worker] 正在安装...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] 缓存文件');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('[Service Worker] 安装完成');
        return self.skipWaiting(); // 立即激活
      })
  );
});

// 激活Service Worker
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] 正在激活...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // 删除旧版本缓存
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] 删除旧缓存:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('[Service Worker] 激活完成');
      return self.clients.claim(); // 立即控制所有页面
    })
  );
});

// 拦截网络请求
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // 缓存命中 - 返回缓存
        if (response) {
          console.log('[Service Worker] 从缓存返回:', event.request.url);
          return response;
        }

        // 没有缓存 - 发起网络请求
        console.log('[Service Worker] 网络请求:', event.request.url);
        return fetch(event.request).then((response) => {
          // 检查是否是有效响应
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // 克隆响应(因为响应流只能用一次)
          const responseToCache = response.clone();

          // 将新请求的资源添加到缓存
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });

          return response;
        }).catch((error) => {
          console.log('[Service Worker] 请求失败:', error);
          // 可以返回一个离线页面
          return new Response('离线模式 - 无法加载资源', {
            status: 503,
            statusText: 'Service Unavailable',
            headers: new Headers({
              'Content-Type': 'text/plain'
            })
          });
        });
      })
  );
});

// 后台同步(可选)
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-training-data') {
    event.waitUntil(syncTrainingData());
  }
});

// 同步训练数据函数(示例)
async function syncTrainingData() {
  console.log('[Service Worker] 同步训练数据...');
  // 这里可以添加数据同步逻辑
}

// 推送通知(可选)
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : '该休息眼睛啦!',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    }
  };

  event.waitUntil(
    self.registration.showNotification('视力训练提醒', options)
  );
});

// 点击通知
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] 通知被点击');
  event.notification.close();

  event.waitUntil(
    clients.openWindow('/')
  );
});
