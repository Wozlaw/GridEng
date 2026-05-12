import {
  findAnalysisResultsForLoadCase,
  getMemberStressMetric,
  getStressMetricRange,
  type AnalysisResults,
  type Member,
  type StressMetricKind,
  type StressMetricRange,
} from '../../entities/model';

const STRESS_MAP_STOPS = ['#1b4d9b', '#26c6da', '#f6d743', '#f97316', '#c81d25'] as const;

export interface StressMapState {
  loadCaseId: string;
  results: AnalysisResults;
  range: StressMetricRange;
}

export function resolveStressMapState(
  results: AnalysisResults[] | undefined,
  loadCaseId: string,
): StressMapState | null {
  const activeResults = findAnalysisResultsForLoadCase(results, loadCaseId);
  const range = getStressMetricRange(activeResults);

  if (activeResults == null || range == null) {
    return null;
  }

  return {
    loadCaseId,
    results: activeResults,
    range,
  };
}

export function getMemberStressColor(
  member: Member,
  stressMapState: StressMapState | null,
): string | null {
  if (stressMapState == null) {
    return null;
  }

  const metric = getMemberStressMetric(
    stressMapState.results,
    member.id,
    stressMapState.range.kind,
  );

  if (metric == null) {
    return null;
  }

  return sampleStressMapColor(normalizeStressMetric(metric.value, stressMapState.range));
}

export function formatStressLegendValue(value: number, kind: StressMetricKind): string {
  if (kind === 'utilization') {
    return `${(value * 100).toFixed(0)}%`;
  }

  return `${value.toFixed(value >= 100 ? 0 : 1)} MPa`;
}

export function getStressMetricLabelKey(kind: StressMetricKind) {
  return kind === 'utilization'
    ? 'viewport.stressMap.legend.metric.utilization'
    : 'viewport.stressMap.legend.metric.sigma';
}

export function getStressMapGradientCss(): string {
  return `linear-gradient(90deg, ${STRESS_MAP_STOPS.join(', ')})`;
}

function normalizeStressMetric(value: number, range: StressMetricRange): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  if (Math.abs(range.max - range.min) <= 1e-9) {
    return 1;
  }

  return clamp01((value - range.min) / (range.max - range.min));
}

function sampleStressMapColor(normalizedValue: number): string {
  const clampedValue = clamp01(normalizedValue);
  const scaledValue = clampedValue * (STRESS_MAP_STOPS.length - 1);
  const startIndex = Math.floor(scaledValue);
  const endIndex = Math.min(STRESS_MAP_STOPS.length - 1, startIndex + 1);
  const localT = scaledValue - startIndex;

  return interpolateHexColor(STRESS_MAP_STOPS[startIndex], STRESS_MAP_STOPS[endIndex], localT);
}

function interpolateHexColor(startHex: string, endHex: string, t: number): string {
  const startRgb = parseHexColor(startHex);
  const endRgb = parseHexColor(endHex);

  const interpolated = startRgb.map((component, index) =>
    Math.round(component + (endRgb[index] - component) * clamp01(t))
  ) as [number, number, number];

  return rgbToHex(interpolated[0], interpolated[1], interpolated[2]);
}

function parseHexColor(value: string): [number, number, number] {
  const normalized = value.replace('#', '');

  return [
    Number.parseInt(normalized.slice(0, 2), 16),
    Number.parseInt(normalized.slice(2, 4), 16),
    Number.parseInt(normalized.slice(4, 6), 16),
  ];
}

function rgbToHex(red: number, green: number, blue: number): string {
  return `#${[red, green, blue]
    .map((component) => component.toString(16).padStart(2, '0'))
    .join('')}`;
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}
