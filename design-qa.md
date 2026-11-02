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
2. Post-fix capture `implementation-desktop.png` was compared with the reference in `design-comparison.png`. Document checklist, note field, and primary footer are visible together; major column proportions, alignment, surface hierarchy, indigo actions, and selected inbox treatment match the selected direction. Desktop comparison has no remaining actionable P0/P1/P2 findings.

3. A subsequent mobile screenshot exposed the sticky action footer beneath the fixed 62px bottom navigation (P2). Set the mobile footer bottom offset to 62px, then re-captured and checked the primary action bounds against the navigation. The revised evidence is in `docs/implementation-mobile.png`. No actionable P0/P1/P2 findings remain.

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

- The deployed page was opened with the existing school session: the authorized account gate, live empty transfer list and real dashboard summary all loaded successfully. Google Drive uploads and approval of real student records were not exercised; no synthetic records were written to production.
- P3: source mock uses slightly larger secondary text and fewer controls. The implemented density accommodates the requested production workflow while preserving its hierarchy.
- Registration approvals update the request ledger/dashboard totals; the existing grades system retains ownership of enrollment/roster changes.

## Checklist

- [x] Resolve selected visual and compare paired captures.
- [x] Correct desktop footer overflow; verify revised capture.
- [x] Verify mobile layout and primary workflow with isolated data.
- [x] Build and run existing/new relevant automated checks.
- [x] Keep production account/storage verification limits explicit.


## Requested extension: iframe, individual access, imports

Scope: preserve Review Desk and change the requested navigation. Source: user's sidebar screenshot (216 × 916). Its upper navigation crop was compared beside the browser-rendered updated sidebar in `work/sidebar-update-comparison.png` in the task workspace. The supplied profile name is excluded from public repo evidence. Expected changes: remove account, add import and admin-only access settings, and change students to an internal button. Typography, dark surface, icons, spacing and selected treatment remain consistent; no actionable P0/P1/P2 visual drift.

Synthetic browser evidence: `docs/students-iframe.png`, `docs/import-preview.png`, `docs/access-settings.png`, `docs/import-mobile.png`. Actual iframe loaded a shared-roster test record with no nested outer navigation. Granted and revoked a synthetic teacher from the admin screen. Uploaded a real XLSX fixture, verified preview code 00025/date, then confirmed successful import to the isolated database. CSV/JSON parsing and malformed files are covered by frontend tests.

Mobile: 390 × 844, all five admin menu items fit, scrollWidth 390, readable import screen. Console: no application errors. Required fidelity surfaces checked: existing Sarabun typography, sidebar spacing, charcoal/indigo tokens, Phosphor assets, and Thai labels. New pages follow the established product surface and deliberately add only the requested functions.

Permissions tests cover denied default accounts, admin-only grants, revocation across detail/documents/students, private-field exclusion and Worker dispatch. Import tests cover preview without added records, duplicates, idempotency, 200 rows with bounded binds/statements and rollback on a conflict during confirmation. No real teacher grants or production test imports are performed.


## Student-name registration shortcut

Scoped change: keep the student iframe/table and existing registration modal. Student names now use text buttons with the existing indigo token and focus affordance. The modal prefills fresh roster code/name/grade and retains the existing form layout; read-only identity fields use a subtle tint. No new visual system or extra screen.

Browser evidence: `docs/register-from-student.png`, synthetic roster. Clicked the name inside the actual iframe; the parent dialog opened with code 1001, exact roster name, and custom grade ม.1 selected. Outgoing was the initial type for the enrolled student. Entered destination/reason and saved to the isolated database, then verified navigation to the created outgoing request. Primary interactions and console checked. Existing desktop/mobile shell retained. No actionable P0/P1/P2 visual findings.

The selected-student endpoint is tested for permission enforcement, missing students and basic-field-only responses. No real student transfer is submitted during verification.


## Student cards refinement

User explicitly requested replacing underlined student-name links with whole clickable cards. The student directory now uses a responsive card grid; existing sidebar, search, status filter, iframe, access checks, pagination and registration flow are retained. Evidence: docs/student-cards-desktop.png and docs/student-cards-mobile.png, using six fictional roster records. Card anatomy: Phosphor student icon, muted school code, dark un-underlined name, grade/room and status, restrained indigo action and arrow. White surface, subtle border, 14px radius, hover/focus states and reduced-motion support follow the existing tokens.

Browser verification: clicking the card body and pressing Enter both open the parent registration dialog with the correct student's prefilled fields. Name computed textDecorationLine is none. Desktop iframe client/scroll width both 1164px; responsive grid fits four columns. Initial mobile verification exposed overflow from the existing global body min-width inside the narrow iframe (P2). Fixed by applying an embed-specific body class with min-width:0. Post-fix mobile iframe clientWidth=scrollWidth=347px, one column; revised mobile evidence saved. No application console errors; no actionable P0/P1/P2 findings remain. No production transfer requests are created during this visual refinement.
