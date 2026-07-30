# Contract: Test Pyramid & Process Policy

**Feature**: `016-test-strategy`  
**Kind**: Process / suite-shape contract (not an HTTP API)  
**Enforcement**: Code review + constitution; CI does **not** fail on exact 70/20/10 arithmetic

---

## 1. Pyramid bands

| Band | Target share | Intent | Allowed flakiness |
|------|--------------|--------|-------------------|
| Unit | ~70% | Isolated functions/classes/rules; mocked collaborators | None — must be deterministic |
| Integration | ~20% | Real DB (InMemory), HTTP host (`WebApplicationFactory`), caches/queues if introduced | Low — fix or quarantine with replacement |
| E2E | ~10% | Critical user journeys only | Low — same rule as integration |

The share is guidance for authors and reviewers. Inventory checks during adoption (SC-007) verify a recognizably pyramid-shaped suite.

---

## 2. Default choice rule

When adding a test:

1. Prefer **unit** if behavior can be proven without real I/O.
2. Prefer **integration** if the risk is wiring, persistence mapping, or HTTP contract at the host.
3. Prefer **E2E** only if the risk is a cross-stack user journey already listed as critical.

Do not duplicate the same assertion at all three levels without cause.

---

## 3. Critical journeys (initial)

| Id | Journey | Frontends |
|----|---------|-----------|
| `auth-login` | Sign in (and register if required to obtain a session) | Vue, React, Angular |
| `eventos-list-create` | List Eventos and create one successfully | Vue, React, Angular |
| `palestrantes-list-create` | List Palestrantes and create one successfully | Vue, React, Angular |

Adding journeys requires updating this contract and keeping the E2E band thin.

---

## 4. Feature completion rule

A feature or behavior change is **incomplete** unless automated tests exercise the new or changed behavior at an appropriate band (usually unit and/or integration). Coverage % alone does not satisfy this rule if the new paths remain untested.

---

## 5. Bug fix regression rule

Every bug fix MUST include a **regression test** that:

1. Fails when the fix is reverted (or would have failed before the fix), and
2. Passes with the fix applied.

Prefer the lowest band that reliably reproduces the defect.

---

## 6. Anti-patterns (reject in review)

- Deleting tests to pass the gate
- Expanding exclusion lists to hide production code
- Empty or assert-only “coverage filler” tests
- Promoting every screen to E2E
- Merging with failing coverage or baseline compare jobs
