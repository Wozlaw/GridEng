import { ZodError } from 'zod';

import {
  parseGridEngModel,
  validateGridEngModelIntegrity,
  type GridEngModel,
  type ModelValidationResult,
} from '../../entities/model';

export type GridEngJsonImportStatus = 'success' | 'warning' | 'error';

export interface GridEngJsonImportResult {
  status: GridEngJsonImportStatus;
  model?: GridEngModel;
  validationReport?: ModelValidationResult;
  message: string;
  details: string[];
}

export function parseGridEngJson(raw: unknown): GridEngModel {
  return parseGridEngModel(raw);
}

export function parseGridEngJsonText(text: string): GridEngModel {
  const raw = JSON.parse(text) as unknown;
  return parseGridEngJson(raw);
}

export async function loadModelFromJsonFile(file: File): Promise<GridEngModel> {
  const text = await file.text();
  return parseGridEngJsonText(text);
}

export function importGridEngJsonModel(model: GridEngModel): GridEngJsonImportResult {
  const validationReport = validateGridEngModelIntegrity(model);

  if (validationReport.errors.length > 0) {
    return {
      status: 'error',
      validationReport,
      message: 'JSON model contains validation errors. Current model was not replaced.',
      details: validationReport.errors.map(formatValidationIssue),
    };
  }

  if (validationReport.warnings.length > 0) {
    return {
      status: 'warning',
      model,
      validationReport,
      message: 'JSON model imported with validation warnings.',
      details: validationReport.warnings.map(formatValidationIssue),
    };
  }

  return {
    status: 'success',
    model,
    validationReport,
    message: 'JSON model imported successfully.',
    details: [],
  };
}

export function importGridEngJsonText(text: string): GridEngJsonImportResult {
  try {
    const model = parseGridEngJsonText(text);
    return importGridEngJsonModel(model);
  } catch (error) {
    return {
      status: 'error',
      message: 'Failed to parse GridEng JSON. Current model was not replaced.',
      details: formatImportError(error),
    };
  }
}

export async function importGridEngJsonFile(file: File): Promise<GridEngJsonImportResult> {
  const text = await file.text();
  return importGridEngJsonText(text);
}

function formatValidationIssue(issue: { message: string; code: string; entityId?: string }): string {
  return issue.entityId ? `${issue.message} (${issue.code}: ${issue.entityId})` : `${issue.message} (${issue.code})`;
}

function formatImportError(error: unknown): string[] {
  if (error instanceof ZodError) {
    return error.issues.map((issue) => (
      issue.path.length > 0 ? `${issue.path.join('.')}: ${issue.message}` : issue.message
    ));
  }

  if (error instanceof SyntaxError) {
    return [error.message];
  }

  if (error instanceof Error) {
    return [error.message];
  }

  return ['Unknown JSON import error.'];
}
