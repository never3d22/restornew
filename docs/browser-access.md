# Публикация RestorNew в браузере (`https://roteelonoogu.beget.app`)

Документ описывает полный сценарий вывода backend на сервере beget.com. Каждый шаг можно отмечать галочкой.

## Предварительные условия

- Сервер Ubuntu 22.04+ с SSH-доступом (`root@185.207.0.192`).
- Node.js уже установлен (beget предустанавливает Node.js 22).
- Путь с исходниками: `/var/www/html`.
- Домен beget: `https://roteelonoogu.beget.app`.

## Шаг 1. Клонировать или обновить код

```bash
cd /var/www/html
# при первом деплое
# git clone <repo-url> restornew
# при обновлении
cd restornew && git pull
```

Backend должен лежать в `/var/www/html/backend`. Если папка называется иначе — скорректируйте пути в командах ниже.

## Шаг 2. Подготовить MySQL

1. Установите сервер, если его ещё нет:
   ```bash
   apt update
   apt install mysql-server -y
   ```
2. Создайте базу и пользователя (выполняется один раз):
   ```bash
   mysql
   ```
   ```sql
   CREATE DATABASE IF NOT EXISTS restornew_app CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   CREATE USER IF NOT EXISTS 'restornew_app'@'localhost' IDENTIFIED BY 'i*2ubUF7LOaG';
   GRANT ALL PRIVILEGES ON restornew_app.* TO 'restornew_app'@'localhost';
   FLUSH PRIVILEGES;
   ```
   Пароль должен быть `i*2ubUF7LOaG` — он используется во всех шаблонах `.env`.
3. Проверьте вход от нового пользователя:
   ```bash
   mysql -u restornew_app -p'i*2ubUF7LOaG' -e "SHOW DATABASES;"
   ```
   Вывод должен содержать `restornew_app`.

## Шаг 3. Создать и проверить `.env`

```bash
cd /var/www/html/backend
cp .env.example .env   # если файла не было
nano .env
```

Минимальный набор переменных:
```env
DATABASE_URL=mysql://restornew_app:i*2ubUF7LOaG@127.0.0.1:3306/restornew_app
ADMIN_SECRET=super-secret
PORT=3000
```

- `DATABASE_URL` — логин, пароль и база должны совпадать с созданными ранее значениями.
- `ADMIN_SECRET` — строка для заголовка `x-admin-secret`. Сообщите значение только администраторам — они вводят его вручную в приложении.
- `PORT` — порт API. Если меняете, не забудьте обновить proxy-конфиг и переменные мобильного клиента.

Проверьте файл командой `cat .env` — значения должны быть без кавычек и лишних пробелов.

## Шаг 4. Установить зависимости и подготовить базу

```bash
cd /var/www/html/backend
npm install
npm run db:push
npm run db:seed
npm run build
```

Советы по устранению ошибок:
- **`npm error ETARGET`** — временно укажите зеркало npm: `echo "registry=https://registry.npmmirror.com" > ~/.npmrc`, повторите `npm install`, затем удалите `.npmrc`.
- **`Access denied for user 'restornew_app'@'localhost'`** — перепроверьте пароль в `.env` и права пользователя в MySQL (`GRANT ALL PRIVILEGES`).
- **`DrizzleError ... specify "mode"`** — убедитесь, что используете актуальную версию репозитория (в `src/db/index.ts` параметр `mode: "default"`).

После `npm run build` должна появиться папка `dist/`.

## Шаг 5. Настроить systemd-сервис

```bash
sudo tee /etc/systemd/system/restornew.service >/dev/null <<'EOF_SERVICE'
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
EOF_SERVICE

sudo systemctl daemon-reload
sudo systemctl enable --now restornew.service
sudo systemctl status restornew.service
```

- При необходимости перезапускайте сервис: `sudo systemctl restart restornew.service`.
- Логи в реальном времени: `journalctl -u restornew.service -f`.
- Перед запуском `npm run dev` остановите сервис: `sudo systemctl stop restornew.service`.

## Шаг 6. Проверить API локально

```bash
curl http://127.0.0.1:3000/
curl http://127.0.0.1:3000/health
```

HTML-заглушка и текст `healthy` подтверждают, что backend готов к публикации.

## Шаг 7. Настроить фаервол (UFW)

```bash
sudo ufw allow 80
sudo ufw allow 443
sudo ufw allow 3000   # можно пропустить, если порт 3000 нужен только прокси
sudo ufw status
```

## Шаг 8. Настроить Nginx

1. Установите и активируйте Nginx:
   ```bash
   sudo apt install nginx -y
   ```
2. Создайте конфигурацию для домена:
   ```bash
   sudo tee /etc/nginx/sites-available/roteelonoogu.beget.app >/dev/null <<'EOF_NGINX'
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
   EOF_NGINX

   sudo ln -sf /etc/nginx/sites-available/roteelonoogu.beget.app /etc/nginx/sites-enabled/roteelonoogu.beget.app
   sudo nginx -t
   sudo systemctl reload nginx
   ```
3. Если команда `nginx -t` выдаёт `unknown directive "application/javascript"`, восстановите файл MIME-типов:
   ```bash
   sudo cp /usr/share/nginx/mime.types /etc/nginx/mime.types
   sudo nginx -t
   sudo systemctl reload nginx
   ```
   Ошибка возникает, если файл `/etc/nginx/mime.types` был случайно изменён при копировании команд из консоли.

## Шаг 9. Подключить HTTPS (опционально)

```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d roteelonoogu.beget.app
```

Certbot настроит переадресацию HTTP→HTTPS и создаст cron-задачу для продления сертификата.

## Шаг 10. Финальная проверка

1. Откройте в браузере `https://roteelonoogu.beget.app` — появится HTML-страница состояния API.
2. Проверьте `https://roteelonoogu.beget.app/health` — ответ `healthy`.
3. Проверьте `https://roteelonoogu.beget.app/trpc` — JSON с сообщением об ошибке формата tRPC (нормально для GET).
4. Если используете Expo, обновите `mobile/.env` и перезапустите Expo (`npm run start`).

Чтобы развернуть полноценный веб-интерфейс (React + Vite), выполните шаги из [docs/web-client.md](./web-client.md) — он может работать на отдельном поддомене и использовать тот же backend.

## Частые проблемы

| Симптом | Решение |
|---------|---------|
| `Error: Environment validation failed` | Проверьте, что `.env` доступен сервису systemd и содержит `DATABASE_URL`. После изменения файла перезапустите сервис. |
| `listen EADDRINUSE: 0.0.0.0:3000` | Порт 3000 уже занят (обычно запущен systemd-сервис). Остановите сервис или используйте другой порт. |
| `Access denied for user` при миграции | Пересоздайте пользователя MySQL с правильным паролем, обновите `DATABASE_URL`. |
| `nginx: [emerg] unknown directive "application/javascript"` | Восстановите `/etc/nginx/mime.types` из `/usr/share/nginx/mime.types` и повторите `nginx -t`. |
| Expo не видит API | Убедитесь, что адрес в `mobile/.env` использует HTTPS и домен, а не `localhost`, когда запускаете на телефоне. |

Backend готов к работе в браузере и обслуживает мобильное приложение по HTTPS.
