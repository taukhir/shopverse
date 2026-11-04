# Priya Raman — Business Context

Append-only. Newest entries at the bottom. Don't rewrite past entries.

Bundle-deal marketing campaign (buy 3+ items for a discount) is launching
mid-November. Ad media buy locks Nov 8 (short window to adjust after
that); the bundle-deals landing page and email blast are fixed for Nov 12
regardless of engineering status.

## What the storefront can actually do today

Customers can log in, browse products by category, keep a cart that
survives between visits, and check out. After checkout, the order moves
through a visible status timeline (confirmed → packed → shipped →
delivered) and customers can request a cancellation or return. On the
admin side, the team can manage inventory, process orders, and handle
payment retries/refunds.

**Things that don't exist yet, worth knowing before promising a feature
to marketing or customers:** no real payment processing (it's simulated
internally — nothing here charges a real card yet), no product reviews,
no wishlist, no coupon codes, no tax calculation, no real product search
(just category browsing), no order-confirmation emails. And as of this
cycle: checkout only correctly handles a single product per order — this
is exactly the BUG-001 problem. If a future ask depends on one of these
missing pieces, that's a bigger conversation than a bug fix.
