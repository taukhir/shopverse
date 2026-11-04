# ShopVerse Simulated SDLC Team Roster

Companion to [`BACKLOG.md`](BACKLOG.md). Tracks the simulated team for the
practice SDLC exercise running on this repo — who's onboarded, their role,
and what they're currently doing. Update this as roles are added or
reassigned; don't delete history, mark it inactive instead.

For persistent per-role knowledge, dialogue history, and task tracking,
see the per-role folders in this directory — this file stays the
quick-glance roster; [`README.md`](README.md) explains the structure, and
[`sprints/`](sprints/) has the chronological meeting record.

## Roster

| Name | Role | Experience | Status | Responsibility |
|---|---|---|---|---|
| Codex | Senior Solutions Architect | AI collaborator; reassigned 2026-11-04 | Active member; [session activity](senior-solutions-architect/status.md) tracked separately | Service boundaries, contracts, integration architecture, reliability, migration design and technical tradeoffs; [context index](senior-solutions-architect/index.md) |
| Security agent | Cybersecurity Engineer | AI collaborator; onboarded 2026-11-04 | Active member; [session activity](cybersecurity-engineer/status.md) tracked separately | Independent evidence-based security reviews, trust boundaries, authorization, data exposure and remediation guidance; [context index](cybersecurity-engineer/index.md) |
| *(you)* | Senior Developer | — (you) | Active | Breaks requirements into tasks, assigns and reviews junior dev code, delivers |
| Elena Vasquez | Product Architect | 25+ yrs, distributed systems & microservices | Active | Guides system design, reviews architecture decisions, resolves technical open questions |
| Priya Raman | Client | 30 yrs, retail/e-commerce business leadership | Active | Sets business requirements and deadlines |
| Jordan Lee | Product Owner | 18 yrs, product management in e-commerce | Active | Prioritizes backlog, refines acceptance criteria, sizes work |
| Sam Okafor | Business Analyst | 20 yrs, requirements engineering | Active | Turns stakeholder input into formal functional specs |
| Maya Chen | Frontend Developer (Junior Dev 1) | 1.5 yrs, Angular/TypeScript | **Onboarded** | Implements frontend-scoped tasks assigned by the Senior Developer |
| Diego Alvarez | Senior Microservices Developer | 12 yrs, Java/Spring Boot, Kafka, distributed systems | **Onboarded** | Pairs with the Architect on execution, reviews backend code, can drive independent investigations when asked |
| Arjun Mehta | Backend Developer (Junior Dev 2) | 2 yrs, Java/Spring Boot | Not yet onboarded | Reserved for backend-scoped tickets (now likely needed for BUG-001 — see Current Cycle) |
| Noah Bennett | Tester 1 | 3 yrs, manual + automation QA | Not yet onboarded | QA / UAT execution |
| Lena Ortiz | Tester 2 | 2 yrs, QA/UAT, accessibility testing focus | Not yet onboarded | QA / UAT execution |

## Current Cycle

Working ticket: BUG-001 — checkout only orders the first cart item, now
expanded into a full EOM/Order-contract design effort (FEAT-E/FEAT-L).
Everything settled is in [`DECISIONS.md`](DECISIONS.md) (13
decisions as of 2026-11-04); everything unresolved is in
[`OPEN-QUESTIONS.md`](OPEN-QUESTIONS.md) (9 open items). This
section intentionally stays short and links out — it previously
re-quoted facts in full and drifted out of sync with the ledgers because
of it.

Elena Vasquez (Product Architect) is a persistent role for this engagement,
not scoped to any single conversation — same standing as the other named
roles above.

## Onboarding Notes

Each developer subagent is onboarded with: their role, the relevant nested
`AGENTS.md` for the area they'll touch, and the current ticket's spec —
but is explicitly told not to start implementing until the Senior Developer
assigns a specific task. This keeps the SDLC roles honest: the Senior
Developer decides what gets built and in what order, not the Architect or
the developers themselves.

## Role changes — 2026-11-04

Tauqeer reassigned Codex from Product Manager to Senior Solutions Architect and added an independent Cybersecurity Engineer agent. Codex's former Product Manager membership is inactive; earlier contributions remain historical records. Current memory is senior-solutions-architect/; product-manager/ contains compatibility pointers. Elena remains Product Architect. Tauqeer continues to lead implementation.
