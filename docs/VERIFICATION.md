# Verification

I verified the application locally on **4 November 2026**, using synthetic data only. The checks below record what I ran and observed; the overall time I spent on the assignment is stated in the README.

## Environment

- macOS; Python 3.13.6; Node.js 20.20.2.
- Django 5.2.19, Django REST Framework 3.16.1, SQLite.
- React 19.3.1, Material UI 7.3.11, TypeScript 5.9.3, Vite 7.3.7.
- Headed Chromium through Playwright. Final flow repeated against the production frontend build, with the local Django API.

## Automated checks

| Check | Result |
| --- | --- |
| Django API tests | 12 passed |
| Django system check | No issues |
| Migration consistency | No missing migrations |
| Ruff lint and format | Passed; 17 Python files formatted |
| ESLint | Passed |
| TypeScript | Passed |
| Prettier | Passed |
| Vite production build | Passed |
| npm runtime dependency audit | Zero reported vulnerabilities at verification time |
| Premium UI static audit | Zero findings; report in `premium-audit.json` |
| DESIGN.md lint | Zero errors or warnings |

The API tests exercise department routing, transactional assignment/resolution, required inputs, cross-department assignment denial, role restrictions, hidden-ticket access denial, pagination/search/filter/sort, duplicate-transition conflicts, client resolution before assignment, comments after resolution, custom-issue fallback, invalid identities, and repeatable seed data.

## Browser checks

- Created an AC issue as the client, confirmed automatic routing and two initial activity entries, assigned Prakash through the department manager, posted an update as Prakash, and resolved with a required comment. The final ticket had five activity entries. The manager never received a resolve action, and resolved tickets had no further transition action.
- Rejected blank issue, technician, comment, and resolution inputs. Checked inline errors and focus. The manager's technician selector excluded other departments.
- Checked All, Actions, and Comments activity views, including the resolution comment. Verified the client's resolved listing and return-navigation query state.
- Checked server pagination, search, status filtering, older/newer sorting, clearing filters, no matching results, and the empty technician account.
- Simulated an API 503 for the list: the error state displayed and retry recovered. Simulated a failed comment: the text remained available and a subsequent retry succeeded. These deliberately failed requests account for expected network errors in the browser console.
- Checked mobile creation, keyboard autocomplete selection, and Escape dismissal. Checked layouts at 1440, 390, and 320 pixels wide with no horizontal document overflow. Verified that the mobile select popup matched its trigger width.
- Held a list response to verify the loading state, then released it and confirmed the requested page rendered. Also exercised the listing with reduced-motion preference enabled.
- Ran axe-core 4.14 WCAG A/AA checks on the ticket listing, create dialog, and mobile resolved detail: **zero violations on those inspected states**.

Screenshots in [screenshots/](screenshots/) include the desktop and mobile listing, creation, assignment, resolution, empty state, no-results state, and API-error state. Full-page detail screenshots can show the sticky composer at its viewport position; it remains usable while scrolling.

## Limits

This was a local Chromium verification, not a Safari/Firefox, screen-reader, load, or deployment test. The axe results are not a complete accessibility certification. Browser checks were performed interactively through Playwright; the repository's repeatable automated suite is the Django API suite. The demo selector is not authentication. Long activity histories are not paginated and general create/comment requests lack durable idempotency keys, as described in the README.

The submission archive excludes installed dependencies, virtual environments, local databases, browser-session artifacts, and build output. Running migrations and `seed_demo` recreates the sample database. No email was sent and no service was published.

## Subsequent UI polish verification

The final pass retains MUI and the bundled Manrope/DM Sans pair, introduces a navy navigation rail, raises secondary text to 12–13px, increases ticket headings to 18px, and uses rem-based text sizes. Ownership and next state appear near the detail heading. Success messages now appear at the top, away from comment controls.

Verified in Chromium after the changes:

- Create draft survives close/reopen and role switches; another client's form stays empty. Known issue names with surrounding spaces preview the same department used by submission. Successful creation clears the draft.
- A comment draft survives returning to the list and reopening the ticket. Posting clears it. Drafts stay only in React memory; a reload clears them.
- Full create, manager assignment, technician comment, and resolution flow passed again.
- Detail layouts at 320, 390, 768, and 1440px had no horizontal overflow. The mobile success notification did not intersect the comment composer.
- Axe WCAG A/AA checks on the final create dialog and mobile resolved detail returned zero violations.
- ESLint, Prettier, TypeScript/production build, all 12 backend tests, DESIGN.md lint, and strict premium audit passed. The Impeccable static detector returned no findings.

The initial 40-second walkthrough was superseded by the guided recording described below. The screenshots demonstrate the implemented UI; neither screenshots nor recording replace the automated tests.

## Recording audit and revision

The original clip was too fast for a first-time reviewer: role switches had no explanation, text appeared instantly, saved results had little reading time, and the final history was not held long enough.

The replacement follows one meeting-room issue through the same live API-backed flow. It includes an opening explanation, search, required-field validation, issue presets, automatic routing, manager assignment, technician comments, resolution, and the client's saved history. Fifteen short captions identify the actor and outcome. Text entry and pauses are paced for reading; captions occupy a separate band below the app. The recording is silent, with no synthetic narration or music.

Research used [Loom's product-demo guidance](https://www.atlassian.com/software/loom/resources/guides/use-cases/product-demo) for a focused use case and problem-to-outcome sequence, and [Loom's recording tips](https://support.atlassian.com/loom/docs/recording-tips-for-a-great-video/) for preparation and understandable pacing.

A visual review sampled every caption section and checked the beginning, role handoffs, validation, saved comments, resolution, and ending. It caught the sticky composer covering part of the resolution history; the final capture scrolls that content into view. Browser automation was used for capture, with FFmpeg and Pillow for export/caption composition. These are recording tools, not new application dependencies.

The final export is **1 minute 40 seconds**, 1440 × 1096, H.264, with burned-in captions and a separate VTT file. Caption synchronization was checked against the captured actions, all 15 sections were visually sampled, and FFmpeg decoded the complete export without errors. A final API read confirmed that the recorded ticket, `TKT-1050`, is resolved and retains all five events: creation, automatic routing, assignment, comment, and resolution. Application source was unchanged during this recording revision; the earlier application checks were not rerun.
