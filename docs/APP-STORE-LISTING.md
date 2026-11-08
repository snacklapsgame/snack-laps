# Snack Laps — App Store listing

Copy only the text inside each box into the matching field in App Store Connect. The count is outside the box. Counts include spaces, punctuation and line breaks, but not the box markers or a trailing newline. All six fields below are within their limits.

**Before using this listing:** the AdMob App ID, banner unit, and rewarded unit are filled in and `USE_TEST_ADS` is off. The Game Center leaderboard ID is still the placeholder `snacklaps.highscore` until you create that leaderboard. Do not submit claims for features that fail in your release build. This document does not publish or submit anything.

## App Name

**10 / 30 characters**

```text
Snack Laps
```

## Subtitle

**26 / 30 characters**

```text
Tiny paws. Big adventures.
```

## Promotional Text

**157 / 170 characters**

```text
Hold to run. Let go to hop! Munch treats, dodge trouble, unlock 101 pets and explore 16 colorful places. Chase a new best with music that builds as you play.
```

## Description

**1849 / 4000 characters**

```text
Tiny paws. Big adventures.

Snack Laps is a colorful, one-touch arcade game about a hungry pet and one more lap. Hold the screen to run on the outside track. Let go to hop to the inside track. Munch treats, dodge trouble and chase your next personal best.

SIMPLE TO LEARN, FUN TO MASTER
Swap between two tracks with a hold and release. Keep collecting treats to build your combo and earn more points per bite.

101 PETS TO UNLOCK
Start with Pup and unlock another pet at every 50-point best-score milestone. Reach 5,000 points to complete the collection of 101. Pick your favorite look and bring a new friend on your next run. Unlocks use your best single-run score, not points added across runs.

16 COLORFUL PLACES
Visit a new place every 50 points, from the park and beach to Candy Land and beyond. Discover all 16, then keep running as the places cycle with fresh color twists.

A LITTLE MORE TROUBLE
Begin with puddles. A new obstacle type joins every 50 points through 200 points: bees, cacti, rocks and hedgehogs. That makes five obstacle types to keep you hopping.

BUILD THE BEAT
Music adds layers as your combo builds, with treats adding notes along the way. Tap the speaker button whenever you want a quieter lap.

ONE MORE CHANCE
After your first crash, choose to watch a rewarded ad for one continue in that run. Earn the reward, get ready with a 3-2-1 countdown and hop back in.

CHASE YOUR BEST
Keep a personal top 10 on your device and compare your best score on the Apple Game Center leaderboard. No separate Snack Laps account is needed.

The game includes banner ads and an optional rewarded-ad continue. Ads and Game Center require an internet connection. Game Center uses your Apple Game Center sign-in. Local progress and settings are saved on your device; there is no developer-operated cloud save.

Ready for one more treat?
```

## Keywords

**94 / 100 characters**

```text
arcade,casual,runner,pets,puppy,animals,treats,reflex,timing,collect,onehand,leaderboard,music
```

## What's New (version 1.0)

**176 / 4000 characters**

```text
Welcome to Snack Laps! Hold to run, let go to hop, unlock 101 pets and explore 16 colorful places. Build the beat, chase your personal best and compare scores with Game Center.
```

## Name choice

Keep **Snack Laps** without a suffix. It is short and matches the icon. The subtitle does the extra explaining. Availability of the name still has to be checked in App Store Connect.

## Category

- Primary category: **Games**.
- Recommended game subcategory: **Arcade** (timing, reflexes and high-score runs).
- Additional game subcategory, if offered: **Casual** (simple one-touch controls).
- Do not select the Kids category just because the art is cute.

## Age rating: answer honestly, not to force 4+

**Expected starting point: 4+ for the nonviolent core game, not a guaranteed final rating.** Apple calculates the result from your answers; regional ratings may differ. Cute ghosts and collisions are not automatically horror or combat, but you must review what is actually shown.

Suggested answers for the current game:

- Advertising: **Yes**. Banner and rewarded-video ads count, even if watching a rewarded ad is optional.
- In-app parental controls: **No**. The game has no parent dashboard or parental settings.
- Age assurance / age verification: **No**. The game does not check or verify a player's age.
- Unrestricted web access: **No**. The game has no general-purpose web browser. An ad opening its destination is not the same as unrestricted browsing built into the game.
- Messaging / chat: **No**. Social-media feed: **No**.
- Broadly distributed user-generated content: **No custom uploads or posts**. Game Center can show Apple-managed nicknames and scores; review the current question wording rather than describing this as a social feed.
- Profanity / crude humor, alcohol / tobacco / drugs, sexual content / nudity, medical / wellness information, realistic violence, graphic violence, weapons: **None** in the game itself.
- Cartoon / fantasy violence: **None** for simple obstacle collisions with sparkles and no fighting or depicted injury; if a later version adds harm or combat, disclose it.
- Horror / fear: **None** if the decorative ghost pet / Haunted Yard is merely playful and not frightening. If your release presentation is scary, select the appropriate frequency; infrequent horror can raise the rating to 9+.
- Gambling / simulated gambling: **None**. Loot boxes: **No**. Pet unlocks are fixed score milestones, not paid random rewards.
- Contests: **Disclose the optional high-score ranking / Game Center leaderboard when the questionnaire includes rankings.** There are no cash prizes or entry fees. Choose the real frequency: Apple's current definitions allow infrequent contests at 4+ but frequent contests can produce 13+. A persistent leaderboard may affect this answer; do not select “None” simply to keep 4+.

AdMob can serve ads with different content. Set suitable ad-content restrictions in AdMob and in the release code, block unsuitable ad categories, and test the ads. The current bridge does not set `maxAdContentRating`; do not assume all ads already match 4+. “Not directed at children under 13” describes the intended audience; it is not an implemented age gate and does not remove legal obligations toward children who use the app.

## App Privacy — the little data labels

### First question

**Do you or your third-party partners collect data from this app? → Yes.** AdMob counts even though you do not operate a server and do not receive individual players' local saves. Do not choose “Data Not Collected.” Disclose the app's full release behavior, not just what happens for a user who refuses tracking or the current test-ad build.

### Data types to include for AdMob

Google's official guidance identifies the categories below. Its page now describes SDK 13.12.0; this project currently pins **Google Mobile Ads SDK 13.11.0** in the AdMob plugin's `Package.swift`. Check the exact release archive's privacy report and any new SDKs before submitting. The IP-based approximate-location disclosure still matters even though the game asks for no location permission. The privacy policy describes the same thing: a coarse area inferred from the IP address, not GPS, and no iOS location permission.

| App Store Connect selection | Why / purposes to disclose |
| --- | --- |
| **Identifiers → Device ID** | IDFA when permitted, and other app/device identifiers. **Third-Party Advertising** and **Analytics**. |
| **Usage Data → Advertising Data** | Ads shown, ad views and related advertising activity. **Third-Party Advertising** and **Analytics**. |
| **Usage Data → Product Interaction** | App launches, taps and video/ad interactions processed by the SDK. **Third-Party Advertising** and **Analytics**. |
| **Diagnostics → Crash Data** | SDK crash logs. **App Functionality** for debugging; Google's guide says diagnostics may also support **Third-Party Advertising** and **Analytics**. Include applicable uses. |
| **Diagnostics → Performance Data** | Launch times, hangs, energy/performance information. **Analytics** and **Third-Party Advertising**, plus **App Functionality** where used for stability. |
| **Location → Coarse Location** | Approximate location inferred from the IP address (a city or region, not GPS). **Third-Party Advertising** and **Analytics**, where used by the SDK. The game does not request the iOS location permission and does not read a precise position. |

Select other purposes/data types only when actually used. Do not select **Developer's Advertising or Marketing** just because third-party ads appear in your game. If you later add ad mediation, analytics, push messaging or another SDK, reassess the label.

### Linked to the user? Used for tracking?

- **Device ID:** for the intended personalized-ad setup, **Linked to the user → Yes; Used for tracking → Yes**. Tracking is permitted only after the required permission; the label still reports that capability.
- **Advertising Data / Product Interaction:** **Linked → Yes; Tracking → Yes** when associated with identifiers for cross-app advertising or ad measurement, as expected in the intended personalized-ad setup.
- **Coarse Location (approximate location from the IP address):** disclose **Linked → Yes; Tracking → Yes** when associated with those advertising identifiers for targeted advertising or ad measurement. Do not call IP-derived location anonymous merely because you never see the IP yourself. This is the same approximate location described in the privacy policy.
- **Performance Data:** Google's guide describes it as user-associated, so **Linked → Yes**. Include advertising and analytics purposes. **Tracking → Yes only if it is linked with third-party data for cross-app advertising/measurement**; confirm the release SDK privacy report and actual configuration before answering that subquestion.
- **Crash Data:** Google describes non-user-related crash logs. **Linked → No and Tracking → No** are appropriate only if your release SDK/configuration really keeps them non-user-related. If crash/other diagnostic data is identifier-linked or used for cross-app advertising measurement, disclose **Linked / Tracking → Yes** as applicable. Advertising or analytics use by itself does not automatically mean Apple's definition of tracking is met.

**Do not blanket-mark all diagnostics as tracking, or all diagnostics as anonymous.** The static game code and Google's general guide do not establish every backend linkage. Get the release archive's privacy report from the cloud build and check the included SDK privacy manifests and Google guidance before finalizing these diagnostic subanswers. This is the part that remains conditional, not a claim that it was verified on an iPhone or in Xcode here.

### What about local scores, Game Center and support?

- Personal top 10, pet progress and settings that stay only on the device are **not collected** under Apple's off-device definition.
- Apple processes Game Center scores and identity. Apple's guidance says you are not responsible for declaring data collected by Apple itself. This app does not send Game Center IDs/scores to a developer server. If you later collect or export identifiable Game Center data yourself, reassess **User ID**, **Gameplay Content** and their **App Functionality** purposes.
- There is no Firebase / Google Analytics integration or separate developer analytics SDK in this project. AdMob advertising analytics and diagnostics still apply.
- There is no in-app support form or email field. Email you voluntarily receive through a separate mail app is discussed in the privacy policy. If you add in-app collection of support messages or contact details, review **Email Address / Customer Support** and Apple's optional-disclosure rules rather than assuming an exemption.

### Privacy links to paste after GitHub Pages is live

Privacy Policy URL:

```text
https://USERNAME.github.io/REPO/privacy.html
```

Optional Privacy Choices URL (the policy explains the current available choices):

```text
https://USERNAME.github.io/REPO/privacy.html
```

### Privacy / ad checks before release

1. Replace `[YOUR EMAIL]` and `[YOUR NAME OR STUDIO]` in the web pages. Choose an inbox you actually monitor; we have not chosen or created one for you.
2. On each iPhone launch the app requests Google UMP consent info, shows the consent form when the status is REQUIRED and a form is available, and only then initializes the Mobile Ads SDK or loads a banner or rewarded ad — and only when `canRequestAds` is exactly true. A missing flag or a failed consent call is not treated as permission. Gameplay continues either way. `GADDelayAppMeasurementInit` is set so Google measurement waits for that initialization. Unit tests cover this gate. It has not been confirmed on a physical iPhone.
3. The iPhone start screen and game-over screen show **Privacy / Ad Settings**. When `privacyOptionsRequirementStatus` is REQUIRED, that button opens Google's privacy options form, reads consent again, and removes the banner if ads are no longer allowed. The control is hidden in the browser and does nothing if activated there. The privacy policy describes this control. Confirm the real form and a withdrawn choice on TestFlight. If you publish an AdMob IDFA explainer, set `UMP_PRESENTS_ATT` to `true` so the app does not show a second tracking prompt. See README-APPSTORE.md.
4. Configure child/teen treatment and suitable ad-content restrictions for the audience and applicable laws. No age verification is implemented; do not claim it is.
5. Test ATT accepted/refused, advertising consent accepted/refused, ad failure, earned reward and Game Center on a real TestFlight build. The intended order is the GDPR message, then the tracking prompt (unless a published IDFA explainer already showed it), then Game Center, then ads only if Google allows them. The release bridge requests the real banner and rewarded units. Register your testing devices in AdMob so those clicks are not counted as invalid traffic.
6. Confirm the actual Xcode archive contains the expected SDK privacy manifests and any required-reason API declarations. Update labels if the resolved SDK, consent choices, mediation or app behavior changes.

## Other copy-paste fields

### Copyright

Replace the bracketed owner with your legal name or studio name:

```text
2026 [YOUR NAME OR STUDIO]
```

Apple adds the copyright symbol in its display, so the field above omits it. Do not put a URL in this field.

### Support URL

```text
https://USERNAME.github.io/REPO/support.html
```

### Marketing URL

```text
https://USERNAME.github.io/REPO/
```

These are project-site URLs: do not include `/docs/` in the public address. Replace `USERNAME` and `REPO` with the exact GitHub username and repository name. Wait for Pages to publish and open every link in Safari before pasting it into App Store Connect. The landing page deliberately has no fake App Store download button.

## Version 1.0 note

The “What's New” box above is supplied for your first-release announcement. App Store Connect may not require or offer that field for the first version; if it does not, save this text rather than putting it into the wrong field.

## Sources checked for these instructions

- Google AdMob App Store data disclosure: https://developers.google.com/admob/ios/privacy/data-disclosure
- Google partner advertising/privacy explanation: https://policies.google.com/technologies/partner-sites
- Apple App Privacy details and definitions: https://developer.apple.com/app-store/app-privacy-details/
- Apple age-rating values and definitions: https://developer.apple.com/help/app-store-connect/reference/app-information/age-ratings-values-and-definitions/

The pages above were opened during preparation of this pack in November 2026. They are guidance, not automatic legal clearance or approval from Apple. The account holder is responsible for matching the final submitted app.
