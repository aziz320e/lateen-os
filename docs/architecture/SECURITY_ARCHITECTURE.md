---
title: Security Architecture
title_ar: العمارة الأمنية
version: 1.0.0
status: active
phase: "Milestone 2 — Documentation Sprint (Complete)"
owner: Lateen OS Architecture Office
last_updated: 2026-07-29
related_documents:
  - ../AI_PROJECT_CONTEXT.md
  - ../handbook/03_CONSTITUTION.md
  - ../certification/SECURITY_AUDIT.md
  - GOVERNANCE_ARCHITECTURE.md
related_engines:
  - api-gateway
  - ai-security-engine
related_commits:
  - "35"
---

# العربية

## العمارة الأمنية

### 1. المصدر

هذا المستند يُعيد تقديم النتائج الحقيقية المُتحقَّق منها في `docs/certification/SECURITY_AUDIT.md` كعمارة أمنية للمنصة، مع الاستشهاد بمسارات الملفات الفعلية. لا نتيجة هنا مُخترعة — كل سطر تحقّقنا منه مباشرة بقراءة الكود المصدري.

### 2. مفاتيح API لا تُخزَّن أبدًا كنص صريح

`packages/api-gateway/src/authentication/repository.impl.ts`'s `findByHash()` يبحث بالهاش (`keyHash`)، لا بالمفتاح الخام؛ نوع `ApiKey` يخزّن الهاش فقط.

### 3. مقارنة زمن-ثابت لتوقيعات JWT وHMAC

`packages/api-gateway/src/authentication/jwt.ts` (محقّق مباشرة):

```ts
import { createHmac, timingSafeEqual } from 'node:crypto';
export function verifyToken(token: string, secret: string, options: VerifyTokenOptions = {}): JwtVerificationResult {
  // ...
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) { /* رفض */ }
}
```

فحص طول أولًا (لأن `timingSafeEqual` يرمي استثناءً عند اختلاف الطول)، ثم مقارنة زمن-ثابت حقيقية — يتجنّب قناة توقيت جانبية عند محاولات تزوير التوقيع. النمط نفسه (`signHmac`/`verifyHmac`) موجود في `packages/ai-security-engine/src/shared/crypto.ts`.

### 4. تشفير الأسرار الحقيقي (AES-256-GCM)

`packages/ai-security-engine/src/shared/crypto.ts` (محقّق مباشرة، `node:crypto` فقط، لا مكتبة خارجية):

```ts
import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
export function encryptValue(key: string, plaintext: string, randomBytesFn: RandomBytesFn = defaultRandomBytes): EncryptedValue {
  const cipher = createCipheriv('aes-256-gcm', Buffer.from(key, 'hex'), iv);
  // ...
}
export function decryptValue(key: string, encrypted: EncryptedValue): string {
  // يفشل عند أي تلاعب أو مفتاح خاطئ — فحص سلامة حقيقي، لا فك تشفير صامت لبيانات فاسدة
}
```

`encryptValue()`/`decryptValue()` تُستدعيان من `secrets/service.impl.ts`'s `createSecret()`/`rotateSecret()`/`getSecretValue()` — لا حقل نص صريح في سجل `Secret` المخزَّن. فك التشفير مُصادَق عليه (`setAuthTag`) وليس فقط سريًا.

### 5. عشوائية تشفيرية قابلة للحقن، أبدًا `Math.random()`

كل قيمة حسّاسة أمنيًا (مفتاح API، رمز، مفتاح تشفير، معرّف سر) تُنشأ عبر `node:crypto`'s `randomBytes`، قابلة للحقن عبر معامل `RandomBytesFn` صريح للاختبارات الحتمية — نفس نمط `now()` القابل للحقن، مطبَّق هنا على العشوائية.

### 6. لا بيانات حسّاسة على ناقل الأحداث

أحداث `apikey.issued`/`apikey.revoked` في `api-gateway` تحمل `organizationId`, `apiKeyId`, `name` فقط — أبدًا المفتاح أو الهاش. حدث `secret.rotated` في `ai-security-engine` يحمل `secretId`, `organizationId` فقط — أبدًا نص مشفّر أو صريح أو مفتاح التشفير.

### 7. عزل متعدد المستأجرين (Multi-Tenancy) في كل استدعاء مستودع حسّاس

`SecretRepository.findById(organizationId, secretId)`, `ApiKeyRepository.findByHash(organizationId, keyHash)` وما يعادلها تأخذ جميعًا `organizationId` كمعامل أول إلزامي — يجعل عبور حدود المؤسسة مستحيلًا بنيويًا.

### 8. حدود ما لم يُفحَص (إفصاح، لا إخفاء)

`docs/certification/SECURITY_AUDIT.md` F2 يُصرّح بوضوح أن تدقيق حدود التفويض/الأدوار (RBAC) الكامل لكل حزمة من الـ39 لم يُجرَ — التركيز كان على الحزمتين اللتين تتعاملان مع مواد تشفيرية حقيقية (`api-gateway`, `ai-security-engine`) بالإضافة إلى فحص شامل لحمولات الأحداث. هذا إفصاح صريح موثّق، لا إغفال صامت.

---

# English

## Security Architecture

### 1. Source

This document re-presents the real, verified findings from `docs/certification/SECURITY_AUDIT.md` as the platform's security architecture, citing real file paths. No claim here is invented — every line was verified directly by reading the source.

### 2. API Keys Are Never Stored in Plaintext

`packages/api-gateway/src/authentication/repository.impl.ts`'s `findByHash()` looks up by `keyHash`, not the raw key; the `ApiKey` type stores only the hash.

### 3. Constant-Time Comparison for JWT and HMAC

`packages/api-gateway/src/authentication/jwt.ts` (verified directly):

```ts
import { createHmac, timingSafeEqual } from 'node:crypto';
export function verifyToken(token: string, secret: string, options: VerifyTokenOptions = {}): JwtVerificationResult {
  // ...
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) { /* reject */ }
}
```

A length check first (since `timingSafeEqual` throws on a length mismatch), then a real constant-time comparison — avoids a timing side-channel on signature-forgery attempts. The same pattern (`signHmac`/`verifyHmac`) exists in `packages/ai-security-engine/src/shared/crypto.ts`.

### 4. Real Secret Encryption (AES-256-GCM)

`packages/ai-security-engine/src/shared/crypto.ts` (verified directly, `node:crypto` only, no third-party library):

```ts
import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
export function encryptValue(key: string, plaintext: string, randomBytesFn: RandomBytesFn = defaultRandomBytes): EncryptedValue {
  const cipher = createCipheriv('aes-256-gcm', Buffer.from(key, 'hex'), iv);
  // ...
}
export function decryptValue(key: string, encrypted: EncryptedValue): string {
  // throws on any tampering or wrong key — real integrity check, never a silent return of corrupted plaintext
}
```

`encryptValue()`/`decryptValue()` are called from `secrets/service.impl.ts`'s `createSecret()`/`rotateSecret()`/`getSecretValue()` — no plaintext field exists on the stored `Secret` record. Decryption is authenticated (`setAuthTag`), not just confidential.

### 5. Injectable Cryptographic Randomness, Never `Math.random()`

Every security-sensitive value (API key, token, encryption key, secret ID) is generated through `node:crypto`'s `randomBytes`, injectable via an explicit `RandomBytesFn` parameter for deterministic tests — the same injectable-primitive pattern used for `now()`, applied here to randomness.

### 6. No Sensitive Data on the Event Bus

`api-gateway`'s `apikey.issued`/`apikey.revoked` events carry only `organizationId`, `apiKeyId`, `name` — never the key or its hash. `ai-security-engine`'s `secret.rotated` event carries only `secretId`, `organizationId` — never ciphertext, plaintext, or the encryption key.

### 7. Multi-Tenancy Isolation on Every Sensitive Repository Call

`SecretRepository.findById(organizationId, secretId)`, `ApiKeyRepository.findByHash(organizationId, keyHash)`, and equivalents all take `organizationId` as a required first parameter — making a cross-organization lookup structurally impossible.

### 8. Boundaries of What Was Not Checked (Disclosure, Not Omission)

`docs/certification/SECURITY_AUDIT.md` F2 explicitly discloses that a full authorization/RBAC-boundary review of all 39 packages was not performed — evidence-gathering focused on the two packages handling real cryptographic material (`api-gateway`, `ai-security-engine`) plus a platform-wide event-payload scan. This is a disclosed scope limit, not a silent omission.

---

## Related Documents

- [../AI_PROJECT_CONTEXT.md](../AI_PROJECT_CONTEXT.md)
- [../handbook/03_CONSTITUTION.md](../handbook/03_CONSTITUTION.md)
- [../certification/SECURITY_AUDIT.md](../certification/SECURITY_AUDIT.md)
- [GOVERNANCE_ARCHITECTURE.md](./GOVERNANCE_ARCHITECTURE.md)

## Related Engines

`api-gateway`, `ai-security-engine`.

## Related Commits

Commit 35 — Enterprise Platform Certification & Stabilization, and the subsequent documentation sprint.
