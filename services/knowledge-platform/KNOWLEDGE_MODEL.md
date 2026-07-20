# Knowledge Model

## Knowledge Types

| Type | Description |
| ---- | ----------- |
| document | General document |
| email | Email message (.eml) |
| policy | Organizational policy |
| procedure | Standard operating procedure |
| manual | User/operations manual |
| contract | Legal contract |
| specification | Technical specification |
| research | Research document |
| meeting | Meeting notes/recording |
| presentation | Slide deck |
| spreadsheet | Tabular data |
| template | Reusable template |
| playbook | Operational playbook |
| knowledge-article | Wiki-style article |

## Supported Sources

**File formats:** PDF, DOCX, DOC, XLSX, XLS, CSV, PPTX, TXT, Markdown, HTML, Email (.eml)

**Integrations:** Google Drive, OneDrive, SharePoint, Dropbox, Slack, Microsoft Teams, Notion, Confluence, Web Pages

## Metadata Schema

| Field | Type | Description |
| ----- | ---- | ----------- |
| title | string | Document title |
| author | string | Author name |
| department | string | Owning department |
| owner | string | Document owner |
| tags | string[] | Classification tags |
| language | string | ISO language code |
| created | datetime | Source creation date |
| modified | datetime | Source modification date |
| classification | enum | public/internal/confidential/restricted |
| securityLevel | enum | standard/elevated/critical |
| retention | string | Retention policy ID |
| version | number | Document version |
| source | enum | Source type |

## Knowledge Document

Published output after pipeline completion:

```typescript
interface KnowledgeDocument {
  id: string;
  organizationId: string;
  title: string;
  knowledgeType: KnowledgeType;
  sourceType: SourceType;
  chunkCount: number;
  indexed: boolean;
  links?: {
    businessDnaEntityIds?: string[];
    domainGraphNodeIds?: string[];
    institutionalMemoryEntryIds?: string[];
  };
}
```

## Query Ports

| Query | Description |
| ----- | ----------- |
| findDocument | Get document by ID |
| findKnowledge | Full-text search |
| findByEntity | By domain graph entity |
| findByBusinessDna | By Business DNA entity |
| findByDepartment | By department |
| findByTags | By tag matching |
| findRelatedDocuments | Related by department/tags |
| findRecentKnowledge | Recently published |
