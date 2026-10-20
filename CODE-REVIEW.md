# Code review and cleanup notes

## Cleanups applied

- Kept Firebase initialization in one injectable `FirebaseService` and made the shared dependencies readonly.
- Added `guestGuard`, `authGuard`, and `adminGuard` so route access follows the current Firebase profile and role. Public registration always assigns the `user` role.
- Moved privileged user creation, profile changes, and enable/disable operations to Firebase Callable Cloud Functions using the Admin SDK. The functions verify the caller's active administrator profile, validate input, and roll back Authentication changes when the matching database update fails.
- Separated administrator-managed movie CRUD into `AdminMovieService` and the Realtime Database `adminMovies` path. TMDB records remain read-only; admin create/update/delete operations never call TMDB write endpoints.
- Made custom movie detail retrieval read one Firebase record instead of loading the entire custom catalogue. Added title/rating validation and protection against overwriting an existing custom movie ID.
- Simplified favorites synchronization: Firebase is authoritative when reachable, local storage is only an offline cache, and failed writes roll back the optimistic UI update instead of being silently reported as successful. Reads/writes have bounded waits.
- Debounced movie search and protected results from stale requests. The search timer is now cleared when the Home page is destroyed.
- Refactored movie matching retry into a dedicated loader instead of re-calling the Angular lifecycle method.
- Added automatic cleanup for the root router event subscription and made admin service methods easier to read.
- Bounded TMDB requests and custom-catalogue fallback reads to reduce indefinite loading states.

## Important security notes

- Realtime Database rules are path-specific. Deploy and test `database.rules.json` in the Firebase Emulator before production. Rules are not a substitute for testing the full read/write paths.
- Ensure at least one trusted administrator profile already exists at `users/{uid}` with `role: "admin"` and `active: true`. Never grant admin through public registration.
- The Firebase web configuration is expected to be present in a client app, but the TMDB API key is bundled into the frontend too. For stronger protection, proxy TMDB requests through a backend/Cloud Function and apply rate limits; do not treat Angular environment files as secret storage.
- The admin functions use Firebase's default Functions region. If deploying to another region, configure the same region in both the Functions deployment and the client `getFunctions` call.

## Validation status

The source was inspected and edited, but a production build and automated tests could not be completed in this environment because the installed `node_modules` tree is incomplete (Angular CLI and package contents are missing). Do not treat the changes as build-verified yet.

From the project root, run:

```bash
npm ci
npm run build
npm test -- --watch=false
npm run lint
```

For Cloud Functions:

```bash
cd functions
npm install
npm run build
```

Then test the app with the Firebase Emulator Suite before deploying rules/functions. Verify login/logout and direct URL navigation, favorites on multiple pages, search typing/clearing, matching with zero/one/many favorites, custom movie CRUD, and admin user enable/disable. Finally run `npx cap sync android` and test an Android emulator; test iOS using macOS/Xcode.
