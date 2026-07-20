# Machine

> **Enrichment:** Business DNA Enrichment v1 — Lateen-specific

## Purpose

A **Machine** at Lateen represents a **physical production asset or production-line automation** — not a generic software bot. Machines are the print presses, cutters, fabricators, and finishing equipment that transform Product specifications into delivered goods.

Each Machine is registered in Business DNA with its real capabilities: format size, material compatibility, throughput, and finishing options. AI agents (especially Operations AI) schedule jobs, monitor utilization, and detect bottlenecks across the production fleet.

## Responsibilities

- Register Lateen's print and manufacturing equipment as authoritative production capacity
- Declare material, format, color, and finishing capabilities per machine
- Track utilization, maintenance cycles, and job queue state
- Enable job routing — matching Product production requirements to capable machines
- Feed Intelligence with throughput, downtime, and cost-per-impression data
- Distinguish physical production machines from software integrations (which remain `integration` type)

## Attributes

### Core Identity

| Attribute           | Type   | Required | Description                                                                                |
| ------------------- | ------ | -------- | ------------------------------------------------------------------------------------------ |
| `id`                | UUID   | Yes      | Stable unique identifier                                                                   |
| `organizationId`    | UUID   | Yes      | Owning organization (Lateen)                                                               |
| `branchId`          | UUID   | Yes      | Production facility where machine is located                                               |
| `code`              | String | Yes      | Machine code (e.g. `RYD-UVFLAT-01`)                                                        |
| `name`              | String | Yes      | Display name (e.g. `Riyadh UV Flatbed #1`)                                                 |
| `status`            | Enum   | Yes      | `draft`, `active`, `idle`, `running`, `maintenance`, `error`, `decommissioned`, `archived` |
| `ownerDepartmentId` | UUID   | Yes      | Owning department (e.g. print production, fabrication)                                     |
| `ownerEmployeeId`   | UUID   | No       | Machine operator or production supervisor                                                  |

### Machine Classification

| Attribute       | Type    | Required | Description                                                             |
| --------------- | ------- | -------- | ----------------------------------------------------------------------- |
| `category`      | Enum    | Yes      | `print`, `cut`, `fabrication`, `finishing`, `packaging`, `installation` |
| `type`          | Enum    | Yes      | See [Production Machine Types](#production-machine-types)               |
| `manufacturer`  | String  | No       | Equipment manufacturer (e.g. `HP`, `Durst`, `Kongsberg`, `Zünd`)        |
| `model`         | String  | No       | Model name and number                                                   |
| `serialNumber`  | String  | No       | Manufacturer serial number                                              |
| `yearInstalled` | Integer | No       | Year of installation                                                    |

### Production Capabilities

| Attribute              | Type    | Required | Description                                                                                                                        |
| ---------------------- | ------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `maxWidthMm`           | Integer | No       | Maximum printable/cutable width in millimeters                                                                                     |
| `maxLengthMm`          | Integer | No       | Maximum printable/cutable length in millimeters                                                                                    |
| `maxThicknessMm`       | Decimal | No       | Maximum material thickness                                                                                                         |
| `supportedMaterials`   | Enum[]  | No       | `vinyl`, `fabric`, `acrylic`, `aluminum_composite`, `corrugated`, `foam_board`, `paper`, `canvas`, `pvc`, `steel`, `wood`, `glass` |
| `printTechnology`      | Enum    | No       | `uv_flatbed`, `latex_roll`, `solvent_roll`, `dye_sublimation`, `screen`, `digital_toner`, `none`                                   |
| `colorCapability`      | Enum    | No       | `cmyk`, `cmyk_white`, `cmyk_varnish`, `spot_color`, `monochrome`                                                                   |
| `maxResolutionDpi`     | Integer | No       | Maximum print resolution                                                                                                           |
| `cutCapability`        | Boolean | No       | Whether machine performs cutting                                                                                                   |
| `routingCapability`    | Boolean | No       | CNC routing capability                                                                                                             |
| `laminationCapability` | Boolean | No       | Inline or offline lamination                                                                                                       |
| `embossingCapability`  | Boolean | No       | Embossing or debossing                                                                                                             |

### Throughput & Cost

| Attribute                | Type    | Required | Description                                                     |
| ------------------------ | ------- | -------- | --------------------------------------------------------------- |
| `throughputUnitsPerHour` | Decimal | No       | Typical output units per hour                                   |
| `throughputUnit`         | String  | No       | Unit of throughput (e.g. `sqm`, `linear_m`, `sheets`, `pieces`) |
| `setupTimeMinutes`       | Integer | No       | Average job setup time                                          |
| `costPerHour`            | Decimal | No       | Fully loaded hourly operating cost (SAR)                        |
| `costPerUnit`            | Decimal | No       | Average cost per throughput unit (SAR)                          |
| `utilizationTargetPct`   | Decimal | No       | Target utilization percentage for KPI monitoring                |

### Operations

| Attribute           | Type     | Required | Description                           |
| ------------------- | -------- | -------- | ------------------------------------- |
| `currentJobId`      | UUID     | No       | Active production job reference       |
| `queueDepth`        | Integer  | No       | Jobs waiting in queue (derived)       |
| `lastMaintenanceAt` | DateTime | No       | Last scheduled maintenance            |
| `nextMaintenanceAt` | DateTime | No       | Next scheduled maintenance            |
| `lastRunAt`         | DateTime | No       | Last production run completed         |
| `totalRunHours`     | Decimal  | No       | Cumulative operating hours            |
| `errorCode`         | String   | No       | Last error code if status is `error`  |
| `integrationId`     | String   | No       | RIP, MIS, or IoT connector identifier |

### Audit

| Attribute   | Type     | Required | Description                 |
| ----------- | -------- | -------- | --------------------------- |
| `createdAt` | DateTime | Yes      | Record creation timestamp   |
| `updatedAt` | DateTime | Yes      | Last modification timestamp |

### Production Machine Types

| Type                        | Category    | Description                                                 |
| --------------------------- | ----------- | ----------------------------------------------------------- |
| `uv_flatbed_printer`        | print       | UV flatbed for rigid and semi-rigid substrates              |
| `roll_printer_latex`        | print       | Latex roll-to-roll for banners, textiles, wallpaper         |
| `roll_printer_solvent`      | print       | Solvent roll printer for outdoor vinyl                      |
| `dye_sublimation_printer`   | print       | Fabric and textile sublimation                              |
| `screen_printer`            | print       | Screen printing for high-volume spot color                  |
| `digital_toner_printer`     | print       | Commercial digital for documents and short-run collateral   |
| `cnc_router`                | cut         | CNC routing for acrylic, aluminum, wood signage             |
| `flatbed_cutter`            | cut         | Digital cutting table (Kongsberg, Zünd)                     |
| `laser_cutter`              | cut         | Laser cutting and engraving                                 |
| `die_cutter`                | cut         | Die cutting for packaging and labels                        |
| `laminator`                 | finishing   | Hot/cold lamination                                         |
| `mounting_press`            | finishing   | Rigid panel mounting and bonding                            |
| `channel_letter_fabricator` | fabrication | Channel letter and illuminated sign fabrication             |
| `metal_fabricator`          | fabrication | Metal bending, welding for sign structures                  |
| `packaging_line`            | packaging   | Automated packaging and labeling                            |
| `integration`               | —           | Software integration (RIP, MIS, ERP connector)              |
| `scheduled_job`             | —           | Non-physical automation (queue processor, report generator) |

## Relationships

| Related Entity | Cardinality | Description                               |
| -------------- | ----------- | ----------------------------------------- |
| Organization   | many → 1    | Machine belongs to Lateen                 |
| Branch         | many → 1    | Production facility location              |
| Department     | many → 1    | Production department owner               |
| Employee       | many → 1    | Operator or supervisor                    |
| Product        | many → many | Products this machine can produce         |
| Project        | many → many | Projects using this machine               |
| Order          | many → many | Orders routed to this machine             |
| Workflow       | many → many | Production and maintenance workflows      |
| KPI            | many → many | Utilization, downtime, cost-per-unit KPIs |
| AI Agent       | many → many | Operations AI schedules and monitors      |
| Supplier       | many → 1    | Equipment vendor or service provider      |

## Lifecycle

```
draft → active → idle → running → idle → maintenance → active → error → maintenance → active → decommissioned → archived
```

| State            | Description                                       |
| ---------------- | ------------------------------------------------- |
| `draft`          | Machine registered; capabilities not yet verified |
| `active`         | Machine available for job assignment              |
| `idle`           | Machine online; no active job                     |
| `running`        | Machine executing a production job                |
| `maintenance`    | Scheduled or unscheduled maintenance              |
| `error`          | Fault condition; production halted                |
| `decommissioned` | Machine permanently removed from fleet            |
| `archived`       | Record retained for audit                         |

## Events

| Event                           | Trigger                                       |
| ------------------------------- | --------------------------------------------- |
| `machine.created`               | New machine registered                        |
| `machine.activated`             | Machine verified and available for production |
| `machine.job_started`           | Production job started                        |
| `machine.job_completed`         | Production job finished                       |
| `machine.idle`                  | Machine returned to idle                      |
| `machine.maintenance_started`   | Maintenance began                             |
| `machine.maintenance_completed` | Maintenance finished                          |
| `machine.error`                 | Fault detected                                |
| `machine.decommissioned`        | Machine decommissioned                        |
| `machine.archived`              | Machine archived                              |
| `machine.utilization_reported`  | Utilization metrics recorded                  |
| `machine.updated`               | Any attribute changed                         |

## Business Rules

- Production machines must declare `category`, `type`, and `branchId` before activation.
- A job may only be routed to a machine whose `supportedMaterials`, format limits, and capabilities match the Product production specification.
- Machines in `maintenance` or `error` state reject new job assignments; queued jobs are rerouted by Operations AI.
- Utilization below `utilizationTargetPct` for 5 consecutive business days triggers a proactive recommendation from Operations AI.
- `costPerHour` and `costPerUnit` feed Product profitability calculations; changes emit `machine.updated`.
- Physical production machines are not AI agents — Operations AI orchestrates them.
- Decommissioned machines retain historical job data but cannot be reassigned.
