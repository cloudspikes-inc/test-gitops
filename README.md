# Notes — Apple-style CRUD Mobile App

A small cross-platform mobile app inspired by Apple ecosystem UI/UX (iOS Notes / Reminders aesthetic), built with React Native. It supports full CRUD on notes with on-device persistence, light/dark mode, search, pin/unpin, and an iOS-styled modal editor.

Targets both **iOS** and **Android** from a single codebase.

## Features

- Apple-style large title, search field, grouped row design and chevrons
- iOS system colors with automatic light/dark mode
- CRUD: Create, Read (list + search), Update (modal editor), Delete (with confirmation)
- Pin / unpin with a "PINNED" section header
- Local persistence via AsyncStorage (your notes survive app restarts)
- Modal editor with Cancel / Save chrome, keyboard avoidance, and a destructive Delete action

## Get the Android build (APK)

Each push to `claude/mobile-app-crud-wfN3t` or `main` runs the **Android APK Build** workflow and publishes a GitHub Release with the APK attached.

- **All releases (download APK here):** https://github.com/cloudspikes-inc/test-gitops/releases
- **Latest release:** https://github.com/cloudspikes-inc/test-gitops/releases/latest
- **Per-build artifacts:** https://github.com/cloudspikes-inc/test-gitops/actions/workflows/android-build.yml

Install on Android:
1. Open the latest release link above on your phone.
2. Download the `Notes-<sha>.apk` asset.
3. Enable "Install unknown apps" for your browser/file manager when prompted.
4. Tap the APK to install. Launch "Notes".

> The APK is signed with the standard Android debug keystore, which is fine for sideload testing. For Play Store distribution you would generate a proper release keystore and configure `gradle.properties` accordingly.

## iOS

The source builds for iOS as well, but a distributable IPA requires an Apple Developer Program membership and signing certificates that cannot be provisioned in CI. To run iOS:

```sh
git clone https://github.com/cloudspikes-inc/test-gitops.git
cd test-gitops
npm install --legacy-peer-deps
cd ios && pod install && cd ..
npx react-native run-ios
```

Or open `ios/AppleStyleCRUD.xcworkspace` in Xcode and run on a simulator/device.

## Running locally (Android)

Prereqs: Node 20+, JDK 17, Android SDK with an emulator or a connected device.

```sh
npm install --legacy-peer-deps
npx react-native run-android
```

## Project layout

- `App.tsx` — single-file app (UI + state + persistence)
- `android/` — native Android project
- `ios/` — native iOS project
- `.github/workflows/android-build.yml` — APK build & release pipeline

## License

MIT — see `LICENSE`.
