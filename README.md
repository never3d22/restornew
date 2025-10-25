# RestorNew — платформа онлайн-заказа еды

Полностью рабочий прототип платформы для просмотра меню, оформления заказов и администрирования ресторана. Репозиторий содержит API на Hono/tRPC + Drizzle/MySQL и мобильное приложение на Expo/React Native с управлением состоянием через Zustand и React Query.

## Содержание
- [Структура монорепозитория](#структура-монорепозитория)
- [Возможности](#возможности)
- [Чек-лист быстрого запуска](#чек-лист-быстрого-запуска)
- [Подготовка сервера с нуля (Node.js + MySQL)](#подготовка-сервера-с-нуля-nodejs--mysql)
- [Настройка backend](#настройка-backend)
- [Настройка мобильного приложения](#настройка-мобильного-приложения)
- [Настройка веб-приложения](#настройка-веб-приложения)
- [Публикация API в браузере (https://roteelonoogu.beget.app)](#публикация-api-в-браузере-httpsroteelonoogu-beget-app)
- [Документация по сценариям](#документация-по-сценариям)
- [Основные эндпоинты tRPC](#основные-эндпоинты-trpc)
- [SMS и авторизация](#sms-и-авторизация)
- [Развитие](#развитие)
- [Лицензия](#лицензия)

## Структура монорепозитория

```
backend/  — Hono + tRPC API, Drizzle ORM, миграции и сиды
mobile/   — Expo-приложение (iOS, Android, Web) для клиентов и админов
web/      — Веб-клиент на React + Vite для браузера
```

## Возможности

### Клиентские приложения
- 📋 Просмотр меню по категориям.
- 🛒 Корзина с изменением количества позиций и подсчетом суммы.
- 📦 Создание заказов и просмотр истории.
- 🏠 Управление адресами доставки.
- 🔐 Авторизация по SMS-коду (тестовый код 1234).
- 🌐 Веб-интерфейс с тем же функционалом, что и мобильное приложение.

### Администрирование
- 📚 Создание категорий и блюд через tRPC-методы.
- 📦 Просмотр всех заказов с составом и суммой.
- 🔁 Изменение статусов заказов (pending → confirmed/delivered/cancelled).
- 🔑 Доступ защищен заголовком `x-admin-secret` (см. переменные окружения).

## Чек-лист быстрого запуска

1. **Клонировать репозиторий:** `git clone ... && cd restornew`.
2. **Подготовить MySQL:** создать базу `restornew_app` и пользователя `restornew_app` с паролем `i*2ubUF7LOaG` (через Docker или системный MySQL).
3. **Заполнить `.env` в `backend/`, `mobile/` и `web/`.**
4. **Установить зависимости:** `npm install` в обоих пакетах.
5. **Применить миграции и сиды:** `npm run db:push && npm run db:seed`.
6. **Запустить API:** `npm run dev`.
7. **Запустить Expo:** `npm run start` и отсканировать QR-код в Expo Go.

Подробные инструкции с командами — в следующих разделах и дополнительных файлах документации. Если подключаетесь к серверу через PuTTY на Windows, воспользуйтесь отдельным гидом [docs/putty-ssh.md](docs/putty-ssh.md).

## Подготовка сервера с нуля (Node.js + MySQL)

> Выполняйте шаги по порядку на новом сервере Ubuntu 22.04+, где уже есть Node.js (например, от beget.com). Все команды запускаются от пользователя `root`. Если работаете из-под другого пользователя, добавьте `sudo`.

1. **Обновите пакеты и поставьте MySQL Server:**
   ```bash
   apt update
   apt install mysql-server -y
   ```
   Статус службы: `systemctl status mysql`. Если нужно перезапустить: `systemctl restart mysql`.
2. **(Опционально) Запустите мастер безопасности:**
   ```bash
   mysql_secure_installation
   ```
   Можно пропустить, если планируете вручную задать пароли.
3. **Создайте базу и пользователя:**
   ```bash
   mysql
   ```
   В интерактивной консоли выполните:
   ```sql
   CREATE DATABASE IF NOT EXISTS restornew_app CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   CREATE USER IF NOT EXISTS 'restornew_app'@'localhost' IDENTIFIED BY 'i*2ubUF7LOaG';
   GRANT ALL PRIVILEGES ON restornew_app.* TO 'restornew_app'@'localhost';
   FLUSH PRIVILEGES;
   ```
   Пароль должен быть `i*2ubUF7LOaG`, чтобы совпадать с конфигурацией проекта. Выйдите командой `exit;`.
4. **Проверьте вход от нового пользователя:**
   ```bash
   mysql -u restornew_app -p'i*2ubUF7LOaG' -e "SHOW DATABASES;"
   ```
   Если видите `restornew_app` — доступ настроен. При ошибке `Access denied` перепроверьте пароль и хост в `CREATE USER`.
5. **(Опционально) Разрешите root-вход по паролю:**
   ```sql
   ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'your-strong-password';
   ```
   Этот шаг пригодится, если хотите подключаться внешними инструментами.
6. **Альтернатива для локальной разработки — Docker Compose:**
   ```bash
   docker compose up -d
   ```
   Файл `docker-compose.yml` поднимет MySQL 8.0 с теми же базой и пользователем (`restornew_app` / `i*2ubUF7LOaG`). После первого запуска проверьте доступ командой `mysql -h 127.0.0.1 -u restornew_app -p'i*2ubUF7LOaG' -e "SHOW DATABASES;"`.

## Настройка backend

> Рабочая директория далее — `/var/www/html/backend` (для сервера) или `backend/` (для локальной машины).

1. **Создайте `.env` из шаблона:**
   ```bash
   cd backend
   cp .env.example .env
   ```
   Откройте файл (`nano .env`) и задайте переменные:
   ```env
   DATABASE_URL=mysql://restornew_app:i*2ubUF7LOaG@127.0.0.1:3306/restornew_app
   ADMIN_SECRET=super-secret
   PORT=3000
   ```
   - `DATABASE_URL` — используйте реальные логин, пароль и хост.
   - `ADMIN_SECRET` — произвольная строка, которой будут подписываться админ-запросы (заголовок `x-admin-secret`). Сообщите её только администраторам — они вводят значение вручную в приложении.
   - `PORT` — порт, на котором будет работать API.
2. **(Опционально) Укажите зеркало npm, если основной registry недоступен:**
   ```bash
   echo "registry=https://registry.npmmirror.com" > ~/.npmrc
   ```
   Удалите файл, когда необходимость отпадёт.
3. **Установите зависимости и соберите схему:**
   ```bash
   npm install
   npm run db:push
   npm run db:seed
   ```
   - Если `npm install` завершился ошибкой из-за пакета, повторите команду или добавьте зеркало.
   - Если видите `Access denied for user`, вернитесь к шагу с MySQL и перепроверьте `DATABASE_URL`.
4. **Запустите в режиме разработки:**
   ```bash
   npm run dev
   # API доступно на http://localhost:3000, tRPC на /trpc
   ```
   Сервер логирует `API running on http://localhost:3000`. Остановить — `Ctrl+C`.
5. **Соберите production-бандл:**
   ```bash
   npm run build
   node dist/index.js
   ```
   Команда пригодится при запуске через systemd.

## Настройка мобильного приложения

> Рабочая директория — `mobile/`.

1. **Создайте `.env`:**
   ```bash
   cd mobile
   cp .env.example .env
   ```
   Заполните переменные:
   ```env
   EXPO_PUBLIC_API_URL=https://roteelonoogu.beget.app/trpc
   ```
   Для локальной разработки замените хост на `http://<IP-сервера>:3000/trpc`.
   Администраторский секрет вводится в приложении на вкладке «Админ» (см. [docs/expo-go.md](docs/expo-go.md)).
2. **Установите зависимости:** `npm install`.
3. **Запустите Expo:** `npm run start` и следуйте инструкциям в консоли (см. [docs/expo-go.md](docs/expo-go.md) для подробного гайда по Expo Go и веб-версии).

## Настройка веб-приложения

> Рабочая директория — `web/`. Текущая версия фронтенда — витрина онлайн-кинотеатра, которая получает каталог и iframe-плеер непосредственно из Videobalancer.

1. **Установите зависимости:**
   ```bash
   cd web
   npm install
   ```
2. **Запустите режим разработки:**
   ```bash
   npm run dev -- --host 0.0.0.0 --port 5173
   ```
   Откройте `http://localhost:5173` (или `http://<IP>:5173` при запуске на удалённом сервере). В шапке находится строка поиска, а слева — фильтры и результаты каталога. Выбор материала сразу загружает iframe с тестовым или реальным плеером Videobalancer.
3. **Соберите production-версию:**
   ```bash
   npm run build
   ```
   Готовые статические файлы будут в `web/dist/` — их можно отдать через любой веб-сервер.
4. **Предпросмотр собранной версии:**
   ```bash
   npm run preview -- --host 0.0.0.0 --port 4173
   ```
   Команда полезна для быстрой проверки деплоя: приложение откроется на `http://localhost:4173`.

> ℹ️ Токен Videobalancer, переданный заказчиком, зашит в клиент (`src/api/videobalancer.ts`). Если нужно подставить другой ключ, обновите константу `API_TOKEN` и пересоберите проект.

## Публикация API в браузере (`https://roteelonoogu.beget.app`)

Следующий чек-лист ориентирован на сервер beget.com с путями `/var/www/html/backend`. Выполняйте шаги последовательно.

1. **Подготовьте backend:**
   ```bash
   cd /var/www/html/backend
   cp .env.example .env       # если файла ещё нет
   nano .env                  # пропишите DATABASE_URL, ADMIN_SECRET, PORT
   npm install
   npm run db:push
   npm run db:seed
   npm run build
   ```
   - В `DATABASE_URL` укажите созданного пользователя MySQL (`mysql://restornew_app:i*2ubUF7LOaG@127.0.0.1:3306/restornew_app`).
   - При ошибках npm используйте зеркало (`/var/www/html/.npmrc`) и повторите установку.
   - Если миграции падают с `Access denied`, вернитесь к разделу MySQL, обновите пользователя и пароль.
2. **Создайте systemd-сервис, чтобы API работало в фоне:**
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
   - В статусе должно быть `Active: active (running)`.
   - Просмотр логов: `journalctl -u restornew.service -f`.
   - Перед запуском `npm run dev` обязательно остановите сервис: `sudo systemctl stop restornew.service`, иначе порт 3000 будет занят (`EADDRINUSE`).
3. **Проверьте API напрямую:**
   ```bash
   curl http://127.0.0.1:3000/
   curl http://127.0.0.1:3000/health
   ```
   Убедитесь, что ответы приходят без ошибок.
4. **Откройте порты в UFW (если включен):**
   ```bash
   sudo ufw allow 80
   sudo ufw allow 443
   sudo ufw allow 3000   # только если нужен прямой доступ без прокси
   sudo ufw status
   ```
5. **Настройте Nginx как обратный прокси для домена:**
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
   - Если `nginx -t` сообщает `unknown directive "application/javascript"`, восстановите файл маппинга MIME: `sudo cp /usr/share/nginx/mime.types /etc/nginx/mime.types` и повторите тест.
6. **(Опционально) Подключите HTTPS через Let’s Encrypt:**
   ```bash
   sudo apt install certbot python3-certbot-nginx -y
   sudo certbot --nginx -d roteelonoogu.beget.app
   ```
   Certbot автоматически обновит конфигурацию и настроит автообновление сертификатов.
7. **Проверьте из браузера:**
   - `https://roteelonoogu.beget.app` — HTML-заглушка API.
   - `https://roteelonoogu.beget.app/health` — текст `healthy`.
   - `https://roteelonoogu.beget.app/trpc` — tRPC-эндпоинт для клиентов.
8. **Обновите мобильное приложение:** поменяйте `EXPO_PUBLIC_API_URL` в `mobile/.env` на HTTPS-адрес и перезапустите Expo (`npm run start`).

Подробный сценарий с дополнительными проверками приведён в [docs/browser-access.md](docs/browser-access.md).

## Документация по сценариям

- [docs/browser-access.md](docs/browser-access.md) — расширенное руководство по выводу backend в интернет и настройке Nginx/SSL.
- [docs/expo-go.md](docs/expo-go.md) — пошаговое подключение Expo Go, запуск веб-версии и советы по отладке.
- [docs/putty-ssh.md](docs/putty-ssh.md) — подключение к серверу через PuTTY, копирование команд и передача файлов по SFTP.
- [docs/web-client.md](docs/web-client.md) — развёртывание веб-клиента на Vite (локально и на сервере с Nginx).

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

## Лицензия

Проект доступен под лицензией MIT. Вы можете адаптировать код под нужды ресторана, расширять схему данных и интегрировать сторонние сервисы.
