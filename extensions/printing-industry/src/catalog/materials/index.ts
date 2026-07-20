import type { MaterialCatalogItem } from '../../types.js';

function material(id: string, name: string, materialType: string, unit: MaterialCatalogItem['unitOfMeasure']): MaterialCatalogItem {
  return {
    id,
    name,
    description: `${name} — substrate material template`,
    materialType,
    unitOfMeasure: unit,
    tags: [materialType],
  };
}

export const PRINTING_MATERIALS: MaterialCatalogItem[] = [
  material('acrylic', 'Acrylic', 'rigid_substrate', 'sheet'),
  material('pvc', 'PVC', 'rigid_substrate', 'sheet'),
  material('acp', 'ACP', 'composite', 'sheet'),
  material('wood', 'Wood', 'rigid_substrate', 'sheet'),
  material('foam', 'Foam', 'rigid_substrate', 'sheet'),
  material('mdf', 'MDF', 'rigid_substrate', 'sheet'),
  material('vinyl', 'Vinyl', 'flexible_substrate', 'roll'),
  material('reflective-vinyl', 'Reflective Vinyl', 'flexible_substrate', 'roll'),
  material('canvas', 'Canvas', 'flexible_substrate', 'roll'),
  material('paper', 'Paper', 'flexible_substrate', 'sheet'),
  material('cardboard', 'Cardboard', 'packaging', 'sheet'),
  material('fabric', 'Fabric', 'flexible_substrate', 'roll'),
  material('glass', 'Glass', 'rigid_substrate', 'sheet'),
  material('metal', 'Metal', 'rigid_substrate', 'sheet'),
];
