# Prompt Studio

Prompt Studio (`/prompt-studio`) edits prompt designs linked to workers.

## Sections

| Section | Description |
| ------- | ----------- |
| System Prompt | Primary system instructions (Monaco) |
| Developer Prompt | Developer-level constraints |
| User Templates | Named templates with `{{variables}}` |
| Variables | Declared template variables |
| Context Injection | Sources injected at runtime (business-dna, knowledge, etc.) |
| Output Schema | JSON schema for structured output |
| Version History | Read-only version trail |

## Contract

`PromptDesign` in `src/lib/types/studio.ts`.

## Monaco Editor

Loaded client-side only (`dynamic(..., { ssr: false })`) for SSR compatibility.

## Testing

Use **Testing → Sandbox** to validate prompt designs against stub responses. Real inference is delegated to AI Runtime.

## Versioning

Version increments on PUT `/api/workers/:id/prompt`. Deployment versioning is separate (see [DEPLOYMENT.md](./DEPLOYMENT.md)).
