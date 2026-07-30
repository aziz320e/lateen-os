# Lateen OS Enterprise — Roadmap (post v1.0)

## v1.0.0 (GA Target)

- Resolve turbo cyclic dependency (kernel/sdk/extension-system)
- Resolve turbo cyclic dependency (ai-brain/multi-agent) — found in rc.2, see `release/KNOWN_LIMITATIONS.md`
- Payment gateway integration (Stripe contract)
- Real AI Runtime provider implementations
- OpenSearch marketplace search
- Production database migrations for all Prisma services
- Wire `apps/backend` + `apps/erp-web` into the Helm chart / Kubernetes manifests (currently Docker Compose only — added in rc.2)
- Extend the platform-wide ESLint/CI hardening delivered for `apps/backend` + `apps/erp-web` in rc.2 to the remaining packages

## v1.1

- Real signal adapter implementations (Product Discovery)
- AI Brain service implementation
- Multi-region Cloud deployment automation
- Advanced chaos testing automation

## v1.2

- Industry pack marketplace expansion
- Enterprise SSO (SAML/OIDC) hardening
- Advanced analytics data warehouse connector

## v2.0 (Future)

- Architecture v2.0 review
- Federated multi-tenant mesh
- Edge deployment tier

---

**Current release:** v1.0.0-rc.2 (2026-07-30)
