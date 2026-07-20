import type { ProductCatalogItem } from '../../types.js';

function product(
  id: string,
  name: string,
  category: string,
  productionType: string,
  materials: string[],
  capabilities: string[],
): ProductCatalogItem {
  const sqmProducts = new Set(['vehicle-wrap', 'wall-graphics', 'window-graphics', 'wallpaper', 'canvas', 'banner']);
  return {
    id,
    name,
    description: `${name} — printing industry product template`,
    category,
    unitOfMeasure: sqmProducts.has(id) ? 'sqm' : 'each',
    productionType,
    materials,
    capabilities,
    tags: [category, productionType],
  };
}

export const PRINTING_PRODUCTS: ProductCatalogItem[] = [
  product('business-cards', 'Business Cards', 'corporate_print', 'print_only', ['paper', 'cardboard'], ['printing']),
  product('flyers', 'Flyers', 'corporate_print', 'print_only', ['paper'], ['printing']),
  product('brochures', 'Brochures', 'corporate_print', 'print_and_fabrication', ['paper', 'cardboard'], ['printing', 'lamination']),
  product('roll-up', 'Roll-up', 'exhibition', 'print_and_fabrication', ['vinyl', 'fabric'], ['printing', 'lamination']),
  product('x-banner', 'X-Banner', 'exhibition', 'print_and_fabrication', ['vinyl', 'fabric'], ['printing']),
  product('banner', 'Banner', 'signage', 'print_only', ['vinyl', 'fabric'], ['printing']),
  product('sticker', 'Sticker', 'branding', 'print_only', ['vinyl', 'reflective-vinyl'], ['printing', 'laser-cutting']),
  product('label', 'Label', 'packaging', 'print_only', ['vinyl', 'paper'], ['printing']),
  product('packaging', 'Packaging', 'packaging', 'fabrication', ['cardboard', 'paper'], ['printing', 'packaging']),
  product('box', 'Box', 'packaging', 'fabrication', ['cardboard', 'paper'], ['printing', 'packaging']),
  product('acrylic-sign', 'Acrylic Sign', 'signage', 'fabrication', ['acrylic'], ['uv-printing', 'laser-cutting']),
  product('led-sign', 'LED Sign', 'illuminated', 'print_and_fabrication', ['acrylic', 'metal'], ['uv-printing', 'installation']),
  product('channel-letters', 'Channel Letters', 'illuminated', 'fabrication', ['acrylic', 'metal'], ['bending', 'installation']),
  product('vehicle-wrap', 'Vehicle Wrap', 'vehicle_graphics', 'installation_service', ['vinyl', 'reflective-vinyl'], ['printing', 'installation']),
  product('wall-graphics', 'Wall Graphics', 'construction_graphics', 'installation_service', ['vinyl', 'canvas'], ['printing', 'installation']),
  product('window-graphics', 'Window Graphics', 'retail_print', 'installation_service', ['vinyl'], ['printing', 'installation']),
  product('canvas', 'Canvas', 'retail_print', 'print_only', ['canvas'], ['printing']),
  product('wallpaper', 'Wallpaper', 'architectural', 'installation_service', ['paper', 'vinyl'], ['printing', 'installation']),
  product('menu-board', 'Menu Board', 'retail_print', 'print_and_fabrication', ['acrylic', 'pvc'], ['printing', 'uv-printing']),
  product('exhibition-booth', 'Exhibition Booth', 'exhibition', 'assembly', ['wood', 'mdf', 'fabric', 'vinyl'], ['printing', 'cnc-routing', 'installation']),
];
