# Expo Go и веб-версия RestorNew

Инструкция поможет запустить мобильное приложение на телефоне через Expo Go и проверить веб-версию.

## Требования

- Смартфон с установленным приложением [Expo Go](https://expo.dev/go) (iOS или Android).
- Компьютер/сервер с Node.js ≥ 18 и npm.
- Доступ к backend (локально или по адресу `https://roteelonoogu.beget.app`).
- Общая сеть Wi‑Fi для телефона и машины, где запускается Expo, или готовность использовать туннель Expo.

## Шаг 1. Подготовить backend

1. Убедитесь, что API запущено и доступно: `curl http://<host>:3000/health` или `https://roteelonoogu.beget.app/health`.
2. Если backend работает на сервере, убедитесь, что порт 3000 закрыт фаерволом либо доступен через Nginx (см. [browser-access.md](browser-access.md)).

## Шаг 2. Создать мобильный `.env`

```bash
cd /var/www/html/mobile   # или локальный путь к каталогу mobile
cp .env.example .env
nano .env
```

Пример значений:
```env
EXPO_PUBLIC_API_URL=https://roteelonoogu.beget.app/trpc
EXPO_PUBLIC_ADMIN_SECRET=super-secret
```

- Если запускаете Expo и backend на одной машине локально, используйте IP компьютера в вашей сети: `http://192.168.X.Y:3000/trpc`.
- Значение `EXPO_PUBLIC_ADMIN_SECRET` должно совпадать с `ADMIN_SECRET` в backend.

## Шаг 3. Установить зависимости

```bash
npm install
```

Если npm сообщает о несовместимых версиях пакетов, установите рекомендуемые версии:
```bash
npx expo install react-native@0.74.5 react-native-gesture-handler@~2.16.1 react-native-safe-area-context@4.10.5 react-native-screens@3.31.1
npm install --save-dev @types/react@~18.2.79 typescript@~5.3.3
```

## Шаг 4. Запустить Expo dev server

```bash
npm run start
```

В терминале появится QR-код и подсказки:
- `a` — открыть Android-эмулятор.
- `w` — запустить веб-версию в браузере.
- `s` — переключиться в режим development build.
- `r` — перезапустить приложение.

### Использование телефона

1. Откройте приложение Expo Go.
2. Отсканируйте QR-код с экрана терминала (или перейдите по ссылке в Expo Dev Tools).
3. Убедитесь, что телефон и компьютер находятся в одной сети Wi‑Fi.
4. Если сеть недоступна, запустите Expo с туннелем: `npx expo start --tunnel`.

### Использование веб-версии

- Нажмите `w` в терминале или `Open in web` в интерфейсе Dev Tools.
- Приложение откроется на `http://localhost:8081` (порт может отличаться). Для доступа из другой машины укажите `EXPO_WEB_HOST=0.0.0.0` перед запуском.

## Шаг 5. Проверить авторизацию и админку

- Авторизация: используйте любой номер телефона и код `1234`.
- Админка: перейдите на вкладку «Админ», введите секрет из `EXPO_PUBLIC_ADMIN_SECRET`.

## Шаг 6. Сборка standalone (опционально)

Для публикации приложений:
- iOS: `eas build --platform ios`
- Android: `eas build --platform android`
- Веб: `npx expo export:web` (результат в `mobile/dist/` можно загрузить на любой хостинг).

Подробнее про EAS Build и публикацию: [документация Expo](https://docs.expo.dev/build/introduction/).

## Частые вопросы

| Проблема | Решение |
|----------|---------|
| Expo Go не находит bundler | Проверьте, что телефон и компьютер в одной сети, либо используйте `npx expo start --tunnel`. |
| Запросы к API падают с CORS | Backend по умолчанию возвращает корректные заголовки. Если меняли код, убедитесь, что в Hono включён `cors()`. |
| На Android `adb` не найден | Установите Android SDK или используйте Expo Go на устройстве. |
| Хотите открыть devtools в браузере | После запуска `npm run start` нажмите `?` и выберите `open project in editor` или `press d` для открытия devtools в браузере. |

Expo Go теперь подключается к продакшн- или локальному backend, а веб-версия доступна из браузера.
