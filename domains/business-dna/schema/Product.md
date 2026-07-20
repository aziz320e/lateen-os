# Product

> **Enrichment:** Business DNA Enrichment v1 — Lateen-specific

## Purpose

A **Product** at Lateen is a **manufactured or printed offering** in the visual communications and production catalog — signage panels, branding collateral, construction graphics, vehicle wraps, packaging, and custom fabricated items.

Products carry full production metadata: which machines can make them, material specifications, finishing requirements, profitability targets, trend signals, and AI-generated insights. Products are the bridge between sales quotations and production job routing.

## Responsibilities

- Define what Lateen sells with production-ready specifications
- Hold manufacturing routing — materials, machines, finishing steps
- Track profitability targets and actual margin performance
- Capture trend and demand signals from Intelligence domain
- Store AI-generated metadata — demand forecasts, cross-sell suggestions, production risk flags
- Anchor line items in quotations, orders, and production jobs

## Attributes

### Core Identity

| Attribute        | Type     | Required | Description                                                         |
| ---------------- | -------- | -------- | ------------------------------------------------------------------- |
| `id`             | UUID     | Yes      | Stable unique identifier                                            |
| `organizationId` | UUID     | Yes      | Owning organization (Lateen)                                        |
| `code`           | String   | Yes      | SKU (e.g. `SGN-UVAC-3MM-A0`)                                        |
| `name`           | String   | Yes      | Product name (e.g. `UV Printed Acrylic Sign — 3mm`)                 |
| `description`    | String   | No       | Customer-facing description                                         |
| `status`         | Enum     | Yes      | `draft`, `active`, `seasonal`, `discontinued`, `archived`           |
| `category`       | Enum     | Yes      | See [Product Categories](#product-categories)                       |
| `subcategory`    | String   | No       | Finer classification (e.g. `illuminated`, `wayfinding`, `hoarding`) |
| `unitOfMeasure`  | Enum     | Yes      | `sqm`, `each`, `linear_m`, `set`, `roll`, `pack`                    |
| `basePrice`      | Decimal  | No       | List price (SAR)                                                    |
| `currency`       | ISO 4217 | Yes      | Price currency (`SAR`)                                              |
| `taxCategory`    | String   | No       | ZATCA tax classification                                            |

### Manufacturing Specification

| Attribute                | Type    | Required | Description                                                                                                                      |
| ------------------------ | ------- | -------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `productionType`         | Enum    | Yes      | `print_only`, `fabrication`, `print_and_fabrication`, `assembly`, `installation_service`                                         |
| `primaryMaterial`        | Enum    | No       | `vinyl`, `acrylic`, `aluminum_composite`, `corrugated`, `fabric`, `foam_board`, `steel`, `pvc`, `paper`, `canvas`                |
| `materialThicknessMm`    | Decimal | No       | Material thickness                                                                                                               |
| `defaultWidthMm`         | Integer | No       | Default width                                                                                                                    |
| `defaultHeightMm`        | Integer | No       | Default height                                                                                                                   |
| `finishingSteps`         | Enum[]  | No       | `lamination_matte`, `lamination_gloss`, `mounting`, `cutting`, `routing`, `welding`, `painting`, `led_installation`, `packaging` |
| `colorSpec`              | Enum    | No       | `cmyk`, `cmyk_white`, `spot_pantone`, `full_color`, `monochrome`                                                                 |
| `approvedMachineIds`     | UUID[]  | No       | Machines certified to produce this product                                                                                       |
| `productionLeadTimeDays` | Integer | No       | Standard production lead time                                                                                                    |
| `minOrderQuantity`       | Decimal | No       | Minimum order quantity                                                                                                           |
| `maxOrderQuantity`       | Decimal | No       | Maximum single-order quantity                                                                                                    |
| `requiresInstallation`   | Boolean | No       | Whether product requires on-site installation                                                                                    |
| `requiresSiteSurvey`     | Boolean | No       | Whether site survey is required before production                                                                                |
| `productionNotes`        | String  | No       | Internal production instructions                                                                                                 |

### Profitability

| Attribute                | Type     | Required | Description                                         |
| ------------------------ | -------- | -------- | --------------------------------------------------- |
| `costPrice`              | Decimal  | No       | Fully loaded production cost (SAR)                  |
| `materialCost`           | Decimal  | No       | Raw material cost component                         |
| `laborCost`              | Decimal  | No       | Labor cost component                                |
| `machineCost`            | Decimal  | No       | Machine time cost component                         |
| `targetMarginPct`        | Decimal  | No       | Target gross margin percentage                      |
| `actualMarginPct`        | Decimal  | No       | Rolling actual margin (derived from orders)         |
| `marginStatus`           | Enum     | No       | `above_target`, `on_target`, `below_target`, `loss` |
| `lastMarginCalculatedAt` | DateTime | No       | Last profitability recalculation                    |

### Trends & Demand

| Attribute            | Type     | Required | Description                                                                                   |
| -------------------- | -------- | -------- | --------------------------------------------------------------------------------------------- |
| `trendScore`         | Decimal  | No       | Intelligence trend score (0–100)                                                              |
| `trendDirection`     | Enum     | No       | `rising`, `stable`, `declining`                                                               |
| `demandForecast30d`  | Decimal  | No       | Forecasted unit demand — next 30 days                                                         |
| `demandForecast90d`  | Decimal  | No       | Forecasted unit demand — next 90 days                                                         |
| `seasonality`        | Enum[]   | No       | `ramadan`, `hajj`, `back_to_school`, `national_day`, `exhibition_season`, `construction_peak` |
| `lastTrendUpdatedAt` | DateTime | No       | Last Intelligence trend refresh                                                               |

### AI Metadata

| Attribute                 | Type     | Required | Description                                                                |
| ------------------------- | -------- | -------- | -------------------------------------------------------------------------- |
| `aiDemandRisk`            | Enum     | No       | `low`, `medium`, `high` — AI-assessed supply/demand mismatch risk          |
| `aiCrossSellProductIds`   | UUID[]   | No       | Products AI recommends cross-selling                                       |
| `aiProductionRisk`        | Enum     | No       | `none`, `capacity_constrained`, `material_shortage`, `machine_unavailable` |
| `aiPricingRecommendation` | Decimal  | No       | AI-suggested price adjustment (SAR)                                        |
| `aiLastAnalyzedAt`        | DateTime | No       | Last AI analysis timestamp                                                 |
| `aiSummary`               | String   | No       | AI-generated product performance summary                                   |

### Audit

| Attribute    | Type     | Required | Description                 |
| ------------ | -------- | -------- | --------------------------- |
| `supplierId` | UUID     | No       | Primary material supplier   |
| `createdAt`  | DateTime | Yes      | Record creation timestamp   |
| `updatedAt`  | DateTime | Yes      | Last modification timestamp |

### Product Categories

| Category                | Examples                                                    |
| ----------------------- | ----------------------------------------------------------- |
| `signage`               | Outdoor signs, pylon signs, wayfinding, safety signs        |
| `branding`              | Logos, corporate identity kits, brand guidelines collateral |
| `construction_graphics` | Hoarding wraps, site signage, safety boards, floor graphics |
| `vehicle_graphics`      | Full wraps, partial wraps, fleet branding                   |
| `retail_print`          | POS displays, shelf talkers, window graphics                |
| `corporate_print`       | Business cards, brochures, reports, stationery              |
| `packaging`             | Custom boxes, labels, sleeves                               |
| `exhibition`            | Stand graphics, backdrops, portable displays                |
| `architectural`         | Wall murals, decorative panels, laser-cut screens           |
| `illuminated`           | Channel letters, lightboxes, LED signs                      |

## Relationships

| Related Entity | Cardinality | Description                                         |
| -------------- | ----------- | --------------------------------------------------- |
| Organization   | many → 1    | Product belongs to Lateen                           |
| Machine        | many → many | Approved production machines                        |
| Supplier       | many → 1    | Material supplier                                   |
| Customer       | many → many | Customers who order this product (derived)          |
| Quotation      | many → many | Quotation line items                                |
| Order          | many → many | Order line items                                    |
| Project        | many → many | Products specified in projects                      |
| KPI            | many → many | Margin, volume, and quality KPIs                    |
| AI Agent       | many → many | Product Manager AI and Sales AI monitor proactively |

## Lifecycle

```
draft → active → seasonal → active → discontinued → archived
```

| State          | Description                                          |
| -------------- | ---------------------------------------------------- |
| `draft`        | Product defined; production routing not yet verified |
| `active`       | Product available for quotations and production      |
| `seasonal`     | Product available only during defined seasons        |
| `discontinued` | No new orders; existing orders fulfilled             |
| `archived`     | Retired from catalog; read-only                      |

## Events

| Event                              | Trigger                               |
| ---------------------------------- | ------------------------------------- |
| `product.created`                  | New product created                   |
| `product.activated`                | Product moved to active               |
| `product.seasonal_activated`       | Seasonal availability started         |
| `product.seasonal_ended`           | Seasonal availability ended           |
| `product.discontinued`             | Product discontinued                  |
| `product.archived`                 | Product archived                      |
| `product.price_changed`            | Base price updated                    |
| `product.margin_calculated`        | Profitability recalculated            |
| `product.margin_below_target`      | Margin fell below target              |
| `product.trend_updated`            | Trend score refreshed by Intelligence |
| `product.ai_analyzed`              | AI metadata refreshed                 |
| `product.production_risk_detected` | AI flagged production risk            |
| `product.updated`                  | Any attribute changed                 |

## Business Rules

- Active products must have `productionType`, `category`, and at least one `approvedMachineId`.
- Production jobs cannot be routed to machines not listed in `approvedMachineIds`.
- `marginStatus` of `loss` triggers proactive alert from Finance AI and Product Manager AI.
- AI metadata fields are written by AI agents and Intelligence — not manually overridden without audit trail.
- Seasonal products outside their `seasonality` window cannot be added to new quotations.
- Price changes do not retroactively alter confirmed orders or active enterprise contracts.
- `costPrice` must be recalculated when `materialCost`, `laborCost`, or `machineCost` components change.
- Discontinued products remain on active recurring order schedules until contract amendment.
