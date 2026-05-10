import { validateGridEngModel } from '../../entities/model';
import type { GridEngModel } from '../../entities/model';

export function exportGridEngJson(model: GridEngModel): string {
  const validation = validateGridEngModel(model);
  if (!validation.ok) {
    const details = validation.errors.map((issue) => `- ${issue.message}`).join('\n');
    throw new Error(`Cannot serialize invalid GridEng model:\n${details}`);
  }

  return `${JSON.stringify(model, null, 2)}\n`;
}

export const serializeModelToJson = exportGridEngJson;

export function createModelJsonBlob(model: GridEngModel): Blob {
  return new Blob([exportGridEngJson(model)], { type: 'application/json;charset=utf-8' });
}

export function createGridEngJsonFileName(date = new Date()): string {
  const year = date.getFullYear();
  const month = padTwoDigits(date.getMonth() + 1);
  const day = padTwoDigits(date.getDate());
  const hours = padTwoDigits(date.getHours());
  const minutes = padTwoDigits(date.getMinutes());

  return `grideng-model-${year}${month}${day}-${hours}${minutes}.json`;
}

export function downloadGridEngJson(model: GridEngModel, date = new Date()): string {
  const fileName = createGridEngJsonFileName(date);
  const blob = createModelJsonBlob(model);
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');

  anchor.href = objectUrl;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(objectUrl);

  return fileName;
}

function padTwoDigits(value: number): string {
  return value.toString().padStart(2, '0');
}
