import { describe, expect, it } from 'vitest';

import { NO_WIND } from './defaults';
import { migrateGridEngModelToCurrentDetailed } from './migrations';
import { createSampleTowerSegmentModel } from './sample';

describe('migrateGridEngModelToCurrentDetailed', () => {
  it('migrates legacy concentrated member loads into function placeholders', () => {
    const sample = createSampleTowerSegmentModel();
    const legacyModel = {
      schemaVersion: '0.1' as const,
      name: sample.name,
      units: sample.units,
      settings: sample.settings,
      nodes: sample.nodes,
      members: sample.members,
      profiles: sample.profiles,
      materials: sample.materials,
      restraints: sample.restraints,
      loadCases: [
        {
          id: 'lc-legacy',
          name: 'Legacy case',
          loads: [
            {
              id: 'legacy-member-force',
              target: {
                type: 'member' as const,
                memberId: sample.members[0].id,
              },
              vector: {
                force: { x: 0, y: -12, z: 0 },
                moment: { x: 0, y: 0, z: 0 },
              },
              description: 'Legacy brace load',
            },
          ],
          wind: NO_WIND,
        },
      ],
      importMeta: {
        source: 'json' as const,
      },
    };

    const migrated = migrateGridEngModelToCurrentDetailed(legacyModel);
    const migratedLoad = migrated.model.loadCases[0].loads[0];

    expect(migrated.model.schemaVersion).toBe('0.2');
    expect(migratedLoad.type).toBe('member_distributed');
    expect(migratedLoad.kind).toBe('force');
    expect(migratedLoad.direction).toEqual({ x: 0, y: -1, z: 0 });

    if (migratedLoad.type !== 'member_distributed') {
      throw new Error('Expected migrated load to be member_distributed.');
    }

    expect(migratedLoad.distribution.type).toBe('function');
    expect(migrated.warnings).toContain(
      'Legacy concentrated member force load legacy-member-force was migrated to unsupported placeholder for manual review.',
    );
  });

  it('normalizes legacy pressure units and wind field names in current-schema JSON', () => {
    const sample = createSampleTowerSegmentModel();
    const legacyCurrentModel = {
      ...sample,
      units: {
        ...sample.units,
        pressure: 'kPa' as const,
      },
      loadCases: sample.loadCases.map((loadCase) => ({
        ...loadCase,
        wind: {
          direction: { x: 0, y: 1, z: 0 },
          nominalPressureKPa: 0.85,
          comment: 'legacy current model',
        },
      })),
    };

    const migrated = migrateGridEngModelToCurrentDetailed(legacyCurrentModel);

    expect(migrated.model.units.pressure).toBe('Pa');
    expect(migrated.model.loadCases[0].wind).toEqual({
      direction: { x: 0, y: 1, z: 0 },
      nominalPressurePa: 850,
      comment: 'legacy current model',
    });
    expect(migrated.warnings).toContain('Legacy units.pressure value "kPa" was normalized to "Pa".');
    expect(migrated.warnings).toContain('Legacy loadCases[0].wind.nominalPressureKPa was migrated to nominalPressurePa.');
  });
});
