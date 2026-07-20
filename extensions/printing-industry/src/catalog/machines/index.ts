import type { MachineCatalogItem } from '../../types.js';

function machine(
  id: string,
  name: string,
  machineType: string,
  category: MachineCatalogItem['category'],
  materials: string[],
  capabilities: string[],
): MachineCatalogItem {
  return {
    id,
    name,
    description: `${name} — production machine template`,
    machineType,
    category,
    supportedMaterials: materials,
    capabilities,
    tags: [category, machineType],
  };
}

export const PRINTING_MACHINES: MachineCatalogItem[] = [
  machine('uv-printer', 'UV Printer', 'uv_flatbed_printer', 'print', ['acrylic', 'pvc', 'wood', 'glass', 'metal'], ['uv-printing', 'printing']),
  machine('eco-solvent', 'Eco Solvent', 'roll_printer_solvent', 'print', ['vinyl', 'canvas', 'fabric'], ['printing']),
  machine('latex-printer', 'Latex Printer', 'roll_printer_latex', 'print', ['vinyl', 'fabric', 'paper'], ['printing']),
  machine('laser-cutter', 'Laser Cutter', 'laser_cutter', 'cut', ['acrylic', 'wood', 'mdf', 'fabric'], ['laser-cutting', 'engraving']),
  machine('fiber-laser', 'Fiber Laser', 'laser_cutter', 'cut', ['metal', 'acrylic'], ['laser-cutting', 'engraving']),
  machine('cnc-router', 'CNC Router', 'cnc_router', 'fabrication', ['acrylic', 'wood', 'mdf', 'pvc', 'foam'], ['cnc-routing']),
  machine('plotter', 'Plotter', 'flatbed_cutter', 'cut', ['vinyl', 'reflective-vinyl'], ['laser-cutting']),
  machine('laminator', 'Laminator', 'laminator', 'finishing', ['vinyl', 'paper', 'canvas'], ['lamination']),
  machine('heat-press', 'Heat Press', 'mounting_press', 'finishing', ['fabric', 'vinyl'], ['heat-transfer']),
  machine('bending-machine', 'Bending Machine', 'channel_letter_fabricator', 'fabrication', ['acrylic', 'metal'], ['bending']),
  machine('channel-letter-machine', 'Channel Letter Machine', 'channel_letter_fabricator', 'fabrication', ['acrylic', 'metal'], ['bending', 'installation']),
  machine('3d-printer', '3D Printer', 'cnc_router', 'fabrication', ['pvc', 'acrylic'], ['cnc-routing']),
];
