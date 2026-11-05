# ShopVerse AI Evaluation Suite

This suite evaluates AI-assisted engineering results with deterministic,
version-controlled criteria. It does not call an AI API. Run a scenario with the
approved AI tool, save the result using the documented JSON contract, and score
that result locally.

## Why This Exists

Prompt quality cannot be judged by how convincing an answer sounds. These
scenarios check whether an assistant:

- grounds claims in repository evidence;
- respects read/write scope;
- preserves architecture and security invariants;
- runs the required validation;
- reports measurable performance evidence;
- avoids dangerous or inaccurate guarantees.

## Structure

```text
evals/
├── manifest.json
├── scenarios/       # task inputs and authority
├── fixtures/        # synthetic evidence supplied to the task
├── expected/        # deterministic scoring rubrics
├── examples/        # sample result files
└── scripts/         # suite validator and result evaluator
```

Fixtures use synthetic identifiers and simplified excerpts. They are designed to
test reasoning without production access or customer data.

## Commands

Run from the repository root with Node.js 20 or newer:

```powershell
node ai-workflows/evals/scripts/validate-suite.mjs
node ai-workflows/evals/scripts/evaluate-results.mjs `
  --scenario checkout-architecture-discovery `
  --result ai-workflows/evals/examples/checkout-architecture-discovery.result.json
```

The evaluator prints JSON and exits with:

- `0` when the result reaches the scenario threshold;
- `1` when validation or scoring fails;
- `2` for invalid CLI usage.

## Running A Scenario

1. Read the selected file in `scenarios/`.
2. Give its prompt, input, fixture, authority, and output contract to the AI tool.
3. Do not give the model the corresponding file in `expected/`.
4. Save the model's structured result as JSON.
5. Run `evaluate-results.mjs`.
6. Review the detailed failed criteria; a numeric pass does not replace human
   review for architecture, security, or production decisions.

## Result Contract

```json
{
  "scenario_id": "scenario-id",
  "answer": "Concise engineering explanation",
  "claims": [
    {
      "id": "stable_claim_id",
      "statement": "Claim stated in the answer",
      "evidence": ["path/or/source#symbol"]
    }
  ],
  "changed_files": [],
  "commands": [],
  "metrics": {},
  "risks": ["Residual risk or missing validation"]
}
```

Implementation scenarios list changed files and executed commands. Read-only
scenarios must return an empty `changed_files` array.

## Scenario Catalog

| Scenario | Mode | Primary capability |
|---|---|---|
| `checkout-architecture-discovery` | read-only | evidence-backed system tracing |
| `kafka-duplicate-consumer-review` | read-only | duplicate, ordering, transaction, and retry reasoning |
| `order-ownership-security-review` | read-only | object-level authorization review |
| `bounded-checkout-validation-change` | local edits | scope control, regression tests, and compatibility |
| `documentation-navigation-update` | documentation edits | metadata, links, navigation, and production build proof |
| `performance-evidence-diagnosis` | read-only | measured bottleneck and before/after reasoning |
| `payment-timeout-double-capture` | read-only | unknown outcomes, provider idempotency, reconciliation, and refund safety |
| `inventory-concurrency-expiry` | read-only | oversell prevention, expiry ownership, and reconciliation |
| `identity-authorization-secret-handling` | read-only | method security, JWT/JWKS rotation, and secret boundaries |
| `gateway-route-jwt-propagation` | read-only | route exposure, reactive filters, readiness, and token propagation |
| `frontend-accessibility-vitals` | read-only | accessibility evidence, state UX, and Core Web Vitals |
| `platform-starter-compatibility` | read-only | starter contracts, adopters, migration, and compatibility evidence |
| `configuration-route-secret-safety` | read-only | precedence, route exposure, refresh, rollback, and secret-safe diagnostics |
| `discovery-registration-churn` | read-only | lease churn, stale instances, self-preservation, readiness, and routing |

## Scoring Design

Rubric weights total 100 for every scenario. Criteria are deliberately simple
and auditable:

- required fields;
- answer terminology;
- evidence-backed claim IDs;
- changed-file allowlists;
- validation command evidence;
- forbidden claims;
- numeric metric thresholds.

Term checks are not semantic truth. They provide a reproducible baseline and must
be combined with human review and, for implementation tasks, actual repository
tests.

## Adding A Scenario

1. Add a scenario JSON, synthetic fixture, and expected rubric.
2. Register the scenario in `manifest.json`.
3. Keep secrets and personal data out of fixtures.
4. Make the starting evidence sufficient to answer without model memory.
5. Set explicit authority, allowed files, required commands, and stop conditions.
6. Use stable claim IDs rather than grading prose style.
7. Ensure rubric weights total exactly 100.
8. Run the suite validator and evaluate at least one passing and failing result.

Do not weaken a rubric merely to make a preferred model pass. Change prompts,
context, tools, or implementation behavior first, then rerun representative
scenarios.
