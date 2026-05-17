import { resolveCatalogProfileColor, type CrossSectionCatalogItem } from '../../entities/section';

export function buildAssignedCatalogProfileColors(
  itemsByGroup: Partial<Record<string, CrossSectionCatalogItem>>,
): Partial<Record<string, string>> {
  return Object.fromEntries(
    Object.entries(itemsByGroup)
      .filter((entry): entry is [string, CrossSectionCatalogItem] => entry[1] != null)
      .map(([groupKey, item]) => [groupKey, resolveCatalogProfileColor(item)] as const)
      .filter((entry): entry is [string, string] => typeof entry[1] === 'string' && entry[1].length > 0),
  );
}
