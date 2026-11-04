# Sprint 0001 — Index

**Goal:** Resolve BUG-001 (checkout only orders the first cart item) in
time for the Client's Nov 12 bundle-campaign deadline, or agree on a
revised plan with her.

**Status:** In progress — architecture direction decided (option a), the
EOM/Order JSON design is substantially resolved, several items still
pending the Senior Developer's call. See
[`../../OPEN-QUESTIONS.md`](../../OPEN-QUESTIONS.md) and
[`../../DECISIONS.md`](../../DECISIONS.md) for the current cross-sprint
ledgers — this section no longer duplicates them (it used to, and it
drifted out of date because of it; don't reintroduce a second copy here).

**Participants this sprint:** Senior Developer (you), Elena Vasquez
(Architect), Jordan Lee (PO), Priya Raman (Client), Sam Okafor (BA), Maya
Chen (Frontend Dev, onboarded/unassigned), Diego Alvarez (Senior
Microservices Developer), Codex (Senior Solutions Architect, separate
session), Cybersecurity Engineer (separate session, SEC-REVIEW-001 in
progress).

| File | What's in it |
|---|---|
| [discussion-01.md](discussion-01.md) | First team meeting: Client+PO independently pick BUG-001, BA spec, Maya onboarded, Elena's "frontend-only" scope correction, three resizing options proposed |
| [discussion-02.md](discussion-02.md) | Second meeting: Jordan picks option (c), asks Priya two questions, Priya answers partially, Elena finds a new payment-dedup risk, full platform briefing given to Elena/Jordan/Priya |
| [discussion-03.md](discussion-03.md) | **First structured-format meeting.** Elena pitches the payment-dedup risk as a debugging challenge; Senior Developer investigates and brings back a justified finding |
| [discussion-04.md](discussion-04.md) | Senior Developer commits to option (a). Jordan, Priya, and Diego (first contribution) react independently — two real disagreements surfaced (BUG-001a's necessity, FEAT-L sequencing), plus Diego's reading that discussion-03's risk may be moot under option (a) |
| [discussion-05.md](discussion-05.md) | Independent-reasoning standing rule made explicit. Decided: implement FEAT-E/FEAT-L now via a compromise contract-module design; work foundational engineering until Nov 12, client requirements resume after. Elena's MVP verdict (BUG-001 is the one disqualifying gap) and pushback (enablers aren't the fix) |
| [discussion-06.md](discussion-06.md) | EOM design finalized against the real Amway contract and Codex's (Product Manager, separate session) independent rollout plan. Scoped-down borrows from the real OrderLine model, an overclaim corrected, a real AGENTS.md tension resolved (shared schema source, not shared compiled code) |
| [discussion-07.md](discussion-07.md) | **Single-item agenda, forced by three meetings carrying the same open question.** Is BUG-001's option (a) scheduled now or after Nov 12? Pending the Senior Developer's decision |
| [standups.md](standups.md) | Rolling log — empty, no standups held yet |
| [demo.md](demo.md) | Not yet — sprint still in progress |
| [retro.md](retro.md) | Not yet — sprint still in progress |

## Status

See [`../../DECISIONS.md`](../../DECISIONS.md) for everything settled
this sprint (13 decisions as of discussion-07) and
[`../../OPEN-QUESTIONS.md`](../../OPEN-QUESTIONS.md) for everything
still unresolved (9 open items as of discussion-07, including the
BUG-001 scheduling question now carried across four meetings).
