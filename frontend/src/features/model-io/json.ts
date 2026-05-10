import { parseGridEngModel, validateGridEngModel } from '../../entities/model';
import type { GridEngModel } from '../../entities/model';

export async function loadModelFromJsonFile(file: File): Promise<GridEngModel> {
  const text = await file.text();
  const raw = JSON.parse(text) as unknown;
  return parseGridEngModel(raw);
}

export function serializeModelToJson(model: GridEngModel): string {
  const validation = validateGridEngModel(model);
  if (!validation.ok) {
    const details = validation.issues.map((issue) => `- ${issue.message}`).join('\n');
    throw new Error(`Cannot serialize invalid GridEng model:\n${details}`);
  }

  return `${JSON.stringify(model, null, 2)}\n`;
}

export function createModelJsonBlob(model: GridEngModel): Blob {
  return new Blob([serializeModelToJson(model)], { type: 'application/json;charset=utf-8' });
}
