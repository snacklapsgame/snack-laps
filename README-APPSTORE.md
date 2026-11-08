# Snack Laps — publish to the iPhone App Store (no Mac needed)

This folder is a **Capacitor iOS app** that wraps the HTML5 game Snack Laps.
You build it in the cloud with **Codemagic**, install it on your iPhone with **TestFlight**, then submit to the App Store.

You do **not** need a Mac. You **do** need a few accounts (Apple, AdMob, Codemagic, and a Git host).

---

## What is already done for you

- Capacitor project with `appId` **`com.snacklaps.game`** (easy to change later) and name **Snack Laps**
- Game copied into `www/` (localStorage keys `nomLoop.*` still work)
- Native plugins: **AdMob**, **Game Center**, **Haptics**
- Portrait lock + safe-area / full-screen friendly layout
- App icon + splash
- `codemagic.yaml` that builds an IPA and can upload to TestFlight
- Real AdMob App ID, banner unit, and rewarded unit are filled in. `USE_TEST_ADS` is `false`, so builds request those units.

Anything that needs *your* account is marked **PLACEHOLDER** in the code and in this guide.

---

## Accounts you still need to create

| # | Account | Cost (typical) | Why |
|---|---------|----------------|-----|
| 1 | [Apple Developer Program](https://developer.apple.com/programs/) | Paid yearly | Required to put any app on an iPhone / App Store |
| 2 | [App Store Connect](https://appstoreconnect.apple.com/) | Included with #1 | Create the app record, Game Center, TestFlight |
| 3 | [Google AdMob](https://admob.google.com/) | Free | Banner + rewarded ads |
| 4 | GitHub (or GitLab / Bitbucket) | Free | Codemagic builds from a git repo |
| 5 | [Codemagic](https://codemagic.io/) | Free tier available | Cloud Mac that builds the iOS app |

Optional later: Apple’s paid devices list is handled by TestFlight — friends install via the TestFlight app.

---

## Step-by-step

### 1) Put this project on GitHub

Codemagic cannot see files only on your PC. Create a **private** GitHub repository and upload / push the contents of `snack-laps-app/` (include `ios/`, `www/`, `codemagic.yaml`; `node_modules` is ignored).

If you change the game later: edit `www/index.html` (or copy from `/workspace/game/index.html` after re-applying the native hooks), run `npm run sync:ios`, commit, push.

### 2) Join the Apple Developer Program

1. Go to https://developer.apple.com/programs/ and enroll with the Apple ID you use on your iPhone.
2. Wait until the membership shows as **Active** (can take up to a couple of days).
3. Note your **Team ID** (developer.apple.com → Membership details).

### 3) Create the app in App Store Connect

1. Open https://appstoreconnect.apple.com/ → **My Apps** → **+** → **New App**.
2. Platforms: **iOS**.
3. Name: **Snack Laps** (must be unique in the store — add a short suffix if taken).
4. Primary language: English (or yours).
5. Bundle ID: register **`com.snacklaps.game`** in [Certificates, Identifiers & Profiles](https://developer.apple.com/account/resources/identifiers/list) if it is not listed, then select it.
6. SKU: anything unique, e.g. `snacklaps001`.
7. After creation, open the app and copy the numeric **Apple ID** (App Information). Paste it into `codemagic.yaml` where you see `APP_STORE_APP_ID: "0000000000"`.

### 4) Create an App Store Connect API key (for Codemagic signing)

1. App Store Connect → **Users and Access** → **Integrations** → **App Store Connect API**.
2. **Generate API Key** with access **Admin** or **App Manager**.
3. Download the `.p8` file **once**. Also note **Issuer ID** and **Key ID**.
4. You will paste these into Codemagic in step 8.

### 5) Set up AdMob (ads)

1. Create an AdMob account → **Apps** → **Add app** → iOS → name Snack Laps → enter bundle id `com.snacklaps.game`.
2. Create ad units:
   - **Banner** (320×50 or Adaptive Banner)
   - **Rewarded**
3. Copy:
   - **App ID** looks like `ca-app-pub-xxxxxxxxxxxxxxxx~yyyyyyyyyy`
   - Banner unit id `ca-app-pub-…/……`
   - Rewarded unit id `ca-app-pub-…/……`

**These IDs are already filled.** Check them digit for digit against AdMob if you ever recreate the app or the units:

| What | Value | Where |
|------|--------|--------|
| AdMob App ID | `ca-app-pub-6414962483147556~2280759881` | `ios/App/App/Info.plist` → `GADApplicationIdentifier`, and `REAL_APP_ID` in `scripts/native-bridge.js` |
| Banner unit | `ca-app-pub-6414962483147556/7715638137` | `REAL_BANNER` in `scripts/native-bridge.js` |
| Rewarded unit | `ca-app-pub-6414962483147556/1372224089` | `REAL_REWARDED` in `scripts/native-bridge.js` |
| (Web-only AdSense, optional) | still a placeholder | `www/index.html` → `AD_CLIENT` / `AD_SLOT`. Browser only; the iPhone app hides this banner |

`USE_TEST_ADS` is `false`. There is no separate debug or TestFlight ad switch, so a TestFlight build uses the real banner and rewarded units above. The iPhone app still waits for Google's consent result before it requests them.

To go back to Google's official demo units (safe for clicking while you develop): set `USE_TEST_ADS` to `true` in `scripts/native-bridge.js`, then run `npm run build:web && npx cap sync ios`. Leave `GADApplicationIdentifier` as the real App ID. Google's sample App ID is only for Google's sample apps, and a GDPR message published for Snack Laps is tied to your real App ID. Set the flag back to `false` before the build you submit to the App Store.

The iPhone app does not request a banner or rewarded ad until Google's consent tools say ads are allowed. If that check fails, the game still opens and ads stay off.

#### Create the GDPR message (on your iPhone, in Safari)

You do this on the AdMob website. You do not need a Mac.

1. Open Safari and go to https://admob.google.com/
2. Sign in with the Google account that owns the Snack Laps AdMob app.
3. Tap the menu (☰), then **Privacy & messaging**.
4. On the **European regulations** card, tap **Create** if this is your first message. If you already have one, tap **Manage**, then **Create message**.
5. Tap **Select apps**, choose **Snack Laps**, and confirm. The message is shown only in the apps you select.
6. Keep **English** unless your app is offered in more languages. You can add those languages here and read each translation before you publish.
7. Under user choices, decide whether **Do not consent** is on. On means a player can refuse on the first page of the message. You can limit that button to certain countries.
8. Under targeting, leave **Countries subject to GDPR (EEA, UK, and Switzerland)** unless you have a reason to show this message everywhere.
9. Name the message something only you will see, such as `Snack Laps GDPR`.
10. Add your privacy policy URL. Use the live GitHub Pages address, for example `https://USERNAME.github.io/REPO/privacy.html`. Open that link in Safari first and confirm the page loads. A draft URL will not do.
11. Read the message text. Google's wording is fine to keep. Fix anything that does not match Snack Laps (the game has no account).
12. Decide who shows the iPhone tracking prompt. This is the part that prevents two prompts.
    - **No IDFA explainer published (this is the project default).** Leave `UMP_PRESENTS_ATT` as `false` in `scripts/native-bridge.js`. After the GDPR message, the app asks for tracking once, and only if the iPhone has not already answered. It asks before Game Center, so Game Center's welcome does not cover the prompt. It does not ask again on the same launch.
    - **You publish an IDFA explainer** (Privacy & messaging → IDFA → create and publish a message for Snack Laps). Google's message then explains tracking and shows the iPhone prompt itself. Change `UMP_PRESENTS_ATT` to `true`, run `npm run sync:ios`, and push. If you leave it `false`, the app may show a second tracking prompt.
13. Tap **Preview** and read it the way a player would. Then tap **Publish**. A saved draft is not shown in the app.

The message is tied to the AdMob app you selected and to the App ID already baked into the iPhone build: `ca-app-pub-6414962483147556~2280759881` (`GADApplicationIdentifier` in `ios/App/App/Info.plist`). Select that same Snack Laps app in Privacy & messaging. `USE_TEST_ADS` is already `false`, and the real banner and rewarded units are already in `scripts/native-bridge.js`. Publish the message, then build, before you expect the form in the app.

`GADDelayAppMeasurementInit` is already in that Info.plist. It tells Google to wait until the app initializes ads, which happens only after consent allows ads. Leave that key in place when you replace the App ID.

Players change an earlier choice with **Privacy / Ad Settings** on the start screen and the game-over screen. When Google says a privacy-options form is required, that button reopens it, and the app checks again whether ads are allowed. If they are not, the banner is removed. The game keeps running. The button is hidden in a browser.

#### Optional: US state regulations message

Still in Safari, on **Privacy & messaging**:

1. Find the **US state regulations** card.
2. Tap **Create**, or tap **Manage** and then **Create message**.
3. Select the **Snack Laps** app.
4. Add the same privacy policy URL you used for the European message.
5. Keep the US states Google lists for this message unless you have a reason to narrow them.
6. Tap **Preview**, then **Publish**.

This message is optional. It covers US state privacy choices. It does not replace the European regulations message, and it does not change the `UMP_PRESENTS_ATT` switch. That switch is only about the IDFA explainer.

### 6) Create the Game Center leaderboard

1. App Store Connect → your app → **Game Center**.
2. Enable Game Center for the app.
3. Create a **Classic Leaderboard**:
   - Leaderboard ID (exact): **`snacklaps.highscore`**  ← must match the code
   - Score format: Integer
   - Sort: High to low
4. Add the leaderboard to the iOS version you will submit.
5. On a real device, the player must be signed into Game Center (Settings → Game Center).

If you ever change the ID, update `GAME_CENTER.LEADERBOARD_ID` in `scripts/native-bridge.js` and rebuild the web bundle.

### 7) Privacy labels (App Store Connect) — ads & IDFA

When App Store Connect asks for **App Privacy**:

- Data used for **Third-Party Advertising**: yes (AdMob).
- **Device ID / Advertising Data** (IDFA): yes if you keep personalized ads / ATT.
- Tracking: yes if you request App Tracking Transparency (the app already shows an ATT prompt with `NSUserTrackingUsageDescription`).
- Be honest: the game does not ask for location permission or GPS. AdMob can still infer an approximate (coarse) location from the IP address. Disclose **Location → Coarse Location**. Scores stay on the device, plus Game Center if the player is signed in.
- Players can reopen Google's ad-privacy form from **Privacy / Ad Settings** on the start and game-over screens when that form is required. Tracking permission is the separate iPhone prompt (Settings → Privacy & Security → Tracking).

Also prepare a short privacy policy URL (GitHub Pages, Notion public page, etc.) — Apple usually requires one when you use ads.

### 8) Connect Codemagic

1. Sign up at https://codemagic.io/ with GitHub.
2. Add the Snack Laps repository.
3. Codemagic should detect `codemagic.yaml`.
4. **Teams → Global variables / repository variables** → create group `app_store_credentials` with:
   - `APP_STORE_CONNECT_ISSUER_ID`
   - `APP_STORE_CONNECT_KEY_IDENTIFIER`
   - `APP_STORE_CONNECT_PRIVATE_KEY` (full `.p8` text, secure)
5. In Codemagic → **Teams → Integrations → App Store Connect**, add the API key; rename the integration id in `codemagic.yaml` (`snacklaps_asc`) if needed.
6. Code signing: follow Codemagic’s “automatic code signing with App Store Connect API key” — it can create the distribution certificate and App Store provisioning profile for `com.snacklaps.game`.
7. Update email PLACEHOLDER in `codemagic.yaml` publishing section.
8. Start the **Snack Laps iOS → TestFlight** workflow.

### 9) Install on your iPhone with TestFlight

1. On your iPhone, install **TestFlight** from the App Store.
2. When Codemagic finishes, App Store Connect → TestFlight → wait for processing.
3. Add yourself as an internal tester (same Apple ID).
4. Open the TestFlight invite → Install **Snack Laps**.
5. Play: check music, the consent message (once your real App ID and published GDPR message are in the build), Privacy / Ad Settings, banner ad (test), rewarded continue, Global Leaderboard button, and haptics. A consent or ad failure should still leave the game playable.

### 10) Submit for App Review

1. App Store Connect → prepare listing (screenshots, description, age rating, privacy policy URL).
2. Select the build from TestFlight.
3. Set `submit_to_app_store: true` in `codemagic.yaml` **or** click Submit in App Store Connect.
4. Answer the export compliance / advertising identifier questions (the app uses AdMob → IDFA-related answers apply).

---

## Changing the bundle id later

1. Register the new id in Apple Developer → Identifiers.
2. Change `appId` in `capacitor.config.json`.
3. Change `PRODUCT_BUNDLE_IDENTIFIER` in Xcode project / Codemagic `bundle_identifier`.
4. Update AdMob app + App Store Connect app record accordingly.

---

## Project map (useful files)

```
snack-laps-app/
  www/index.html          Game (works in browser + inside the app)
  www/native.bundle.js    Capacitor bridge (AdMob / Game Center / Haptics)
  scripts/native-bridge.js  Source for the bridge — edit IDs and UMP_PRESENTS_ATT here
  scripts/consent-flow.mjs   UMP / ATT order and the ad gate (covered by npm test)
  ios/                    Xcode project (committed; Codemagic builds this)
  codemagic.yaml          Cloud build → TestFlight
  assets/                 Icon + splash sources
  README-APPSTORE.md      This guide
```

---

## Privacy / ads quick note (copy into your privacy policy if you want)

Snack Laps shows ads through Google AdMob on iPhone. Before those ads, Google's consent message can ask how your data is used. You can change that later with Privacy / Ad Settings on the start screen or the game-over screen, when Google requires that form. The app may also ask for permission to track across apps (App Tracking Transparency). You can decline either question and still play. Ads may be less personalized, or they may not load. Google and its partners can use the IP address as an approximate location for ads. The game does not ask for GPS. Scores for the personal top 10 stay on your device; the optional Global Leaderboard uses Apple Game Center.

