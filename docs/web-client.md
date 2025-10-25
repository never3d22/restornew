# Веб-клиент RestorNew (React + Vite)

Фронтенд переведён в режим онлайн-кинотеатра и теперь работает поверх публичного API Videobalancer (`https://api.apbugall.org`). Backend проекта не требуется: каталог фильмов, карточки и iframe-плеер загружаются непосредственно по API.

## 1. Локальная разработка

1. Перейдите в каталог `web/` и установите зависимости:
   ```bash
   cd web
   npm install
   ```
2. Запустите Vite в режиме разработки:
   ```bash
   npm run dev -- --host 0.0.0.0 --port 5173
   ```
3. Откройте `http://localhost:5173` (или `http://<IP>:5173`, если подключаетесь удалённо). В левой колонке появятся фильтры и результаты каталога, а справа — карточка выбранного фильма/сериала с плеером и выбором озвучек. При отсутствии доступных iframe используется тестовая заглушка (`https://api.apbugall.org/iframe/test`).

## 2. Сборка production-бандла

1. Соберите приложение:
   ```bash
   npm run build
   ```
   Готовые статические файлы появятся в `web/dist/`.
2. Проверьте production-сборку локально:
   ```bash
   npm run preview -- --host 0.0.0.0 --port 4173
   ```
   По умолчанию приложение будет доступно на `http://localhost:4173`.

## 3. Публикация на сервере

1. Скопируйте содержимое `web/dist/` в директорию, которую раздаёт ваш веб-сервер (Nginx, Apache, Vercel, Netlify и т.д.). Пример для Nginx на Ubuntu:
   ```bash
   sudo mkdir -p /var/www/html/videobalancer-app
   sudo cp -r dist/* /var/www/html/videobalancer-app/
   ```
2. Настройте виртуальный хост для статики:
   ```bash
   sudo tee /etc/nginx/sites-available/cinema.example.com >/dev/null <<'NGINX'
   server {
     listen 80;
     server_name cinema.example.com;

     root /var/www/html/videobalancer-app;
     index index.html;

     location / {
       try_files $uri /index.html;
     }
   }
   NGINX

   sudo ln -sf /etc/nginx/sites-available/cinema.example.com /etc/nginx/sites-enabled/cinema.example.com
   sudo nginx -t
   sudo systemctl reload nginx
   ```
3. Подключите HTTPS через Certbot или используемый вами хостинг.

## 4. Обновление версии

1. Обновите репозиторий (`git pull`).
2. Повторно выполните `npm install` (если появились новые зависимости) и `npm run build`.
3. Замените содержимое директории с продакшн-файлами свежей сборкой.

## 5. Проверка после деплоя

- `curl -I https://cinema.example.com` — должен возвращать `200 OK`.
- Откройте сайт в браузере и убедитесь, что каталог подгружается, а при выборе фильма появляется рабочий плеер.
- Проследите в DevTools → Network, что запросы уходят на `https://api.apbugall.org` и возвращают статус `200`.

> ℹ️ Ключ Videobalancer сохранён внутри `src/api/videobalancer.ts`. Чтобы сменить ключ, обновите константу `API_TOKEN` и соберите фронтенд заново.
