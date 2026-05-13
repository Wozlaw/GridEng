import type {
  DxfImportPreview,
  DxfPreviewDiagnosticCode,
  DxfPreviewDiagnostic,
  DxfPreviewDiagnosticStatus,
} from './types';

interface DxfPreviewStatusOptions {
  includeGroupDiagnostics?: boolean;
}

export function getDxfPreviewOverallStatus(
  preview: DxfImportPreview,
  options: DxfPreviewStatusOptions = {},
): DxfPreviewDiagnosticStatus {
  const statuses = collectPreviewStatuses(preview, options);

  if (statuses.includes('error')) {
    return 'error';
  }

  if (statuses.includes('warning')) {
    return 'warning';
  }

  return 'ok';
}

export function countDxfPreviewDiagnosticsByStatus(
  preview: DxfImportPreview,
  status: Exclude<DxfPreviewDiagnosticStatus, 'ok'>,
  options: DxfPreviewStatusOptions = {},
): number {
  const counts = collectPreviewStatuses(preview, options);
  return counts.filter((entry) => entry === status).length;
}

export function countDxfPreviewDiagnosticsByCode(
  preview: DxfImportPreview,
  code: DxfPreviewDiagnosticCode,
): number {
  let count = 0;

  for (const diagnostic of preview.diagnostics.summary) {
    if (diagnostic.code === code) {
      count += 1;
    }
  }

  for (const entry of preview.diagnostics.lines) {
    count += entry.diagnostics.filter((diagnostic) => diagnostic.code === code).length;
  }

  for (const entry of preview.diagnostics.members) {
    count += entry.diagnostics.filter((diagnostic) => diagnostic.code === code).length;
  }

  for (const entry of preview.diagnostics.nodes) {
    count += entry.diagnostics.filter((diagnostic) => diagnostic.code === code).length;
  }

  for (const entry of preview.diagnostics.groups) {
    count += entry.diagnostics.filter((diagnostic) => diagnostic.code === code).length;
  }

  return count;
}

function collectPreviewStatuses(
  preview: DxfImportPreview,
  options: DxfPreviewStatusOptions,
): DxfPreviewDiagnosticStatus[] {
  const statuses: DxfPreviewDiagnosticStatus[] = [];

  for (const diagnostic of preview.diagnostics.summary) {
    statuses.push(diagnostic.status);
  }

  for (const entry of preview.diagnostics.lines) {
    if (entry.status !== 'ok') {
      statuses.push(entry.status);
    }
  }

  for (const entry of preview.diagnostics.members) {
    if (entry.status !== 'ok') {
      statuses.push(entry.status);
    }
  }

  for (const entry of preview.diagnostics.nodes) {
    if (entry.status !== 'ok') {
      statuses.push(entry.status);
    }
  }

  if (options.includeGroupDiagnostics) {
    for (const entry of preview.diagnostics.groups) {
      if (entry.status !== 'ok') {
        statuses.push(entry.status);
      }
    }
  }

  if (statuses.length === 0) {
    if (preview.errors.length > 0) {
      statuses.push('error');
    } else if (preview.warnings.length > 0) {
      statuses.push('warning');
    }
  }

  return statuses;
}

export function formatDiagnosticWithCode(diagnostic: DxfPreviewDiagnostic): string {
  return `${diagnostic.message} (${diagnostic.code})`;
}
