# UI revision 3 — implementation notes

Этот документ фиксирует итоговое состояние задач `22.1–22.6`.

## Theme Commands

- Консоль поддерживает команды:
  - `theme light`
  - `theme dark`
  - `theme toggle`
  - `theme status`
- Режимы `light/dark` остаются grayscale-вариантами темы и не возвращают цветную MUI-палитру.

## DXF Settings Commands

- DXF-настройки вынесены в консоль:
  - `dxf.settings`
  - `dxf.settings reset`
  - `dxf.tolerance <number>`
  - `dxf.center on|off`
  - `dxf.force2d on|off`
- Изменения этих команд влияют на DXF preview без изменения основной модели до нажатия `Импорт`.

## DXF Import Dialog

- Основной DXF-диалог собран как компактный flow:
  - выбор файла;
  - compact preview/status;
  - локальный 3D preview;
  - назначение профилей по DXF color/color group;
  - icon-button actions снизу.
- DXF preview не пишет в `modelStore`, пока пользователь не нажал `Импорт`.

## Import Logs

- Подробности импорта вынесены в отдельный `ImportLogDialog`.
- В логах показываются:
  - summary;
  - import settings;
  - warnings/errors;
  - color/layer groups;
  - structured diagnostics;
  - source metadata.

## DXF Preview Modes

- `Диагностика`:
  - окраска по structured diagnostics;
  - зеленый / желтый / красный по статусу.
- `Профили`:
  - если профиль группе уже назначен, цвет берется из каталогового профиля;
  - если профиль еще не назначен, используется исходный DXF color/group color.

## DXF Color → Profile

- Mapping строится как `DXF color/color group -> existing catalog profile`.
- В каждой строке группы доступны:
  - swatch цвета;
  - количество элементов;
  - фильтр по типу профиля;
  - выбор профиля из каталога.
- Тип профиля не сохраняется в `GridEngModel` и используется только как UI-фильтр каталога.
- Пока группа не получила каталоговый профиль:
  - она остается warning в diagnostics;
  - `Импорт` блокируется.

## Wind Dialog Rules

- Заголовок диалога: `Ветер`.
- Поле `Z` скрыто из UI.
- При сохранении всегда отправляется `direction.z = 0`.
- Если у модели был ненулевой `wind.direction.z`, в форме показывается warning и при сохранении `Z` нормализуется к `0`.
- Поля `X`, `Y` и `Номинальное давление` работают как numeric fields.
- Давление вводится и хранится в `Па`.
- Отрицательное давление запрещено:
  - `min=0`;
  - submit validation;
  - inline validation error.
- Список загружений показывает только `loadCase.name`; `loadCase.id` остается внутренним value и tooltip/debug-метаданным.

## Manual Checklist

1. Выполнить `theme light`, `theme dark`, `theme toggle`, `theme status`.
2. Выполнить `dxf.settings`, `dxf.settings reset`, `dxf.tolerance`, `dxf.center`, `dxf.force2d`.
3. Открыть DXF dialog и убедиться, что preview не меняет основную модель до `Импорт`.
4. Проверить режим `Диагностика`.
5. Проверить режим `Профили`.
6. Проверить назначение профиля по цветовой группе DXF.
7. Проверить окно логов импорта.
8. Открыть диалог `Ветер` и убедиться, что поле `Z` отсутствует.
9. Проверить, что при существующем ненулевом `Z` появляется warning и при сохранении `Z` сбрасывается в `0`.
10. Проверить запрет отрицательного давления.
11. Проверить, что давление вводится в `Па` с шагом `10`.
12. Проверить, что dropdown загружений показывает только имена.
13. Выполнить `cd frontend && npm run build`.
14. Выполнить `cd frontend && npm run lint`.
