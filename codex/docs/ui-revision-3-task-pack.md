# UI revision 3 — комплект задач

Источник требований: `codex/reference/UI_REVISION_3_CHECKED_REQUIREMENTS.md`.

## Порядок выполнения

1. `22.1` — theme console commands.
2. `22.2` — DXF settings via console + import logs.
3. `22.3` — DXF preview diagnostics data model.
4. `22.4` — DXF 3D preview + color modes.
5. `22.5` — DXF profile assignment by color.
6. `22.6` — wind dialog polish + final docs/checklist.

## Непрерывные ограничения

- Работать поверх выполненных задач `21.1–21.8`.
- Сохранять текущую онтологию `CadShell`, `TopMenu`, `ProjectTreePanel`, `PropertiesPanel`, `Viewport3D`, `CommandConsole`, `modelStore`, `APP_COMMANDS_BY_ID`, `RIBBON_COMMAND_GROUPS`, `runAppCommand`.
- Новые пользовательские действия проводить через существующий `command registry`.
- Не менять backend, расчетное ядро и БД.
- Не менять 3D-модель ветрового вектора; `Z=0` — только UI-ограничение текущей итерации.
- Давление ветра в UI — Па, шаг `10`.
- DXF color используется как основа группировки профилей: `цвет DXF → профиль каталога`.

## Контроль

После каждой задачи:

```bash
cd frontend && npm run build
cd frontend && npm run lint
```

Финальный ручной checklist зафиксирован в `22-06-wind-dialog-polish-and-final-docs.md`.
