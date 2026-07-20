# Lateen Assistant

Unified conversational interface for Lateen OS — the primary interaction layer for every user.

## Purpose

Lateen Assistant orchestrates the existing platform without containing business logic. It routes commands to Business DNA Service, Product Discovery, AI Product Manager, CEO Cockpit, Integration Hub, Identity Service, and Workflow Engine.

## Stack

- **Next.js 15** + **React 19**
- **Tailwind CSS** + shadcn-style UI
- **TanStack Query**
- **React Markdown** + remark-gfm (tables)
- **Recharts** (inline charts)
- **CodeMirror** (code blocks in reports)

## Quick start

```bash
pnpm --filter @lateen-os/lateen-assistant dev
```

Open http://localhost:3004

Ensure platform services are running (BDS :4001, Discovery :4002, Identity :4003, Integration Hub :4004, AI PM :3000).

## Main experiences

| Section | Route | Description |
| ------- | ----- | ----------- |
| Chat | `/` | Streaming chat, markdown, charts, tables, slash commands |
| Mission Console | `/missions` | Running/completed/paused/failed missions |
| Workflow Console | `/workflows` | Start/pause/resume/cancel workflows |
| Knowledge Explorer | `/knowledge` | Memory, DNA, documents, research, playbooks |
| Memory Explorer | `/memory` | Institutional memory timeline |
| Decision Explorer | `/decisions` | Pending/approved/rejected decisions |
| Command Palette | `⌘K` | Global command search |

## BFF API

| Route | Description |
| ----- | ----------- |
| `POST /api/chat` | Send message (optional `stream: true`) |
| `GET /api/chat` | List/search conversations |
| `GET/POST /api/missions` | Mission console |
| `GET/POST /api/workflows` | Workflow console |
| `GET /api/search` | Cross-platform search |
| `GET /api/memory` | Institutional memory |
| `GET/POST /api/commands` | Command catalog + execute |
| `GET /api/context` | Conversation context + audit traces |

## Documentation

- [ARCHITECTURE.md](./ARCHITECTURE.md)
- [CHAT_MODEL.md](./CHAT_MODEL.md)
- [COMMANDS.md](./COMMANDS.md)

## Verification

```bash
pnpm --filter @lateen-os/lateen-assistant build
pnpm --filter @lateen-os/lateen-assistant typecheck
pnpm --filter @lateen-os/lateen-assistant test
```
