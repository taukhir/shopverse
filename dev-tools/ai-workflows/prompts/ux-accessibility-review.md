# UX And Accessibility Review

Use this workflow for a page, component, or end-to-end user journey. Browser and
visual evidence are required when layout or interaction is material.

## Inputs

```text
Journey: [user goal]
Routes/components: [scope]
Target users and devices: [assumptions]
Design source: [Figma, screenshot, requirement, or existing system]
Required viewports: [desktop, tablet, mobile dimensions]
Authority: read-only review unless implementation is explicitly authorized
```

## Workflow Prompt

```text
Inspect implementation and run the smallest relevant browser flow. Review:
- whether the primary user goal is obvious and achievable;
- loading, empty, validation, submitting, success, recoverable failure, timeout,
  offline, authorization, and unknown-failure states;
- prevention and recovery from duplicate actions;
- hierarchy, content clarity, feedback, layout stability, and perceived speed;
- responsive reflow without clipping, overlap, or inaccessible controls;
- semantic structure, names, labels, descriptions, errors, and instructions;
- keyboard order, visible focus, dialogs, escape behavior, and focus restoration;
- live regions and state announcements without noisy repetition;
- contrast, target size, zoom, reduced motion, and non-color indicators;
- network requests, rendering behavior, Core Web Vitals, and analytics privacy.

For ShopVerse checkout, preserve safe idempotency-key behavior, saved cart state,
clear inventory/payment outcomes, and user-safe messages. Do not expose internal
service, broker, database, token, or stack information.

Return issues ranked by user impact and confidence. Every issue needs evidence,
affected users, reproduction, smallest recommended change, and a behavioral,
accessibility, visual, or performance acceptance check.

If implementation is authorized, change only approved issues, use existing
components and Angular conventions, then run focused tests, build, quick E2E,
accessibility, and relevant visual/Lighthouse checks. Inspect screenshots rather
than updating baselines automatically.
```

## Evidence Matrix

Capture desktop and mobile evidence for initial, loading, validation failure,
submitting, recoverable failure, and success states. Add keyboard and screen-reader
observations for every interactive transition.
