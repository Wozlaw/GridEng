# Task 2.3 — GridEngModel integrity validator

## Задача
Реализуй валидатор целостности модели в `frontend/src/entities/model/validation.ts`.

## API
```ts
export type ModelValidationIssue = {
  code: string;
  message: string;
  entityType?: "node" | "member" | "profile" | "material" | "loadCase";
  entityId?: string;
};
export type ModelValidationReport = {
  errors: ModelValidationIssue[];
  warnings: ModelValidationIssue[];
};
export function validateGridEngModelIntegrity(model: GridEngModel): ModelValidationReport;
```

## Проверки
1. Дубликаты id узлов/стержней/профилей/материалов.
2. Отсутствующие ссылки start/end/profile/material.
3. Нулевая длина стержня с tolerance `1e-6` мм.
4. Висячие стержни: степень соединения хотя бы одного конца равна 1; severity warning.
5. Изолированные узлы.
6. `NaN`, `Infinity`.

## Проверки проекта
- `cd frontend && npm run build`
- `cd frontend && npm run lint`
