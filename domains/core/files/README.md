# Files

The **Files** capability within Core manages storage and retrieval of documents, media, and attachments.

## Responsibility

- Store and serve files with metadata, versioning, and access control
- Link files to Business DNA entities (projects, customers, products, etc.)
- Enforce storage quotas, retention policies, and file type rules
- Integrate with authorization to gate file access

## Boundaries

Files own _binary storage and retrieval_. Business meaning of attached documents belongs to the linking domain. Knowledge content in Business DNA may reference files; files hold the bytes.
