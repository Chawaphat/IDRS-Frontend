# E2E tests — Feature 4 & 5 (STC-22 – STC-28)

Playwright end-to-end tests that execute the System Test Cases for Feature 4
(Image Management) and Feature 5 (AI Detection) against the real Vite build
in Chromium.

| Spec | System Test Case | Cases |
|------|------------------|-------|
| `stc-22-upload-image.spec.ts` | STC-22 Upload Image | 8 |
| `stc-23-view-image-gallery.spec.ts` | STC-23 View Image Gallery | 8 |
| `stc-24-delete-image.spec.ts` | STC-24 Delete Image | 5 |
| `stc-25-view-patient-images.spec.ts` | STC-25 View Patient's Images | 7 |
| `stc-26-standalone-ai-detection.spec.ts` | STC-26 Run Standalone AI Detection | 9 |
| `stc-27-run-ai-detection.spec.ts` | STC-27 Run AI Detection on Panoramic X-ray | 5 (STC-27-TC-06 retired — see below) |
| `stc-28-view-ai-detection-results.spec.ts` | STC-28 View AI Detection Results | 7 |

**49 tests total, all passing.**

Source of truth: `IDRS/wiki/synthesis/idrs-stc-f4-image-management.md`,
`idrs-stc-f5-ai-detection.md`. Results recorded in
`IDRS/wiki/synthesis/idrs-test-record-f4-f5.md`.

**STC-27-TC-06** ("Detection rejected for a non-panoramic image") was retired
— no UI control exists to reach it (the Detect button only renders on the
panoramic tile; the AI Suggestion panel has no detect action without a
panoramic X-ray). The rejection itself stays covered at the unit level
(`UTC-42-TC-03`).

## Running

```bash
npm run test:e2e            # headless, all specs
npm run test:e2e -- stc-22  # one spec
npm run test:e2e:ui         # Playwright UI mode
npm run test:e2e:report     # open the last HTML report
```

`playwright.config.ts` starts `vite dev` on port 5173 automatically
(`reuseExistingServer` locally). First run only:

```bash
npx playwright install chromium
```

**If tests fail intermittently (especially STC-26's file-upload cases) with
timeouts rather than assertion errors:** every worker shares the *same* one
`vite dev` instance, so Playwright's CPU-count-based default worker count
(often 8+) can overwhelm it under real load — `playwright.config.ts` already
caps this at 2 workers locally, but if you override it with `--workers=N`,
keep N low (1–2) rather than the default.

## How it works — no backend, no Supabase

Everything over the network is stubbed at the browser layer, so the suite is
fully self-contained:

- **`support/auth.ts`** seeds a valid-looking Supabase session into
  `localStorage` before the app boots, so `authStore.initialize()` treats the
  tester as a logged-in dentist with no network round-trip. The storage key is
  derived from `VITE_SUPABASE_URL` in `.env` (read in Node, never logged).
- **`support/mockBackend.ts`** is an in-memory stand-in for the IDRS API and
  Supabase Storage, wired in with `page.route`. State is mutable, so an
  upload/delete done through the UI shows up on the next fetch — just like the
  real backend. Flip `mock.fail.*` to exercise the STC error paths
  (`storageUpload`, `storageRemove`, `imageCreate`, `imageDelete`,
  `imagesGet`, `aiDetect`, `standaloneDetect`). `nextStandaloneResult` /
  `nextAnalysisData` let a test control exactly what the *next* AI detection
  call returns, for STC-26/27's "the result actually changes" assertions.
- **`support/fixtures.ts`** exposes the `mock` and `app` fixtures; `app` has
  navigation helpers that read like the STC Test Scripts:
  `openChartImageGallery()`, `openPatientProfile()`, `openAIAnalysisPage()`,
  `openDentalStatus()`, `selectTooth(fdi)` (clicks a tooth tile on the
  odontogram chart via its `[data-tooth]` attribute — opens the wizard +
  AI Suggestion panel for that tooth).
- **`support/files.ts`** builds the Required Test Data payloads for both
  features (valid JPG, `report.pdf`, oversized files, `notes.txt`, oversized
  panoramic X-rays).

STC-28-TC-04 ("crop generation fails") forces a real failure via
`page.addInitScript` overriding `HTMLCanvasElement.prototype.toDataURL` to
throw — scoped to `toDataURL` rather than `getContext` so it doesn't also
break the Lottie loading animation (which keeps a canvas alive via
`getContext` every frame).

Because the real values in `.env` are only used to compute the auth storage key
and are never contacted, no secrets leave the machine.
