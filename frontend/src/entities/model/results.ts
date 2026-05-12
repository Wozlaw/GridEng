export interface NodeDisplacement {
  ux: number;
  uy: number;
  uz: number;
  rx: number;
  ry: number;
  rz: number;
}

export interface MemberForces {
  n?: number;
  qy?: number;
  qz?: number;
  mx?: number;
  my?: number;
  mz?: number;
}

export interface MemberStresses {
  sigmaMaxMPa?: number;
  utilization?: number;
}

export interface AnalysisResults {
  loadCaseId: string;
  nodeDisplacements: Record<string, NodeDisplacement>;
  memberForces: Record<string, MemberForces>;
  memberStresses: Record<string, MemberStresses>;
}

export type StressMetricKind = 'sigmaMaxMPa' | 'utilization';

export interface StressMetricRange {
  kind: StressMetricKind;
  min: number;
  max: number;
}

export interface MemberStressMetric {
  kind: StressMetricKind;
  value: number;
}

export function findAnalysisResultsForLoadCase(
  results: AnalysisResults[] | undefined,
  loadCaseId: string,
): AnalysisResults | undefined {
  return results?.find((entry) => entry.loadCaseId === loadCaseId);
}

export function resolveStressMetricKind(results: AnalysisResults | undefined): StressMetricKind | null {
  if (results == null) {
    return null;
  }

  const stresses = Object.values(results.memberStresses);
  const hasUtilization = stresses.some((stress) => Number.isFinite(stress.utilization));

  if (hasUtilization) {
    return 'utilization';
  }

  const hasSigma = stresses.some((stress) => Number.isFinite(stress.sigmaMaxMPa));
  return hasSigma ? 'sigmaMaxMPa' : null;
}

export function getMemberStressMetric(
  results: AnalysisResults | undefined,
  memberId: string,
  preferredKind?: StressMetricKind | null,
): MemberStressMetric | null {
  if (results == null) {
    return null;
  }

  const memberStress = results.memberStresses[memberId];

  if (memberStress == null) {
    return null;
  }

  const metricKind = preferredKind ?? resolveStressMetricKind(results);

  if (metricKind == null) {
    return null;
  }

  const value = memberStress[metricKind];

  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return null;
  }

  return {
    kind: metricKind,
    value,
  };
}

export function getStressMetricRange(results: AnalysisResults | undefined): StressMetricRange | null {
  const metricKind = resolveStressMetricKind(results);

  if (results == null || metricKind == null) {
    return null;
  }

  const values = Object.values(results.memberStresses)
    .map((stress) => stress[metricKind])
    .filter((value): value is number => Number.isFinite(value));

  if (values.length === 0) {
    return null;
  }

  return {
    kind: metricKind,
    min: Math.min(...values),
    max: Math.max(...values),
  };
}
