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
