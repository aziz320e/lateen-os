import type { CapabilityCatalogItem } from '../../types.js';

function capability(id: string, name: string, category: string, machines: string[]): CapabilityCatalogItem {
  return {
    id,
    name,
    description: `${name} — production capability template`,
    category,
    machines,
    tags: [category],
  };
}

export const PRINTING_CAPABILITIES: CapabilityCatalogItem[] = [
  capability('printing', 'Printing', 'production', ['uv-printer', 'eco-solvent', 'latex-printer']),
  capability('uv-printing', 'UV Printing', 'production', ['uv-printer']),
  capability('laser-cutting', 'Laser Cutting', 'fabrication', ['laser-cutter', 'fiber-laser', 'plotter']),
  capability('cnc-routing', 'CNC Routing', 'fabrication', ['cnc-router', '3d-printer']),
  capability('engraving', 'Engraving', 'fabrication', ['laser-cutter', 'fiber-laser']),
  capability('lamination', 'Lamination', 'finishing', ['laminator']),
  capability('heat-transfer', 'Heat Transfer', 'finishing', ['heat-press']),
  capability('bending', 'Bending', 'fabrication', ['bending-machine', 'channel-letter-machine']),
  capability('installation', 'Installation', 'service', []),
  capability('packaging', 'Packaging', 'fulfillment', []),
  capability('shipping', 'Shipping', 'fulfillment', []),
];
