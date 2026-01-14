# Dating Cards

Мобильное приложение-шаблон для личного сервиса «Dating Cards» на базе Vite + React + TypeScript + MUI.

## Запуск

```bash
npm install
npm run dev
```

## Скрипты

- `npm run dev` — режим разработки.
- `npm run build` — сборка.
- `npm run preview` — локальный просмотр прод-сборки.
- `npm run lint` — проверка ESLint.
- `npm run format` — автоформатирование Prettier.

## Desktop (Electron)

### Предпосылки

- Node.js + npm.
- Сборка без сервера: рендерер работает локально из `dist/`.

### Разработка

```bash
npm run electron:dev
```

Команда запускает Vite dev server, компиляцию Electron (watch) и Electron-приложение. После старта Vite Electron открывает `http://localhost:5173`.

### Сборка и упаковка

```bash
npm run electron:build
npm run electron:package
```

- `electron:build` собирает рендерер (`dist/`) и Electron (`electron-dist/`).
- `electron:package` делает installers через electron-builder.
- Итоговые артефакты появятся в папке `release/`.

### Иконки

По умолчанию используются стандартные иконки Electron. Чтобы задать свои, добавьте их и настройте поле `build.icon` в `package.json`.

## Структура проекта

```
src/
  app/        # AppShell, theme, routing
  screens/    # ProfilesListScreen, ProfileDetailScreen, ProfileNewScreen
  components/ # базовые UI-компоненты (заготовка)
  domain/     # типы данных
  storage/    # заглушки хранилища
  utils/      # утилиты
```

## Роуты

- `/` — список анкет.
- `/p/:id` — детали анкеты.
- `/new` — создание анкеты.
