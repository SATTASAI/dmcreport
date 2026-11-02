# Prototype Instructions

## Registry requirements

- Keep student information inside a same-origin iframe and read basic student fields from the shared school database through the transfer module's permission checks.
- Clicking a student name starts transfer registration with fresh basic roster data prefilled. Validate iframe message origin/source; let staff choose transfer details and explicitly save.
- Do not show an account menu in this app. Only superadmins configure individual access grants; all other accounts need a grant.
- Import transfer requests from XLSX, CSV, or JSON with preview, server validation, explicit confirmation, duplicate detection and atomic persistence. Importing must not change the central student roster.

Run the local server yourself and open the preview in the browser available to this environment. Do not give the user server-start instructions when you can run it.

Before making substantial visual changes, use the Product Design plugin's `get-context` skill when the visual source is unclear or no longer matches the current goal. When the user gives durable prototype-specific design feedback, preferences, or decisions, record them in `AGENTS.md`.

When implementing from a selected generated mock, treat that image as the source of truth for layout, component anatomy, density, spacing, color, typography, visible content, and hierarchy.

Build app UI in `src/`. Keep `.openai/hosting.json`, `worker/index.js`, `scripts/prepare-sites-build.mjs`, and `tests/sites-worker.test.mjs` intact so the same local prototype can be handed to Sites. Before a Sites handoff, run `npm run build` and `npm run test:sites`; the build must leave `dist/client/index.html`, `dist/server/index.js`, and `dist/.openai/hosting.json`.
