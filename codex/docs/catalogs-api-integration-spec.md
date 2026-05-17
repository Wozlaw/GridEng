# Catalogs API integration spec — cross_sections + materials

## 1. Цель

Связать уже оформленные backend-блоки `cross_sections` и `materials` с frontend-каталогами GridEng без изменения расчетного ядра и без введения SQL-БД.

Статус на 2026-05-17:

- этапы `24.1–24.4` реализованы;
- `24.5` закрывает документационную нормализацию;
- документ остается контрактным reference для следующих задач по каталогам, даже после завершения блока 24.

## 2. Источники истины

- Профили: backend API `/api/cross-sections`.
- Материалы: backend API `/api/materials/steels/...`.
- Локальные frontend-каталоги допускаются только как временный fallback или тестовые fixtures.

## 3. Frontend contracts

Создать или привести к единому виду frontend DTO-типы:

```ts
export interface CrossSectionCatalogItem {
  id: string;
  dataset_id: string;
  standard_id: string;
  standard_name: string;
  profile_type: string;
  series?: string | null;
  gost_number: string;
  designation: string;
  display_name: string;
}

export interface CrossSectionDetailsResponse {
  catalog_item: CrossSectionCatalogItem;
  geometry: Record<string, number>;
  calculated: Record<string, number>;
}

export interface SteelMaterialCatalogItem {
  key: string;
  display_name: string;
  aliases: string[];
  kind?: string;
}

export interface SteelMaterialResolvedProperties {
  key: string;
  display_name: string;
  product_type: string;
  thickness_mm: number;
  Rt: number;
  Rb: number;
  E: number;
  G: number;
  alpha: number;
  rho: number;
  source_refs?: Array<{
    standard: string;
    table?: string;
    note?: string;
  }>;
}
```

Codex должен сверить фактические backend DTO и не ломать уже реализованные имена. Если фактический контракт отличается, адаптер должен нормализовать его в frontend domain type.

## 4. API adapters

Разместить adapters в существующей архитектуре, предпочтительно:

```text
frontend/src/shared/api/
  crossSectionsApi.ts
  materialsApi.ts
```

или в уже существующих аналогичных местах проекта.

Требования:

- единый обработчик ошибок через notification center;
- abort/cancel protection для повторных запросов из dialog/select;
- graceful fallback на локальный catalog, если backend недоступен и такой fallback уже есть;
- никакого raw JSON в основном UI;
- служебные details — только в logs/debug.

## 5. Profile catalog UI

- Диалог/селектор профилей показывает: тип профиля, ГОСТ/стандарт, designation/display name.
- Расчетные характеристики показываются по запросу деталей профиля, а не хранятся в frontend catalog snapshot.
- Цвет профиля в UI допускается как инженерное представление, но не должен менять нормативный id профиля.

## 6. Material selector UI

Последовательность выбора:

1. Пользователь выбирает профиль для `Member`.
2. Frontend определяет расчетную толщину профиля:
   - предпочтительно из `catalog_item`/`geometry`/`dimensions_mm`;
   - если толщин несколько, использовать согласованное поле `sectionMaterialThicknessMm` или явное правило per `profile_type`.
3. Frontend определяет `product_type` профиля: `rolled`, `sheet`, `bent_profile`, `pipe`, etc. по данным каталога/маппингу.
4. Material selector запрашивает допустимые стали по `thickness_mm` и `product_type`.
5. Выбранный материал записывается в `Member`, а не в профиль.

## 7. DXF assignment

- Таблица `Профили` в DXF dialog использует API-каталог профилей.
- Колонки остаются: `Цвет | Тип профиля | Стандарт | Профиль`.
- Тип профиля и стандарт — фильтры выбора, не новые поля `GridEngModel`.
- До нажатия `Импорт` изменения остаются в preview mapping.

## 8. Проверки

```bash
cd frontend
npm run build
npm run lint
```

Если задача затрагивает backend adapters/tests:

```bash
cd backend
python -m pytest -v
```
