# Workflow Builder

The Workflow Builder (`/workflow-builder`, `/automations/[id]`) is the primary visual design surface.

## Features

| Feature | Status |
| ------- | ------ |
| React Flow Canvas | ✅ |
| Drag & Drop (node palette) | ✅ |
| Undo / Redo | ✅ |
| Zoom / Controls | ✅ |
| MiniMap | ✅ |
| Groups / Subflows | Contract (groupId on nodes) |
| Validation | ✅ |

## Node Palette

All 21 supported node types are available in the sidebar palette. Click to add nodes to the canvas.

## Validation Rules

- Must have at least one trigger node
- Workflow must not be empty
- Disconnected nodes are flagged

Validation is design-time only. POST `/api/automations/validate` returns validation results.

## Execution Boundary

The canvas is a design tool. Published workflows are executed by **Workflow Engine**.

## Supported Nodes

Trigger · Condition · Decision · Workflow · Mission · AI Worker · Human Task · Approval · Notification · Email · Webhook · Connector · Business DNA · Knowledge Search · Enterprise Search · Delay · Loop · Switch · Parallel · Merge · Script (placeholder)
