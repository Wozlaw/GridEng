# Codex Task Template

## Контекст

Проект GridEng. Работаем над frontend для приложения расчета стержневых металлоконструкций.

Текущий фокус:
- CAD-like frontend;
- `GridEngModel v0.1`;
- JSON import/export;
- DXF import v0.1;
- 3D visualization;
- без БД;
- backend расчетное ядро не менять без отдельного указания.

## Задача

<описание задачи>

## Ограничения

- Не менять `backend/app/lib`, если явно не указано.
- Не реализовывать БД.
- Не добавлять широкий DXF-импорт.
- DXF v0.1 поддерживает только `LINE`, coordinates, `color` / `colorIndex` / `trueColor`, `layer`, `handle`.
- Все данные должны приводиться к `GridEngModel v0.1`.
- После изменения frontend запускать `cd frontend && npm run build`.

## Файлы

Ожидаемые файлы:
- `<path>`

## Критерии готовности

- Код компилируется.
- Типы корректны.
- Нет преждевременной backend/DB логики.
- Codex показывает summary, измененные файлы, команды и риски.

## Проверки

```bash
cd frontend
npm run build
npm run lint
```

Если `npm run lint` недоступен или падает из-за существующей конфигурации, явно указать причину.
