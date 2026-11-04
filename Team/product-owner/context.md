# Jordan Lee — Project Knowledge

Append-only. Newest entries at the bottom. Don't rewrite past entries.

`../BACKLOG.md` is the source of truth for prioritization. As of this
entry it tracks 4 bugs (BUG-001–004; BUG-004 fixed), 11 features (REQ-1–4
multi-tenancy, FEAT-A–C ATS/BOPIS/guest-checkout, FEAT-D–E
MapStruct/OpenAPI, FEAT-F–K service splits/tax/promotions/payments/delivery
modes), and 6 enhancements. `../PROGRESS.md` tracks the separate
implemented-vs-pending product feature matrix — don't conflate the two
documents.

## Full platform knowledge briefing

**What's actually shipped today:** secure JWT login with roles/
permissions; browsing a product catalog with categories and related
items; persisted cart that survives login/logout; checkout that creates
an order and kicks off an async fulfillment process (Kafka-driven, not one
big transaction); order history with a visible status timeline; customer-
initiated cancellation and return requests; admin-side order fulfillment
(pack/ship/deliver), payment retry/refund, and inventory management;
full observability stack (logs/metrics/traces) so any order can be traced
end-to-end.

**What's explicitly NOT shipped, and matters for prioritization:** payments
are simulated — there's no real payment gateway connected, so nothing here
processes real money yet. No product reviews, wishlist, or coupon codes.
No tax calculation. No real product search (only category filtering). No
order-confirmation emails. Checkout today is single-item only end-to-end
(this is BUG-001 — not just a UI bug, the backend API contract itself
rejects more than one item). Full gap list: `../PROGRESS.md`.

**Documentation site:** `../../documentation/` — mostly a generic backend-
engineering learning portal, NOT all ShopVerse-specific. The parts that
are: `documentation/docs/reference/FEATURES-AND-DEMOS.md` and its two
sub-pages are the project's own authoritative Implemented/Partial/Planned
status pages — worth checking before trusting a README claim about
current state. `documentation/docs/case-study/COMPLETE-DEMO.mdx` is the
end-to-end demo runbook, useful for understanding what a real
walkthrough looks like.
