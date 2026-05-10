# Task 5.1 — JSON import

## Задача
Реализуй JSON import:
- `frontend/src/features/import-json/importGridEngJson.ts`
- `frontend/src/features/import-json/ImportJsonButton.tsx`

## Требования
- `<input type="file" accept=".json">`.
- Читать файл как text.
- `JSON.parse`.
- `parseGridEngModel`.
- `validateGridEngModelIntegrity`.
- Если есть errors — не заменять текущую модель, показать сообщение.
- Если только warnings — загрузить модель и показать warnings.
- Подключить кнопку в `TopMenu`.
- Использовать MUI `Snackbar/Alert` или `Dialog`.

## Проверки
- `cd frontend && npm run build`
- `cd frontend && npm run lint`
