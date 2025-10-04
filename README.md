# RestorNew — платформа онлайн-заказа еды

Полностью рабочий прототип платформы для просмотра меню, оформления заказов и администрирования ресторана. Репозиторий содержит API на Hono/tRPC + Drizzle/MySQL и мобильное приложение на Expo/React Native с управлением состоянием через Zustand и React Query.

## Структура монорепозитория

```
backend/  — Hono + tRPC API, Drizzle ORM, миграции и сиды
mobile/   — Expo-приложение (iOS, Android, Web) для клиентов и админов
```

## Возможности

### Клиентское приложение
- 📋 Просмотр меню по категориям.
- 🛒 Корзина с изменением количества позиций и подсчетом суммы.
- 📦 Создание заказов и просмотр истории.
- 🏠 Управление адресами доставки.
- 🔐 Авторизация по SMS-коду (тестовый код 1234).

### Администрирование
- 📚 Создание категорий и блюд через tRPC-методы.
- 📦 Просмотр всех заказов с составом и суммой.
- 🔁 Изменение статусов заказов (pending → confirmed/delivered/cancelled).
- 🔑 Доступ защищен заголовком `x-admin-secret` (см. переменные окружения).

## Настройка окружения

1. Создайте базу данных MySQL. Подключитесь по SSH на сервер (`ssh root@185.207.0.192`) и уже **на самом сервере** выполните команды ниже. Внешние подключения к MySQL закрыты, поэтому используйте `localhost`. На хостинге root по умолчанию авторизуется через `unix_socket`, поэтому сначала откройте интерактивную консоль без пароля:
   ```bash
   sudo mysql
   ```
   Внутри оболочки MySQL создайте базу и (при необходимости) пользователя:
   ```sql
   CREATE DATABASE IF NOT EXISTS restornew CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   CREATE USER IF NOT EXISTS 'restornew'@'%' IDENTIFIED BY 'restornew-password';
   GRANT ALL PRIVILEGES ON restornew.* TO 'restornew'@'%';
   FLUSH PRIVILEGES;
   ```
   Если нужен вход под `root` с паролем, выполните `ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'your-password';` и затем выходите командой `exit;`.
2. Клонируйте репозиторий и установите зависимости:
   ```bash
   cd backend && npm install
   cd ../mobile && npm install
   ```
3. Скопируйте `.env.example` в `.env` в каждом пакете и пропишите значения:
   - `backend/.env`
     ```env
   DATABASE_URL=mysql://restornew:restornew-password@127.0.0.1:3306/restornew
    ADMIN_SECRET=super-secret
    PORT=3000
    ```
   - `mobile/.env`
     ```env
     EXPO_PUBLIC_API_URL=http://185.207.0.192:3000/trpc
     EXPO_PUBLIC_ADMIN_SECRET=super-secret
     ```
   Для локальной разработки можно оставить значения по умолчанию, указав `localhost` вместо внешнего IP.
4. Примените схему/сиды:
   ```bash
   cd backend
   npm run db:push
   npm run db:seed
   ```
5. Запустите API:
   ```bash
   npm run dev
   # API доступно на http://localhost:3000 (порт настраивается переменной PORT), tRPC на /trpc
   ```
   Приложение слушает на `0.0.0.0`, поэтому при развёртывании убедитесь, что порт `3000` открыт в фаерволе.
6. Запустите Expo-приложение в другом терминале:
   ```bash
   cd mobile
   npm run start
   ```
Expo Dev Tools предложит открыть приложение в iOS/Android симуляторе, на устройстве или в веб-браузере.

## Публикация API в браузере (`https://roteelonoogu.beget.app`)

Ниже — чек-лист, который можно выполнять по порядку, чтобы backend был доступен по вашей ссылке от beget.com. Все команды выполняются на сервере после входа по SSH.

1. **Подготовьте приложение.**
   ```bash
   cd /var/www/html/backend
   cp .env.example .env # если файл ещё не создан
   nano .env            # укажите DATABASE_URL, ADMIN_SECRET и PORT=3000
   npm install          # устанавливаем prod+dev зависимости, чтобы был доступен tsup/tsx
   npm run db:push
   npm run db:seed
   npm run build
   ```
   Если при `npm install` появится ошибка доступа к registry, повторите команду позже или используйте зеркало npm (например, `registry=https://registry.npmmirror.com` в файле `.npmrc`).

2. **Запустите backend как systemd-сервис**, чтобы он работал в фоне и перезапускался автоматически.
   ```bash
   sudo tee /etc/systemd/system/restornew.service >/dev/null <<'EOF'
   [Unit]
   Description=RestorNew API
   After=network.target

   [Service]
   Type=simple
   WorkingDirectory=/var/www/html/backend
   ExecStart=/usr/bin/node --enable-source-maps /var/www/html/backend/dist/index.js
   Restart=always
   RestartSec=5
   EnvironmentFile=/var/www/html/backend/.env

   [Install]
   WantedBy=multi-user.target
   EOF

   sudo systemctl daemon-reload
   sudo systemctl enable --now restornew.service
   sudo systemctl status restornew.service
   ```
   Убедитесь, что в статусе нет ошибок и строка `API running on http://localhost:3000` присутствует в логе (`journalctl -u restornew.service -f`).

3. **Проверьте API локально на сервере.**
   ```bash
   curl http://127.0.0.1:3000/health
   curl http://127.0.0.1:3000/
   ```
   В ответе `/` должно прийти HTML с подсказками.

4. **Откройте нужные порты в фаерволе (если включен UFW).**
   ```bash
   sudo ufw allow 80
   sudo ufw allow 443
   sudo ufw allow 3000    # нужен только если хотите доступ напрямую без прокси
   sudo ufw status
   ```

5. **Установите и настройте Nginx как reverse-proxy для домена `roteelonoogu.beget.app`.**
   ```bash
   sudo apt update
   sudo apt install nginx -y

   sudo tee /etc/nginx/sites-available/roteelonoogu.beget.app >/dev/null <<'EOF'
   server {
     listen 80;
     server_name roteelonoogu.beget.app;

     location / {
       proxy_pass http://127.0.0.1:3000;
       proxy_http_version 1.1;
       proxy_set_header Host $host;
       proxy_set_header X-Real-IP $remote_addr;
       proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
       proxy_set_header X-Forwarded-Proto $scheme;
     }
   }
   EOF

   sudo ln -sf /etc/nginx/sites-available/roteelonoogu.beget.app /etc/nginx/sites-enabled/roteelonoogu.beget.app
   sudo nginx -t
   sudo systemctl reload nginx
   ```
   Теперь прокси будет перенаправлять HTTP-запросы с домена на backend. Для HTTPS настройте Let’s Encrypt (см. пункт ниже).

6. **(Опционально) Выпустите SSL-сертификат Let's Encrypt.**
   ```bash
   sudo apt install certbot python3-certbot-nginx -y
   sudo certbot --nginx -d roteelonoogu.beget.app
   ```
   Certbot автоматически обновит конфигурацию Nginx и настроит переадресацию HTTP→HTTPS.

7. **Проверьте доступность из браузера.**
   - Откройте `https://roteelonoogu.beget.app` — должна появиться HTML-страница статуса API.
   - `https://roteelonoogu.beget.app/health` вернёт текст `healthy`.
   - tRPC клиентам (включая Expo-приложение) используйте `https://roteelonoogu.beget.app/trpc`.

8. **Обновите мобильное приложение.**
   В `mobile/.env` пропишите публичный URL:
   ```env
   EXPO_PUBLIC_API_URL=https://roteelonoogu.beget.app/trpc
   EXPO_PUBLIC_ADMIN_SECRET=super-secret
   ```
   После этого перезапустите Expo (`npm run start`).

Если домен обслуживается не Nginx, адаптируйте шаг 5 под используемый веб-сервер (Apache, Caddy и т.д.), главное — пробросить запросы с 80/443 порта на 3000.

## Основные эндпоинты tRPC

| Процедура | Описание |
|-----------|----------|
| `menu.list` | Список категорий с блюдами. |
| `orders.create` | Создание заказа из корзины авторизованного клиента. |
| `orders.history` | История заказов клиента. |
| `addresses.*` | Получение и создание адресов доставки. |
| `auth.requestCode` | Отправка тестового SMS-кода (логируется в консоль). |
| `auth.verifyCode` | Подтверждение кода, создание пользователя. |
| `admin.*` | Управление категориями, блюдами и статусами заказов (через `x-admin-secret`). |

## SMS и авторизация

Интеграция с SMS.ru представлена заглушкой: код всегда `1234`, а отправка логируется в консоль сервера. Логику можно расширить, заменив `auth.requestCode` на реальный вызов API SMS.ru.

## Развитие

- 💳 Добавление платежного шлюза и статусов оплаты.
- 🔔 Push-уведомления для клиентов и курьеров.
- 📈 Метрики производительности (Prometheus, Sentry).
- 🧪 Автотесты (unit + e2e) и CI/CD на beget или GitHub Actions.

## Деплой на сервер beget.com

1. Подключитесь по SFTP к `185.207.0.192:22` с учётными данными `root` / `i*2ubUF7LOaG` и загрузите содержимое репозитория в каталог `/var/www/html` (backend располагается в `/var/www/html/backend`).
2. На сервере выполните шаги из раздела «Настройка окружения» (установка зависимостей, заполнение `.env`, миграции и сиды).
3. Запустите API как системный сервис или через `pm2`:
   ```bash
   cd /var/www/html/backend
   npm run build
   node dist/index.js
   ```
4. Для мобильного приложения пропишите в `.env` публичный URL API (`http://185.207.0.192:3000/trpc`) и соберите билд через Expo.

## Лицензия

Проект доступен под лицензией MIT. Вы можете адаптировать код под нужды ресторана, расширять схему данных и интегрировать сторонние сервисы.
