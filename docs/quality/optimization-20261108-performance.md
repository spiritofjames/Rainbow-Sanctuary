# Performance and interaction review — 8 November 2026

Scope: the existing approved public design, native homepage interactions, and static media delivery. No provider settings, customer data, media replacement, dependency installation, or deployment was performed by this worker.

## Baseline

- Examined all 77 root `.dc.html` files: 121 image elements, of which 120 have intrinsic width and height. The remaining element is the initially empty retreat lightbox image (`data-gallery-image`), not a missing dimension on a rendered inline photograph.
- The identity homepage already uses a responsive, high-priority WebP hero with a matching preload, lazy-loaded below-fold images, intrinsic dimensions, and a 720/1440px responsive gallery.
- The homepage does not require a framework runtime, external font stylesheet, video, or iframe. Its first-party interaction script was 4,705 bytes before this change; the 6,000-byte regression budget remains enforced.
- Approved hero line breaks, desktop and mobile size clamps, header padding, two header actions, native disclosures, contrast, reduced-motion handling, and gallery image order were retained.

## Fixed

### Gallery final-slide counter and controls

When the rail displays more than one image at a time, several final slide offsets can clamp to the same maximum scroll position. The previous nearest-position calculation selected the first tie, potentially leaving the counter at 15/16 with Next still enabled even at the end. The end position now explicitly selects the final image and disables Next semantically. Previous/arrow navigation skips duplicate snap positions so the rail cannot become stuck at that tied endpoint.

### Avoid repeated gallery geometry reads

Snap positions and maximum scroll distance are measured at initialization, resize, and page restoration. Navigation and settled-scroll updates reuse those positions. For the 16-image rail, an active-slide calculation formerly performed 128 slide-offset/scroll-extent property reads; it now performs zero of those reads and reads current scroll position once. A responsive remeasurement reads 19 geometry properties once. This is a deterministic operation-count improvement, **not** a measured Core Web Vitals or end-user latency improvement.

The script is now 5,472 bytes (767 bytes more than the baseline) and remains under the 6,000-byte regression budget. This modest increase buys the corrected endpoint and geometry caching; it is not a byte-size reduction. Its cache revision is advanced in the homepage source head so deployed visitors receive the changed interaction code.

## Verification

`node --test tests/optimization-performance.test.mjs tests/home-experience.test.mjs tests/performance-budget.test.mjs`

Result: 22 tests passed. New runtime tests cover final-position ties, Home/End keyboard behavior, cached geometry, responsive remeasurement, page restoration, reduced-motion navigation, and modified shortcut preservation. Existing tests protect the approved hero/header design and video/audio loading behavior.

No Lighthouse, CrUX, real-user INP, or production load-test result is claimed here. Root release checks still need the full build, staging browser acceptance, and production verification.

## Browser acceptance recommended

1. At 390px and desktop widths, swipe/scroll to the gallery end: counter reaches 16/16, Next becomes inactive, Previous returns normally.
2. Focus the rail and use Home, End, Left, and Right; verify reduced-motion preference avoids smooth motion.
3. Resize while midway through the gallery and use back/forward navigation; verify the counter and snap position recover.
4. Confirm the floating header, two-line desktop headline, native disclosures, and Programs & Events route remain unchanged.

## Deferred, not hidden

Current static checks do not prove field Core Web Vitals, screen-reader acceptance, or physical-device performance. Further asset recompression or broad CSS pruning should be based on an actual network/rendering trace; the existing responsive media system should not be replaced on speculation.
