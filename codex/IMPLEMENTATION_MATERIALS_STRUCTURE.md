# IMPLEMENTATION_MATERIALS_STRUCTURE.md

## 1. Назначение документа

Документ фиксирует текущую структуру реализации блока `materials` в проекте `GridEng` и задает правила для дальнейшего рефакторинга/интеграции через Codex.

Цель блока:

```text
Нормативная JSON-БД сталей → data-layer → resolver Material → FastAPI router → frontend material selector
```

Текущий принцип:

```text
Продуктивная БД сталей хранит только расчетные параметры материала и нормативные источники.
Геометрия профилей хранится отдельно в cross_sections.
Выбор стали выполняется после выбора профиля, по расчетной толщине профиля и типу проката.
```

---

## 2. Текущий статус реализации

Реализованы и проверены:

```text
backend/app/materials/
  __init__.py
  adapters.py
  exceptions.py
  models.py
  repository.py
  router.py
  service.py
  data/
    materials.steels.json

backend/tests/
  test_materials_repository.py
  test_materials_api.py
```

Тесты на текущем этапе проходят.

Проверочные команды из каталога `backend`:

```bash
python -m pytest tests/test_materials_repository.py -v
python -m pytest tests/test_materials_api.py -v
```

Полный прогон:

```bash
python -m pytest -v
```

---

## 3. Размещение файлов

Основной модуль должен находиться здесь:

```text
backend/app/materials/
```

Данные сталей:

```text
backend/app/materials/data/materials.steels.json
```

Тесты:

```text
backend/tests/
```

Router подключается в существующем `backend/app/main.py`:

```python
from app.materials.router import router as materials_router

app.include_router(
    materials_router,
    prefix="/api",
)
```

Версионирование API в проекте на текущем этапе не реализовано, поэтому используются пути:

```text
/api/materials/steels/...
```

---

## 4. JSON-схема файла сталей

Файл БД:

```text
materials.steels.json
```

В корне файла обязательно должны быть:

```json
{
  "schema_version": "1.0",
  "dataset_id": "materials.steels",
  "generated_at": "YYYY-MM-DD",
  "unit_system": "mm_MPa",
  "units": {},
  "defaults": {},
  "materials": []
}
```

### 4.1. `units`

```json
"units": {
  "thickness": "mm",
  "Rt": "MPa",
  "Rb": "MPa",
  "E": "MPa",
  "G": "MPa",
  "alpha": "1/C",
  "rho": "kg/m3"
}
```

### 4.2. `defaults`

```json
"defaults": {
  "E": 206000,
  "G": 79000,
  "alpha": 0.000012,
  "rho": 7850
}
```

Правило:

```text
Если E/G/alpha/rho не заданы внутри конкретного диапазона, resolver должен брать значения из defaults.
```

### 4.3. `materials[]`

Каждый элемент `materials[]` описывает одну каноническую марку стали.

Один материал может иметь несколько нормативных источников и несколько диапазонов свойств по толщине.

Не допускается создавать отдельные материалы-дубли только из-за разных ГОСТов, если это одна и та же марка стали в принятой онтологии проекта.

---

## 5. Структура элемента `materials[]`

Типовой элемент:

```json
{
  "key": "C345",
  "display_name": "С345",
  "kind": "structural_steel",
  "aliases": ["C345", "С345"],
  "properties_by_thickness": [
    {
      "id": "GOST_27772_2015_C345_SHEET_2_3_9",
      "product_types": ["sheet", "wide_flat", "bent_profile"],
      "thickness": {
        "min": 2.0,
        "max": 3.9,
        "min_inclusive": true,
        "max_inclusive": true
      },
      "Rt": 345,
      "Rb": 470,
      "sources": [
        {
          "standard": "ГОСТ 27772-2015",
          "table": "таблица 4",
          "note": "листовой и широкополосный универсальный прокат, заготовки для гнутых профилей"
        }
      ]
    }
  ]
}
```

Обязательные поля материала:

```text
key
aliases
display_name
properties_by_thickness
```

Обязательные поля диапазона:

```text
id
product_types
thickness
Rt
Rb
sources
```

Расчетные параметры:

```text
Rt — расчетный/нормативный предел текучести, MPa
Rb — временное сопротивление, MPa
E — модуль упругости, MPa
G — модуль сдвига, MPa
alpha — коэффициент линейного расширения, 1/C
rho — плотность, kg/m3
```

На текущем этапе в JSON хранятся только расчетные параметры. Химический состав, ударная вязкость, углеродный эквивалент, категории поставки и состояние поставки не включаются.

---

## 6. Правила именования

### 6.1. `key`

`key` — технический стабильный идентификатор марки стали.

Правило:

```text
key пишется латиницей.
display_name пишется по ГОСТ, кириллицей.
```

Примеры:

```text
C345    → С345
C355    → С355
09G2S   → 09Г2С
10G2S1  → 10Г2С1
St3sp   → Ст3сп
St5ps   → Ст5пс
```

### 6.2. `display_name`

`display_name` должен быть пользовательским наименованием марки по ГОСТ.

Не допускается включать в `display_name` номер ГОСТ:

```text
С345
```

Не допускается:

```text
С345 ГОСТ 27772-2015
```

### 6.3. `aliases`

`aliases` должны позволять поиск как по латинскому ключу, так и по кириллическому обозначению.

Пример:

```json
"aliases": ["C345", "С345"]
```

Для обычных сталей:

```json
"aliases": ["St3sp", "Ст3сп"]
```

---

## 7. Поддерживаемые типы проката

На текущем этапе используются только типы, применимые к текущему проекту:

```text
sheet             — листовой прокат / пластины
wide_flat         — широкополосный универсальный прокат
bent_profile      — гнутые профили / профильные трубы
hot_rolled_shape  — горячекатаный фасонный прокат: уголки, швеллеры, двутавры, тавры
bar               — сортовой прокат: круг, квадрат, шестигранник, полоса
```

Resolver должен уметь фильтровать материал по:

```text
name/key/alias
thickness
product_type
standard, если явно передан
strength_class, если требуется для неоднозначной марки
property_id, если нужно выбрать конкретный диапазон
```

---

## 8. Определение расчетной толщины по профилю

Модель выбора материала:

```text
1. Пользователь выбирает профиль из cross_sections.
2. Приложение определяет расчетную толщину профиля.
3. По толщине и типу проката фильтруются допустимые марки стали.
4. Пользователь выбирает материал.
5. Resolver возвращает Material-совместимый объект.
```

Правила первой итерации:

```text
LShape / LBendShape      -> t
CBendShape               -> s
SquarePipeShape          -> t
PipeShape                -> t
CShape / IShape / TShape -> max(s, t)
RectShape                -> min(h, b) или явно переданный thickness
CircleShape              -> D, если используется как сортовой круг
HexShape                 -> h, если используется как сортовой шестигранник
```

Важно:

```text
Для фасонного проката с разными толщинами стенки и полки на текущем этапе используется max(s, t).
Если позже для расчета потребуется более строгая нормативная логика, thickness_resolver можно расширить без изменения JSON-БД.
```

---

## 9. Data-layer API

Публичные импорты должны идти через пакет:

```python
from app.materials import resolve_steel, list_steels
from app.materials import Steel
```

Data-layer/service должен поддерживать:

```python
load_steel_repository()

list_steels()
get_steel(name: str)

resolve_steel(
    name: str,
    thickness: float,
    product_type: str | None = None,
    standard: str | None = None,
    strength_class: int | None = None,
    property_id: str | None = None,
)

list_steel_options(
    thickness: float | None = None,
    product_type: str | None = None,
)

material_thickness_from_profile(
    shape_method: str,
    dimensions_mm: dict,
) -> float

product_type_from_profile(
    shape_method: str,
) -> str
```

Resolver должен возвращать объект, совместимый с текущим `Material` из `Crossection.py`:

```text
name
Rt
Rb
E
G
alpha / α
rho / ρ
```

С учетом текущего `Material.__init__` необходимо сохранять совместимость с греческими ключами:

```text
α
ρ
```

---

## 10. API-контракт FastAPI

API без версий.

### 10.1. Endpoints

```text
GET  /api/materials/steels
GET  /api/materials/steels/options
POST /api/materials/steels/options-by-profile
GET  /api/materials/steels/{name}
GET  /api/materials/steels/{name}/options
GET  /api/materials/steels/{name}/resolve
POST /api/materials/steels/resolve
POST /api/materials/steels/resolve-by-profile
```

### 10.2. `/api/materials/steels`

Возвращает список канонических сталей.

Ожидаемый смысл ответа:

```json
[
  {
    "key": "C345",
    "display_name": "С345",
    "aliases": ["C345", "С345"],
    "kind": "structural_steel"
  }
]
```

### 10.3. `/api/materials/steels/options`

Возвращает список допустимых материалов с учетом фильтров:

```text
thickness
product_type
```

Пример:

```text
GET /api/materials/steels/options?thickness=5&product_type=hot_rolled_shape
```

### 10.4. `/api/materials/steels/options-by-profile`

Принимает профиль или его shape-описание и возвращает допустимые материалы для расчетной толщины профиля.

Ожидаемый смысл запроса:

```json
{
  "shape_method": "LShape",
  "dimensions_mm": {
    "h": 50,
    "b": 50,
    "t": 5,
    "R": 5.5,
    "r": 1.8
  }
}
```

### 10.5. `/api/materials/steels/{name}`

Возвращает каноническую запись по `key` или alias.

Допускается:

```text
C345
С345
09G2S
09Г2С
St3sp
Ст3сп
```

### 10.6. `/api/materials/steels/{name}/resolve`

Возвращает Material-совместимые расчетные параметры по толщине и типу проката.

Пример:

```text
GET /api/materials/steels/C345/resolve?thickness=5&product_type=hot_rolled_shape
```

### 10.7. `/api/materials/steels/resolve`

POST-вариант resolver-а.

Ожидаемый смысл запроса:

```json
{
  "name": "C345",
  "thickness": 5,
  "product_type": "hot_rolled_shape"
}
```

### 10.8. `/api/materials/steels/resolve-by-profile`

POST-вариант resolver-а от профиля.

Ожидаемый смысл запроса:

```json
{
  "name": "C345",
  "shape_method": "LShape",
  "dimensions_mm": {
    "h": 50,
    "b": 50,
    "t": 5,
    "R": 5.5,
    "r": 1.8
  }
}
```

---

## 11. Обработка ошибок

### 11.1. Неизвестная марка

Если марка не найдена, API должен возвращать:

```text
404 Not Found
```

### 11.2. Недопустимый профиль / невозможность определить толщину

Если по профилю невозможно определить расчетную толщину, API должен возвращать:

```text
422 Unprocessable Content
```

Важно для новых версий Starlette/FastAPI:

```python
HTTP_422 = getattr(status, "HTTP_422_UNPROCESSABLE_CONTENT", 422)
```

Не использовать устаревшую константу:

```python
status.HTTP_422_UNPROCESSABLE_ENTITY
```

### 11.3. Неоднозначный материал

Если одна марка имеет несколько пересекающихся вариантов свойств и по переданным параметрам невозможно выбрать единственный диапазон, API должен возвращать:

```text
409 Conflict
```

Ответ должен содержать список подходящих вариантов, чтобы frontend мог предложить пользователю выбрать `strength_class` или конкретный `property_id`.

---

## 12. Неоднозначные марки и `strength_class`

Для марок из ГОСТ 19281-2014 возможна неоднозначность: одна марка может обеспечивать разные классы прочности при пересекающихся диапазонах толщин.

Для таких марок допускается политика:

```json
"resolver_policy": "overlapping_strength_classes_require_strength_class_or_explicit_property_id"
```

Правило resolver-а:

```text
Если найдено несколько подходящих диапазонов, resolver не должен выбирать случайный или первый вариант.
Он должен потребовать strength_class или property_id.
```

Пример неоднозначных марок:

```text
09G2S
10G2S1
```

---

## 13. Реализованные стали первой итерации

На текущем этапе подготовлен практический минимум.

### 13.1. ГОСТ 27772-2015

```text
C235
C245
C255
C345
C355
C390
C440
C550
C590
```

Назначение:

```text
Основной набор строительных сталей для расчетов металлических конструкций.
```

### 13.2. ГОСТ 19281-2014

```text
09G2S
10G2S1
```

Назначение:

```text
Стали повышенной прочности / низколегированные стали, часто применяемые в металлоконструкциях.
```

### 13.3. ГОСТ 535-2005 / ГОСТ 380-2005

```text
St3kp
St3ps
St3sp
St5ps
St5sp
```

Назначение:

```text
Базовые обычные углеродистые стали для сортового и фасонного проката.
```

---

## 14. Интеграция с cross_sections

Связь между блоками должна быть слабой.

`cross_sections` отвечает за:

```text
- нормативную геометрию профиля;
- расчет геометрических характеристик через Crossection;
- catalog/dataframe для профилей.
```

`materials` отвечает за:

```text
- нормативные расчетные свойства сталей;
- выбор диапазона по толщине;
- Material-compatible object для расчетного ядра.
```

Не допускается хранить материалы внутри JSON-файлов сортамента `cross_sections`.

Не допускается хранить геометрию профилей внутри `materials.steels.json`.

---

## 15. Задачи для Codex

### Задача 1. Проверка структуры пакета

Проверить, что блок расположен строго в:

```text
backend/app/materials/
```

и имеет структуру:

```text
__init__.py
adapters.py
exceptions.py
models.py
repository.py
router.py
service.py
data/materials.steels.json
```

### Задача 2. Проверка JSON-БД

Проверить `materials.steels.json`:

```text
- schema_version = 1.0;
- dataset_id = materials.steels;
- есть units;
- есть defaults;
- есть materials[];
- key пишется латиницей;
- display_name пишется кириллицей по ГОСТ;
- aliases содержат латинский и кириллический варианты;
- нет химического состава;
- нет ударной вязкости;
- нет carbon_equivalent;
- нет delivery_condition;
- нет category;
- все диапазоны имеют Rt и Rb;
- все диапазоны имеют product_types;
- все диапазоны имеют thickness;
- все диапазоны имеют sources.
```

### Задача 3. Проверка resolver-а

Проверить, что resolver:

```text
- находит материал по key;
- находит материал по кириллическому alias;
- фильтрует по толщине;
- фильтрует по product_type;
- подставляет defaults для E/G/alpha/rho;
- возвращает Material-compatible object;
- не выбирает первый вариант при неоднозначности;
- умеет разрешать неоднозначность через strength_class;
- умеет разрешать конкретный вариант через property_id.
```

### Задача 4. Проверка profile helpers

Проверить функции:

```text
material_thickness_from_profile
product_type_from_profile
```

На профилях:

```text
LShape
LBendShape
CBendShape
SquarePipeShape
PipeShape
CShape
IShape
TShape
RectShape
CircleShape
HexShape
```

### Задача 5. Проверка API router

Router должен оставаться в одном файле:

```text
backend/app/materials/router.py
```

По аналогии с `cross_sections`, не создавать отдельный пакет `app/api/materials.py`, если нет отдельного решения.

Проверить endpoints:

```text
GET  /api/materials/steels
GET  /api/materials/steels/options
POST /api/materials/steels/options-by-profile
GET  /api/materials/steels/{name}
GET  /api/materials/steels/{name}/options
GET  /api/materials/steels/{name}/resolve
POST /api/materials/steels/resolve
POST /api/materials/steels/resolve-by-profile
```

### Задача 6. Подключение router в main.py

Подключить router в `backend/app/main.py`:

```python
from app.materials.router import router as materials_router

app.include_router(materials_router, prefix="/api")
```

Проверить, что фактические пути начинаются с:

```text
/api/materials/steels
```

### Задача 7. Подготовка frontend-интеграции

После стабилизации API подготовить frontend-блок:

```text
- после выбора profile_id получить geometry/dimensions_mm из cross_sections;
- определить shape_method и dimensions_mm;
- запросить допустимые материалы через /api/materials/steels/options-by-profile;
- дать пользователю выбрать марку стали;
- при выборе марки вызвать resolve-by-profile;
- сохранить material_key, material_display_name, Rt, Rb, E, G, alpha, rho в модель элемента.
```

---

## 16. Запрещенные изменения

Codex не должен:

```text
- переносить JSON в SQL;
- менять имя файла materials.steels.json;
- переносить материалы в backend/app/api;
- создавать отдельные материалы-дубли только из-за разных ГОСТов;
- использовать кириллицу в key;
- хранить геометрию профилей в materials.steels.json;
- хранить материалы в JSON-файлах cross_sections;
- добавлять химический состав, ударную вязкость, Cэкв, категории и состояние поставки в первую итерацию;
- выбирать первый подходящий вариант при неоднозначности;
- смешивать FastAPI router и бизнес-логику resolver-а;
- использовать устаревшую константу HTTP_422_UNPROCESSABLE_ENTITY;
- менять публичные API-пути без отдельного решения.
```

---

## 17. Команды контроля после любых правок

Из каталога `backend`:

```bash
python -m pytest tests/test_materials_repository.py -v
python -m pytest tests/test_materials_api.py -v
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
curl http://127.0.0.1:8000/api/materials/steels
curl "http://127.0.0.1:8000/api/materials/steels/options?thickness=5&product_type=hot_rolled_shape"
curl http://127.0.0.1:8000/api/materials/steels/C345
curl "http://127.0.0.1:8000/api/materials/steels/C345/resolve?thickness=5&product_type=hot_rolled_shape"
```

Пример POST-запроса:

```bash
curl -X POST http://127.0.0.1:8000/api/materials/steels/resolve-by-profile \
  -H "Content-Type: application/json" \
  -d '{
    "name": "C345",
    "shape_method": "LShape",
    "dimensions_mm": {
      "h": 50,
      "b": 50,
      "t": 5,
      "R": 5.5,
      "r": 1.8
    }
  }'
```
