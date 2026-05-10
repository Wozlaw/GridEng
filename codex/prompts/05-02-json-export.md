# Task 5.2 — JSON export

## Задача
Реализуй JSON export:
- `frontend/src/features/export-json/exportGridEngJson.ts`
- `frontend/src/features/export-json/ExportJsonButton.tsx`

## Требования
- Экспортировать текущую `model` в pretty JSON с 2 пробелами.
- Имя файла: `grideng-model-YYYYMMDD-HHMM.json`.
- Подключить кнопку в `TopMenu`.

## Проверки
- `cd frontend && npm run build`
- `cd frontend && npm run lint`
