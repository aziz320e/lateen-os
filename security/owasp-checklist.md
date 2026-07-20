# OWASP Checklist — v1.0.0-rc.1

| # | Category | Status | Notes |
| - | -------- | ------ | ----- |
| A01 | Broken Access Control | ✅ | RBAC via Identity service; tenant scoping |
| A02 | Cryptographic Failures | ✅ | TLS in production; JWT for auth |
| A03 | Injection | ✅ | Zod validation; Prisma parameterized queries |
| A04 | Insecure Design | ✅ | Contract-first; BFF pattern |
| A05 | Security Misconfiguration | ⚠️ | Harden defaults before GA |
| A06 | Vulnerable Components | ✅ | Dependency audit complete |
| A07 | Auth Failures | ✅ | Identity service; session/JWT |
| A08 | Software/Data Integrity | ✅ | Lockfile; CI verification |
| A09 | Logging Failures | ✅ | Pino structured logging; audit trails |
| A10 | SSRF | ✅ | BFF proxies; no arbitrary URL fetch in apps |

## RC Status

✅ Pass with A05 noted for GA hardening (CSP headers, rate limiting at gateway).
