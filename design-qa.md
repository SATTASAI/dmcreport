# Design QA — Review Desk

final result: passed

## Evidence and state

- Source visual truth: `docs/design-reference.png` — the third displayed generated image selected by the user, 1487 × 1058 pixels.
- Implementation: `docs/implementation-desktop.png` — browser-rendered local application with synthetic records, 1425 × 1013 screenshot pixels; explicit CSS viewport 1440 × 1024, DPR approximately 1. Browser capture excludes scrollbar area.
- Comparison: `docs/design-comparison.png` — source and implementation normalized to 1440 × 1024 beside each other in one 2880 × 1054 image. The source aspect ratio is effectively the desktop target ratio; no device framing was added.
- State: incoming request selected, status pending, first two documents verified, last document awaiting verification, note empty. Both source and implementation show this state in the full-view comparison. Request IDs/counts and secondary rows are synthetic and differ intentionally.
- Mobile evidence: `docs/implementation-mobile.png`, CSS viewport 390 × 844. No horizontal overflow (document width 375 pixels with vertical scrollbar). Mobile uses one pane and bottom navigation; detail-to-list navigation was exercised.

## Comparison history

1. Initial browser capture showed the same three-column composition, but additional production metadata and upload/verification controls pushed the action footer to y=1158, below the 1024px viewport. Classified P2 (primary actions outside the first screen). Fixed by moving student code/year/term into a compact metadata line, reducing section/row gaps and making the action footer sticky. Retained all required production controls.
2. Post-fix capture `implementation-desktop.png` was compared with the reference in `design-comparison.png`. Document checklist, note field, and primary footer are visible together; major column proportions, alignment, surface hierarchy, indigo actions, and selected inbox treatment match the selected direction. No actionable P0/P1/P2 findings remain.

## Required fidelity surfaces

- Fonts/typography: self-hosted Sarabun 400/500/600/700, readable Thai body text, strong student and page titles, restrained muted metadata. Small helper text is intentionally subordinate. Exact mock letterforms are not available as font metadata; Sarabun is the selected close match.
- Spacing/layout rhythm: approximately 204px dark navigation, 408px inbox, flexible detail surface, simple separators. Measured desktop footer overflow was corrected. Mobile hides the inactive pane and exposes a back control. Bottom navigation stays available.
- Colors/tokens: charcoal sidebar, white main surface, #344bc1 primary, pale indigo selection, amber awaiting-review and mint verified statuses. Text labels supplement every status color.
- Image quality/assets: the selected direction has no raster photographs or illustrations. Book/document/navigation marks use the Phosphor icon library, without hand-drawn SVG or placeholder art. Thai font files are served locally.
- Copy/content: fully Thai, genuine student-transfer labels, Buddhist-year display and Gregorian date transport, chronological dates anchored to 2 November 2026. Production additions include registration, file replacement, verification, request cancellation/rejection, history, and account navigation, required to make the requested workflow operable.

## Interaction checks

Browser exercised against a local SQLite fixture and isolated fake storage (no production student data):

- Account gate and authorized staff screen.
- Create incoming request through the form; new record appears in the inbox and detail view.
- Save note; persisted success and event history visible.
- Verify final document; approval becomes enabled only when 3/3 verified.
- Open confirmation and approve synthetic request; status changes and editing is locked.
- Mobile list/detail navigation, responsive layout and horizontal-overflow check.
- Search, request type/status filters and reports use the real API implementation; aggregate and filter correctness covered by backend tests.
- Browser console inspected during final verification; no application errors remain. Earlier hot-reload/retry messages from local development are not production failures.

Backend suite: 317 tests passed, including registration idempotency/duplicates, permissions, stale versions, concurrent notes, file replacement resetting verification, required reasons, approval guards and full Worker overview integration. Frontend build and four hosting package tests passed.

## Limits / follow-up polish

- Production school sign-in and Google Drive upload were not exercised with a real school account. Live page/API availability and deployment are checked separately; no synthetic records are written to production.
- P3: source mock uses slightly larger secondary text and fewer controls. The implemented density accommodates the requested production workflow while preserving its hierarchy.
- Registration approvals update the request ledger/dashboard totals; the existing grades system retains ownership of enrollment/roster changes.

## Checklist

- [x] Resolve selected visual and compare paired captures.
- [x] Correct desktop footer overflow; verify revised capture.
- [x] Verify mobile layout and primary workflow with isolated data.
- [x] Build and run existing/new relevant automated checks.
- [x] Keep production account/storage verification limits explicit.
