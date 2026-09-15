# Dragon Mind - Android App Build

This is a complete Capacitor-wrapped Android project for Dragon Mind. Everything
that could be prepared without the Android SDK has already been done:

- Capacitor initialized and configured (`capacitor.config.ts`)
- Native Android project scaffolded (`android/`)
- The live web app copied in (`www/`), pointed at the production API:
  `https://dragonmind.domeqserver001.space/api`
- App name set to "Dragon Mind", package id `space.domeqserver001.dragonmind`
- Real brand app icon generated (adaptive icon: blue `#0766AD` background +
  white dragon mark foreground) at every required density
- Branded splash screen generated at every density/orientation
- Theme colors set (`colorPrimary` #0766AD, `colorPrimaryDark` #043E6C,
  `colorAccent` #DA5C53)
- `INTERNET` permission already present in the manifest

**What's left is purely the native build step, which needs a real Android SDK**
**- that's the part this environment couldn't do.**

## Prompt for Claude Code

Paste this whole section as your first message to Claude Code once you've
opened this folder:

> This is a Capacitor Android project for an app called Dragon Mind. Please:
> 1. Run `npm install` in the project root to restore node_modules.
> 2. Run `npx cap sync android` to make sure the native project is in sync.
> 3. Check whether Android Studio / the Android SDK is installed on this
>    machine. If not, tell me and stop - I'll install it first.
> 4. If the SDK is present, build a debug APK by running
>    `cd android && ./gradlew assembleDebug` (Windows: `gradlew.bat assembleDebug`).
> 5. Confirm the resulting APK's exact path
>    (`android/app/build/outputs/apk/debug/app-debug.apk`) and its file size,
>    so I know it built successfully.
> 6. If the build fails, show me the actual Gradle error output rather than
>    summarizing it, so we can fix it precisely.

## Prerequisites (if not already installed)

- **Android Studio** (free): https://developer.android.com/studio - installing
  it also installs the Android SDK, which is the actual thing the build needs.
  First launch will prompt to install SDK components - let it.
- **JDK 17** - Android Studio bundles its own, so this is usually already
  handled; only an issue if building purely from a terminal without ever
  having opened Android Studio once.

## Manual build (if not using Claude Code)

```bash
npm install
npx cap sync android
cd android
./gradlew assembleDebug        # macOS/Linux
gradlew.bat assembleDebug      # Windows
```

The finished file appears at:
```
android/app/build/outputs/apk/debug/app-debug.apk
```

That APK can be copied straight to an Android phone and installed (the phone
will need "Install unknown apps" allowed for whatever app you send it through -
email, USB transfer, a cloud drive link, etc.). This is a **debug** build,
which is fine for personal/internal use - it's signed with a default debug
key, not something you'd submit to the Play Store as-is.

## If you later want a release build (smaller, optimized, signable for the
## Play Store)

```bash
cd android
./gradlew assembleRelease
```

This produces an unsigned release APK. Publishing to the Play Store (or
distributing a properly signed release build) requires generating a signing
key and configuring it in `android/app/build.gradle` - a separate step with
real consequences (losing the signing key later means you can never update
that same app listing again), so don't do this casually. Ask if you want to
go this route and I'll walk through it properly.

## Opening in Android Studio instead of the command line

Just open the `android/` folder directly in Android Studio as a project. It
will sync automatically, and you can build via
**Build → Build Bundle(s) / APK(s) → Build APK(s)**. This is the more
foolproof route since Android Studio handles missing SDK components
automatically rather than failing with a terse Gradle error.

## Testing before installing on a real phone

Android Studio's built-in emulator (Device Manager → create a virtual device)
can run the APK without needing a physical Android phone at all - useful for
a first check.

## If the domain/API URL ever changes

Edit the one line in `www/js/api.js`:
```js
const API_BASE = 'https://dragonmind.domeqserver001.space/api';
```
then re-run `npx cap sync android` and rebuild.

## If you update the Dragon Mind web app later

This mobile app is a snapshot of `frontend/` at the time it was built - it
does **not** automatically stay in sync with future web changes. To update it:
1. Copy the latest `css/`, `js/`, `assets/`, and `index.html` from the main
   `dragon-mind/frontend/` project into this project's `www/` folder
   (overwrite what's there).
2. Re-apply the one-line `API_BASE` change in `www/js/api.js` if you copied
   over the relative-path version by mistake.
3. Run `npx cap sync android` and rebuild.
