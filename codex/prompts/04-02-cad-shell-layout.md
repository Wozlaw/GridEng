# Task 4.2 — CAD shell layout

## Задача
Реализуй CAD-like layout:
- `frontend/src/app/layout/CadShell.tsx`
- `frontend/src/app/layout/TopMenu.tsx`
- `frontend/src/widgets/project-tree/ProjectTreePanel.tsx`
- `frontend/src/widgets/properties-panel/PropertiesPanel.tsx`
- `frontend/src/app/layout/BottomStatusBar.tsx`

## Требования
- Верхнее меню.
- Слева дерево проекта.
- В центре placeholder для 3D viewport.
- Справа панель свойств.
- Снизу status bar.
- `CadShell` должен композировать widgets, а не дублировать их внутри `app/layout`.
- Использовать MUI `AppBar`, `Toolbar`, `Box`, `Divider`, `Typography`, `List/ListItem`, `ToggleButtonGroup`.
- Подключить Zustand store: counts, selectedEntity, viewMode, visibility.

## Проверки
- `cd frontend && npm run build`
- `cd frontend && npm run lint`
