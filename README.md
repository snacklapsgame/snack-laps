# Snack Laps (iOS / Capacitor)

HTML5 game wrapped with Capacitor for App Store / TestFlight builds via Codemagic (no Mac required).

- **Play in browser:** open `www/index.html` (or serve the `www/` folder). The Privacy / Ad Settings button is hidden here. Add `?privacyPreview=1` only to see that iPhone button; it does not load ads or a consent form.
- **Ship to iPhone:** follow **[README-APPSTORE.md](./README-APPSTORE.md)** step by step, including the GDPR message.
- **AdMob IDs are filled** in `scripts/native-bridge.js` and `ios/App/App/Info.plist`. `USE_TEST_ADS` is `false`. To use Google's demo units again, set that flag to `true` and run `npm run sync:ios`. Leave the real App ID in Info.plist.
- **Ads on iPhone:** Google UMP consent runs before any ad request. Set `UMP_PRESENTS_ATT` to `true` only after you publish an AdMob IDFA explainer. See README-APPSTORE.md.

```bash
npm install
npm test
npm run verify:web
npm run sync:ios
```
