# Веб-клиент RestorNew (React + Vite)

Руководство поможет запустить и опубликовать браузерную версию RestorNew. Она использует те же tRPC-эндпоинты, что и мобильное приложение, поэтому backend должен быть доступен по HTTPS (например, `https://roteelonoogu.beget.app/trpc`).

## 1. Локальная разработка

1. Перейдите в каталог `web/` и создайте `.env`:
   ```bash
   cd web
   cp .env.example .env
   ```
2. Укажите адрес API в `.env` (локально можно использовать `http://127.0.0.1:3000/trpc`):
   ```env
   VITE_API_URL=http://127.0.0.1:3000/trpc
   ```
3. Установите зависимости и запустите Vite:
   ```bash
   npm install
   npm run dev -- --host 0.0.0.0 --port 5173
   ```
4. Откройте `http://localhost:5173` (или `http://<IP>:5173`, если тестируете с телефона). В шапке есть блок авторизации по SMS и поле для ввода админ-секрета.

## 2. Сборка production-бандла

1. Соберите приложение:
   ```bash
   npm run build
   ```
   В каталоге `web/dist/` появятся статические файлы.
2. Проверьте собранную версию локально:
   ```bash
   npm run preview -- --host 0.0.0.0 --port 4173
   ```
   По умолчанию приложение будет доступно на `http://localhost:4173`.

## 3. Публикация на сервере beget.com

Ниже пример деплоя на том же сервере, где работает backend. Предполагается, что исходники лежат в `/var/www/html/restornew/web` и у вас уже настроен домен `roteelonoogu.beget.app` для API.

1. Подготовьте `.env` и установите зависимости:
   ```bash
   cd /var/www/html/restornew/web
   cp .env.example .env
   nano .env               # VITE_API_URL=https://roteelonoogu.beget.app/trpc
   npm install
   npm run build
   ```
2. Скопируйте результат в директорию, откуда Nginx будет отдавать статику:
   ```bash
   mkdir -p /var/www/html/web-dist
   cp -r dist/* /var/www/html/web-dist/
   ```
3. Создайте отдельный сервер или поддомен для фронтенда, чтобы не мешать API. Например, `app.roteelonoogu.beget.app`:
   ```bash
   sudo tee /etc/nginx/sites-available/app.roteelonoogu.beget.app >/dev/null <<'EOF'
   server {
     listen 80;
     server_name app.roteelonoogu.beget.app;

     root /var/www/html/web-dist;
     index index.html;

     location / {
       try_files $uri /index.html;
     }
   }
   EOF

   sudo ln -sf /etc/nginx/sites-available/app.roteelonoogu.beget.app /etc/nginx/sites-enabled/app.roteelonoogu.beget.app
   sudo nginx -t
   sudo systemctl reload nginx
   ```
   После этого фронтенд будет доступен по адресу `http://app.roteelonoogu.beget.app`. Подключите HTTPS через Certbot при необходимости.
4. Если хотите обслуживать фронтенд с того же домена, что и API, настройте отдельный путь (например, `/app`) и используйте относительный `base` в Vite. В текущей конфигурации проще держать API на `roteelonoogu.beget.app`, а веб-клиент на поддомене.

## 4. Обновление версии

1. Обновите репозиторий (`git pull`).
2. Повторите сборку: `npm install` (если нужны новые зависимости) и `npm run build`.
3. Перекопируйте `dist/*` в `/var/www/html/web-dist/`.
4. Перезапустите `npm run preview` (если используете его) или просто перезагрузите Nginx после обновления файлов.

## 5. Проверка после деплоя

- `curl -I https://app.roteelonoogu.beget.app` — должен возвращать `200 OK`.
- Откройте фронтенд в браузере, авторизуйтесь и оформите тестовый заказ.
- Проверьте, что запросы к tRPC уходят на `https://roteelonoogu.beget.app/trpc` (видно в DevTools → Network).

> 💡 Админ-секрет нигде не хранится в коде — вводите его вручную при каждом входе. Если секрет меняется, обновите и мобильное приложение, и браузерную версию.
