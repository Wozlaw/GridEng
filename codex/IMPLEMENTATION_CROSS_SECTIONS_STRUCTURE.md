# IMPLEMENTATION_CROSS_SECTIONS_STRUCTURE.md

## 1. Назначение документа

Документ фиксирует текущую структуру реализации блока `cross_sections` в проекте `GridEng` и задает правила для дальнейшего рефакторинга/интеграции через Codex.

Цель блока:

```text
Нормативная JSON-БД сортамента → data-layer → Crossection factory → FastAPI API → frontend catalog/dataframe
```

Текущий принцип остается неизменным:

```text
Продуктивная БД сортамента хранит только нормативную геометрию и источник ГОСТ.
Расчетные характеристики не хранятся в БД и вычисляются через Crossection/API.
```

---

## 2. Текущий статус реализации

Реализованы и проверены:

```text
backend/app/cross_sections/
  __init__.py
  models.py
  registry.py
  factory.py
  validators.py
  router.py
  data/
    profiles.gost_*.json
  tools/
    validate_cross_sections.py

backend/tests/
  test_cross_sections_data_layer.py
  test_cross_sections_api_ready_data_layer.py
  test_cross_sections_api.py
```

Тесты на текущем этапе проходят.

Проверочные команды из каталога `backend`:

```bash
python -m pytest tests/test_cross_sections_data_layer.py -v
python -m pytest tests/test_cross_sections_api_ready_data_layer.py -v
python -m pytest tests/test_cross_sections_api.py -v
python -m app.cross_sections.tools.validate_cross_sections
```

Полный прогон:

```bash
python -m pytest -v
```

---

## 3. Размещение файлов

Основной модуль должен находиться здесь:

```text
backend/app/cross_sections/
```

Данные сортамента:

```text
backend/app/cross_sections/data/
```

Тесты:

```text
backend/tests/
```

Router подключается в существующем `backend/app/main.py`:

```python
from app.cross_sections.router import router as cross_sections_router

app.include_router(
    cross_sections_router,
    prefix="/api/cross-sections",
)
```

Версионирование API в проекте на текущем этапе не реализовано, поэтому используется префикс:

```text
/api/cross-sections
```

---

## 4. JSON-схема файла сортамента

Один JSON-файл описывает один стандарт.

В корне файла обязательно должны быть:

```json
{
  "schema_version": "1.0",
  "dataset_id": "profiles.gost_8509_93",
  "generated_at": "YYYY-MM-DD",
  "unit_system": "mm",
  "storage_policy": {},
  "standard": {},
  "source": {},
  "validation": {},
  "profiles": []
}
```

### 4.1. `standard`

```json
"standard": {
  "id": "gost_8509_93",
  "name": "ГОСТ 8509-93",
  "title": "Уголки стальные горячекатаные равнополочные. Сортамент",
  "profile_types": ["angle_equal"]
}
```

Правило:

```text
standard хранится один раз в корне файла.
Внутри элементов profiles поле standard не допускается.
```

### 4.2. `source`

```json
"source": {
  "file": "ГОСТ 8509-93.pdf",
  "table": "Таблица 1",
  "basis": "manually_verified_review_xlsx",
  "notes": "..."
}
```

Правило:

```text
source хранится один раз в корне файла.
Внутри элементов profiles поле source не допускается.
```

### 4.3. `validation`

```json
"validation": {
  "status": "approved",
  "checked_at": "YYYY-MM-DD",
  "notes": "Проверено пользователем."
}
```

Правило:

```text
validation хранится один раз в корне файла.
Внутри элементов profiles поле validation не допускается.
```

### 4.4. Запрещенные поля

В продуктивном JSON не должно быть:

```text
standards
confidence
reference_values
source внутри элемента
standard внутри элемента
validation внутри элемента
steel_group
```

`steel_group` был исключен из продуктивной БД для ГОСТ 8278-83. Дубли по разным группам стали должны быть схлопнуты на уровне подготовки данных.

---

## 5. Структура элемента `profiles[]`

Типовой элемент:

```json
{
  "id": "gost_8509_93_angle_equal_50x5",
  "profile_type": "angle_equal",
  "gost_number": "50x50x5",
  "designation": "50x50x5",
  "display_name": "Уголок 50x50x5",
  "shape": {
    "method": "LShape",
    "dimensions_mm": {
      "h": 50,
      "b": 50,
      "t": 5,
      "R": 5.5,
      "r": 1.8
    }
  }
}
```

Обязательные поля элемента:

```text
id
profile_type
gost_number
designation
display_name
shape.method
shape.dimensions_mm
```

Допустимое дополнительное поле:

```text
series
```

`series` применяется для профилей, где серия является частью нормативного типа профиля, например ГОСТ 8240-97:

```json
"series": "У"
```

---

## 6. Правила именования

### 6.1. `id`

`id` — технический стабильный идентификатор.

Допускается использовать `_` вместо десятичной точки:

```text
gost_8639_82_square_pipe_20x20x1_5
```

`id` не должен меняться без необходимости, так как на него может ссылаться frontend/dataframe/project model.

### 6.2. `gost_number`, `designation`, `display_name`

В пользовательских полях дробные значения пишутся через точку:

```text
20x20x1.5
```

Не допускается:

```text
20x20x1_5
```

`display_name` не должен содержать ГОСТ:

```text
Труба квадратная 20x20x1.5
```

Не допускается:

```text
Труба квадратная 20x20x1.5 ГОСТ 8639-82
```

Для уголков `gost_number` должен быть полным обозначением профиля, а не только толщиной:

```text
gost_number = 50x50x5
designation = 50x50x5
```

---

## 7. Поддерживаемые методы `Crossection`

В data-layer/factory поддерживаются следующие методы:

```python
METHOD_REQUIRED_DIMENSIONS: dict[str, set[str]] = {
    "LShape": {"h", "b", "t", "R", "r"},
    "CircleShape": {"D"},
    "RectShape": {"h", "b"},
    "HexShape": {"h"},
    "PipeShape": {"D", "t"},
    "SquarePipeShape": {"h", "b", "t", "r"},
    "CShape": {"h", "b", "s", "t", "R", "r"},
    "IShape": {"h", "b", "s", "t", "R", "r"},
    "TShape": {"h", "b", "s", "t", "R", "r"},
    "CBendShape": {"h", "b", "s", "R"},
}
```

Если метод имеет дополнительный параметр `delta`, он должен быть разрешен как необязательный параметр для соответствующего shape/factory, но не как обязательное поле для всех профилей.

Для `CShape` и `IShape` в текущей БД `delta` может присутствовать в `dimensions_mm`.

---

## 8. Особенности валидации dimensions

Общее правило:

```text
Все основные геометрические размеры должны быть > 0.
```

Исключения:

```text
delta >= 0
r >= 0
```

Причина:

```text
delta = 0 означает отсутствие уклона.
r = 0 означает, что малый радиус отсутствует/не учитывается.
```

Запрещается глобально ослаблять Pydantic-модель через `extra="allow"`. Лучше явно добавлять допустимые поля.

---

## 9. Data-layer API

`CrossSectionRegistry` должен поддерживать:

```python
CrossSectionRegistry.from_data_dir(data_dir)

registry.summary()

registry.list_profiles()
registry.get_profile(profile_id)

registry.list_standards()
registry.list_profile_types()

registry.list_catalog_items(
    standard_id: str | None = None,
    profile_type: str | None = None,
    query: str | None = None,
)

registry.get_catalog_item(profile_id)

registry.get_calculated_profile(profile_id)
registry.get_dataframe_row(profile_id)
```

---

## 10. API-контракт FastAPI

API без версий.

### 10.1. Endpoints

```text
GET /api/cross-sections/standards
GET /api/cross-sections/profile-types
GET /api/cross-sections/catalog
GET /api/cross-sections/catalog?standard_id=gost_8509_93
GET /api/cross-sections/catalog?profile_type=angle_equal
GET /api/cross-sections/catalog?query=50x5
GET /api/cross-sections/{profile_id}
GET /api/cross-sections/{profile_id}/dataframe-row
```

### 10.2. `/standards`

Возвращает список стандартов:

```json
[
  {
    "id": "gost_8509_93",
    "name": "ГОСТ 8509-93",
    "title": "Уголки стальные горячекатаные равнополочные. Сортамент",
    "profile_count": 90
  }
]
```

### 10.3. `/profile-types`

Фактический контракт:

```json
[
  {
    "id": "angle_equal",
    "profile_count": 90,
    "standard_ids": ["gost_8509_93"],
    "standard_names": ["ГОСТ 8509-93"]
  }
]
```

Поле `title` сейчас не является обязательным и не должно требоваться тестами.

### 10.4. `/catalog`

Возвращает компактные строки для selector-а frontend:

```json
[
  {
    "id": "gost_8509_93_angle_equal_50x5",
    "standard_id": "gost_8509_93",
    "standard_name": "ГОСТ 8509-93",
    "dataset_id": "profiles.gost_8509_93",
    "profile_type": "angle_equal",
    "series": null,
    "gost_number": "50x50x5",
    "designation": "50x50x5",
    "display_name": "Уголок 50x50x5",
    "shape_method": "LShape",
    "dimensions_mm": {}
  }
]
```

### 10.5. `/{profile_id}`

Фактический контракт расчетного профиля:

```json
{
  "catalog_item": {
    "id": "gost_8509_93_angle_equal_50x5",
    "standard_id": "gost_8509_93",
    "standard_name": "ГОСТ 8509-93",
    "dataset_id": "profiles.gost_8509_93",
    "profile_type": "angle_equal",
    "series": null,
    "gost_number": "50x50x5",
    "designation": "50x50x5",
    "display_name": "Уголок 50x50x5",
    "shape_method": "LShape",
    "dimensions_mm": {
      "h": 50.0,
      "b": 50.0,
      "t": 5.0,
      "R": 5.5,
      "r": 1.8
    }
  },
  "geometry": {
    "h": 50.0,
    "b": 50.0,
    "t": 5.0,
    "R": 5.5,
    "r": 1.8
  },
  "calculated": {
    "A": 479.2,
    "Cx": 14.19,
    "Cy": 14.19,
    "Jx": 111696.03,
    "Jy": 111696.03,
    "Jp": 223392.05,
    "Wx": 3123.68,
    "Wy": 3123.68,
    "Wp": 5809.50,
    "Sx": 6800.88,
    "Sy": 6800.88,
    "ix": 15.27,
    "iy": 15.27,
    "axis": "XY"
  },
  "dataframe_row": {
    "profile_id": "gost_8509_93_angle_equal_50x5",
    "standard_id": "gost_8509_93",
    "standard_name": "ГОСТ 8509-93",
    "dataset_id": "profiles.gost_8509_93",
    "profile_type": "angle_equal",
    "series": null,
    "gost_number": "50x50x5",
    "designation": "50x50x5",
    "display_name": "Уголок 50x50x5",
    "shape_method": "LShape",
    "A": 479.2
  }
}
```

Не нужно требовать `id` на верхнем уровне для этого endpoint-а. `id` лежит в `catalog_item.id`.

### 10.6. `/{profile_id}/dataframe-row`

Возвращает плоскую строку, предназначенную для frontend dataframe:

```json
{
  "profile_id": "gost_8509_93_angle_equal_50x5",
  "standard_id": "gost_8509_93",
  "standard_name": "ГОСТ 8509-93",
  "dataset_id": "profiles.gost_8509_93",
  "profile_type": "angle_equal",
  "series": null,
  "gost_number": "50x50x5",
  "designation": "50x50x5",
  "display_name": "Уголок 50x50x5",
  "shape_method": "LShape",
  "A": 479.2,
  "Cx": 14.19,
  "Cy": 14.19,
  "Jx": 111696.03,
  "Jy": 111696.03
}
```

---

## 11. Реализованные ГОСТы

На текущем этапе подготовлены следующие JSON-файлы:

```text
ГОСТ 103-2006     — полоса горячекатаная
ГОСТ 2590-88      — круг горячекатаный
ГОСТ 2591-88      — квадрат горячекатаный
ГОСТ 2879-88      — шестигранник горячекатаный
ГОСТ 8509-93      — уголки равнополочные
ГОСТ 8510-86      — уголки неравнополочные
ГОСТ 8639-82      — трубы квадратные
ГОСТ 8645-68      — трубы прямоугольные
ГОСТ 10704-91     — трубы электросварные прямошовные
ГОСТ 8734-75      — трубы бесшовные холоднодеформированные
ГОСТ 8239-89      — двутавры горячекатаные
ГОСТ 8240-97      — швеллеры горячекатаные
ГОСТ 8278-83      — швеллеры гнутые равнополочные
```

Для ГОСТ 8278-83:

```text
steel_group исключен;
дубли по h×b×s удалены;
метод построения — CBendShape;
размеры — h, b, s, R.
```

---

## 12. Технический долг / важные замечания

### 12.1. `CBendShape`

Метод `CBendShape` должен строить гнутый равнополочный швеллер с учетом укорочения прямых участков на радиус гиба.

Параметры:

```text
h — наружная высота
b — наружная ширина полки
s — толщина
R — внутренний радиус гиба
```

Прямые участки должны обрываться до зоны гиба:

```text
стенка: от y = s + R до y = h - s - R
полки: от x = s + R до x = b
```

Зоны гиба должны достраиваться четвертями кольца.

### 12.2. `title` для profile-types

Сейчас `/profile-types` не возвращает `title`.

Можно оставить как есть. Позже можно добавить локализованный справочник:

```text
angle_equal → Уголок равнополочный
square_pipe → Труба квадратная
rect_pipe → Труба прямоугольная
...
```

---

## 13. Задачи для Codex

### Задача 1. Нормализация и ревизия JSON

Проверить все `profiles.gost_*.json`:

```text
- нет reference_values;
- нет confidence;
- нет standards;
- нет source/standard/validation внутри profiles[];
- нет steel_group;
- display_name без ГОСТ;
- gost_number и designation используют точку для дробей;
- id уникальны;
- gost_number уникален внутри dataset, если нет объективной причины иначе;
- для ГОСТ 8509-93/8510-86 gost_number является полным обозначением, а не только толщиной.
```

### Задача 2. Проверка factory

Проверить, что factory корректно поддерживает:

```text
LShape
CircleShape
RectShape
HexShape
PipeShape
SquarePipeShape
CShape
IShape
TShape
CBendShape
```

Проверить передачу `delta` в `CShape` и `IShape`, если он есть в `dimensions_mm`.

### Задача 3. Проверка CBendShape

Проверить геометрию `CBendShape` визуально и тестами:

```text
- наружный габарит соответствует h×b;
- прямые участки укорочены на зону гиба;
- R трактуется как внутренний радиус;
- расчет не падает на профилях ГОСТ 8278-83.
```

### Задача 4. Укрепление тестов API

Тесты должны соответствовать фактическому контракту:

```text
/profile-types не требует title;
/{profile_id} содержит catalog_item, geometry, calculated, dataframe_row;
id профиля проверяется как catalog_item.id.
```

### Задача 5. Подготовка frontend-интеграции

После стабилизации API подготовить frontend-блок:

```text
- загрузка standards;
- загрузка profile_types;
- каталог профилей с фильтрами;
- выбор profile_id;
- получение dataframe-row;
- запись profile_id и рассчитанных параметров в модель/таблицу приложения.
```

---

## 14. Запрещенные изменения

Codex не должен:

```text
- переносить JSON в SQL;
- менять публичный API-префикс без отдельного решения;
- хранить расчетные характеристики в продуктивной БД;
- добавлять reference_values обратно в JSON;
- разрешать extra="allow" глобально в Pydantic-моделях;
- смешивать логику FastAPI router и расчетную бизнес-логику;
- менять id существующих профилей без отдельного миграционного решения.
```

---

## 15. Команды контроля после любых правок

Из каталога `backend`:

```bash
python -m pytest tests/test_cross_sections_data_layer.py -v
python -m pytest tests/test_cross_sections_api_ready_data_layer.py -v
python -m pytest tests/test_cross_sections_api.py -v
python -m app.cross_sections.tools.validate_cross_sections
```

Полный прогон:

```bash
python -m pytest -v
```

Запуск сервера:

```bash
python -m uvicorn app.main:app --reload
```

Проверка API вручную:

```bash
curl http://127.0.0.1:8000/api/cross-sections/standards
curl http://127.0.0.1:8000/api/cross-sections/profile-types
curl http://127.0.0.1:8000/api/cross-sections/catalog?query=50x5
curl http://127.0.0.1:8000/api/cross-sections/gost_8509_93_angle_equal_50x5
curl http://127.0.0.1:8000/api/cross-sections/gost_8509_93_angle_equal_50x5/dataframe-row
```


