# MovieVerse UI implementation

## Visual direction

The UI now uses a cinematic dark theme, restrained red accent, consistent surfaces and borders, responsive poster cards, accessible labels, and reduced-motion support. Existing Angular routes, page methods, Firebase services, and Capacitor camera integration were preserved.

## Ionic elements used by page

| Page | Ionic elements | Custom UI / CSS |
|---|---|---|
| App shell | `ion-app`, `ion-router-outlet` | Global design tokens and dark palette in `src/global.scss` and `src/theme/variables.scss` |
| Discover / Home | `ion-header`, `ion-toolbar`, `ion-title`, `ion-buttons`, `ion-button`, `ion-icon`, `ion-searchbar`, `ion-content` | Hero backdrop, featured title, responsive CSS Grid poster gallery, favorite overlay button, hover details |
| Sign in | `ion-header`, `ion-toolbar`, `ion-title`, `ion-content`, `ion-card`, `ion-card-header`, `ion-card-title`, `ion-card-content`, `ion-list`, `ion-item`, `ion-input`, `ion-input-password-toggle`, `ion-button`, `ion-text` | Centered glass-like auth panel, branded icon block, responsive form spacing |
| Create account | `ion-header`, `ion-toolbar`, `ion-buttons`, `ion-button`, `ion-icon`, `ion-title`, `ion-content`, `ion-card`, `ion-card-header`, `ion-card-content`, `ion-avatar`, `ion-list`, `ion-item`, `ion-input`, `ion-input-password-toggle`, `ion-text` | Responsive registration panel, profile-photo preview and camera action |
| Favorites / Watchlist | `ion-header`, `ion-toolbar`, `ion-buttons`, `ion-button`, `ion-icon`, `ion-title`, `ion-content`, `ion-list`, `ion-item`, `ion-thumbnail`, `ion-label` | Compact poster rows, bordered list cards, empty-state presentation |
| Film details | `ion-header`, `ion-toolbar`, `ion-buttons`, `ion-button`, `ion-icon`, `ion-title`, `ion-content`, `ion-badge`, `ion-card`, `ion-card-header`, `ion-card-title`, `ion-card-content` | Cinematic backdrop, gradient fade, responsive metadata and synopsis layout |
| Movie matching | `ion-header`, `ion-toolbar`, `ion-buttons`, `ion-button`, `ion-icon`, `ion-title`, `ion-content`, `ion-spinner`, `ion-card`, `ion-card-header`, `ion-card-title`, `ion-card-subtitle`, `ion-card-content`, `ion-avatar`, `ion-badge` | Match cards and horizontally scrollable shared-movie posters |
| Profile | `ion-header`, `ion-toolbar`, `ion-buttons`, `ion-button`, `ion-icon`, `ion-title`, `ion-content`, `ion-avatar`, `ion-card`, `ion-card-content`, `ion-list`, `ion-item`, `ion-label`, `ion-badge` | Centered profile header, account detail rows and responsive action button |
| Admin dashboard | `ion-header`, `ion-toolbar`, `ion-buttons`, `ion-button`, `ion-icon`, `ion-title`, `ion-content`, `ion-segment`, `ion-segment-button`, `ion-label`, `ion-list`, `ion-item`, `ion-avatar`, `ion-badge`, `ion-input`, `ion-textarea` | User-management rows and custom movie-entry panel |

## Responsive behavior

- Mobile: 2–3 poster columns depending on viewport width, compact navigation controls, stacked hero content, and touch-sized actions.
- Tablet: 4 poster columns.
- Desktop: 6 poster columns with larger cinematic hero and hover states.
- Reduced-motion preferences disable most animation and transition effects.

## Build validation

The source files were updated, but a production build could not be verified in this environment because the dependency installation did not complete and the Angular CLI executable was unavailable. Run `npm ci` and then `npm run build` locally before merging.


## Authentication and movie-loading fixes (2026-10-20)

- Sign-in now uses a disabled submit button and an inline spinner instead of a separate Ionic loading overlay. The loading state is reset in `finally`, including navigation and error paths.
- Firebase user-profile reads are bounded to 8 seconds so the authentication guard cannot wait forever on a stalled profile request.
- TMDB popular/search/detail HTTP requests have a 10-second timeout. The popular catalogue retains a small offline fallback catalogue.
- Firebase admin-movie reads are bounded to 3.5 seconds and fall back to locally cached movies.
- Home-page skeletons now always resolve to results or a visible error/empty state with a retry button. Search input is debounced and stale requests cannot overwrite newer results.
- Registration uses the same design language and exposes a bounded, visible submit state.
- iOS camera/photo-library usage descriptions were added to `ios/App/App/Info.plist`.

## Build and virtual-device smoke test

Run these commands from the project root on a machine with network access to npm: 

```bash
npm ci
npm run build
npx cap sync android
```

For Android Studio, run `npx cap open android`, start an Android Virtual Device, then press **Run**. For iOS, use a macOS machine with Xcode installed, run `npx cap sync ios`, then `npx cap open ios` and run an iPhone Simulator target. iOS Simulator builds cannot be executed on Linux.

Smoke-test both platforms: (1) launch while online; (2) sign in with a valid Firebase account; (3) verify navigation reaches Home and the submit spinner stops; (4) verify movie cards load, or a retryable error appears within a bounded time; (5) search for a movie and clear the search; (6) try invalid credentials and verify the error appears without a stuck overlay; (7) open Register and test keyboard layout; (8) test camera/photo selection on a simulator/device that supports it. Android emulators and iOS simulators must have internet access for Firebase and TMDB.

**Verification status:** source changes and platform configuration were inspected, but a production build could not be run in this environment because `npm ci` could not download packages from the npm registry (`EAI_AGAIN`). The iOS simulator also requires macOS/Xcode. Complete the build and emulator smoke test above before treating native-device compatibility as verified.


## Source cleanup pass (2026-10-20)

- Favorites now use Firebase as the source of truth while online; local storage is an offline cache rather than a second database that can resurrect stale records. Failed writes restore the previous UI state and surface errors.
- Custom movie CRUD validates required fields and avoids replacing an existing custom movie when IDs collide.
- Movie detail lookups query a single custom record, matching retries use a dedicated loader, and the Home search timer is cleaned up when its page is destroyed.
- See `CODE-REVIEW.md` for remaining security notes and the required local build/test commands.
