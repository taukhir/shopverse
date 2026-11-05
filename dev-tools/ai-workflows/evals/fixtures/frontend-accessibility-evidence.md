# Synthetic frontend evidence

- Checkout modal traps focus after an API error and the error has no programmatic name.
- At 200% zoom, the submit button moves outside the viewport.
- A second click is possible while checkout is pending.
- Measured mobile LCP regressed from 2.1 s to 3.4 s and CLS from 0.03 to 0.19.
- Unit tests pass; no keyboard, screen-reader, responsive, or duplicate-submit browser
  evidence was captured.
