/**
 * Snack Laps native bridge (Capacitor).
 * Loaded as an IIFE bundle; exposes window.SnackNative.
 * On the open web this is a no-op and the game keeps its existing behavior.
 *
 * Ad consent (iPhone only):
 *   1. Google UMP requestConsentInfo, then the consent form when it is required.
 *   2. App Tracking Transparency once, only if no published UMP IDFA message
 *      owns that prompt and iOS still says notDetermined.
 *   3. Game Center sign-in (after ATT, so its welcome UI cannot cover the prompt).
 *   4. Initialize the Mobile Ads SDK and the banner only when canRequestAds is exactly true.
 * A consent failure leaves the game playable and does not request ads.
 */
import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import {
  AdMob,
  BannerAdSize,
  BannerAdPosition,
} from '@capacitor-community/admob';
import { CapacitorGameConnect } from 'capacitor-game-connect-8';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { completeNativeLaunch, createAdGate } from './consent-flow.mjs';

/* ===================== ADMOB IDS ===================================
   REAL_* are the Snack Laps AdMob app and units. USE_TEST_ADS is false,
   so release and TestFlight builds request those units.
   There is no separate debug/TestFlight ad configuration. To force
   Google's demo units again, set USE_TEST_ADS = true, then
   npm run build:web && npx cap sync ios. Leave the real App ID in
   Info.plist either way. The SDK reads that plist value, not REAL_APP_ID.
   ================================================================== */
const USE_TEST_ADS = false;

const ADMOB = {
  // Google official TEST app / unit IDs (iOS). Used only when USE_TEST_ADS is true.
  TEST_APP_ID: 'ca-app-pub-3940256099942544~1458002511',
  TEST_BANNER: 'ca-app-pub-3940256099942544/2934735716',
  TEST_REWARDED: 'ca-app-pub-3940256099942544/1712485313',

  // Snack Laps AdMob account. App ID must also match GADApplicationIdentifier.
  REAL_APP_ID: 'ca-app-pub-6414962483147556~2280759881',
  REAL_BANNER: 'ca-app-pub-6414962483147556/7715638137',
  REAL_REWARDED: 'ca-app-pub-6414962483147556/1372224089',
};

const GAME_CENTER = {
  // PLACEHOLDER — create this classic leaderboard in App Store Connect → Game Center
  LEADERBOARD_ID: 'snacklaps.highscore',
};

/* Set this to true ONLY after you publish an AdMob Privacy & messaging
   IDFA explainer for Snack Laps. That message shows the iPhone tracking
   prompt itself. Calling requestTrackingAuthorization as well can show
   a second prompt. Leave false when you have no IDFA message: the app
   asks once, after the GDPR form, and only if iOS says notDetermined.
   Do not pass a debug geography here. Do not reset production consent. */
const UMP_PRESENTS_ATT = false;

const CONSENT_INFO_TIMEOUT_MS = 15000;

function isNative() {
  try {
    return !!(Capacitor && Capacitor.isNativePlatform && Capacitor.isNativePlatform());
  } catch (_) {
    return false;
  }
}

function bannerId() {
  return USE_TEST_ADS ? ADMOB.TEST_BANNER : ADMOB.REAL_BANNER;
}
function rewardedId() {
  return USE_TEST_ADS ? ADMOB.TEST_REWARDED : ADMOB.REAL_REWARDED;
}

let adGate = null;
let launchPromise = null;
let privacyBusy = false;

function withTimeout(promise, ms) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('consent info timed out')), ms);
    Promise.resolve(promise).then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      }
    );
  });
}

function privacyPreviewRequested() {
  try {
    return new URLSearchParams(window.location.search).get('privacyPreview') === '1';
  } catch (_) {
    return false;
  }
}

function setPrivacyNote(text) {
  document.querySelectorAll('.privacyNote').forEach((el) => {
    el.textContent = text || '';
  });
}

function createNativeAdMob() {
  return {
    requestConsentInfo() {
      // No debug geography. tagForUnderAgeOfConsent stays false: the game
      // does not check age and is not a child-directed treatment app.
      return withTimeout(
        AdMob.requestConsentInfo({ tagForUnderAgeOfConsent: false }),
        CONSENT_INFO_TIMEOUT_MS
      );
    },
    showConsentForm() {
      return AdMob.showConsentForm();
    },
    showPrivacyOptionsForm() {
      return AdMob.showPrivacyOptionsForm();
    },
    trackingAuthorizationStatus() {
      return AdMob.trackingAuthorizationStatus();
    },
    requestTrackingAuthorization() {
      return AdMob.requestTrackingAuthorization();
    },
    initialize(opts) {
      return AdMob.initialize(opts || { initializeForTesting: USE_TEST_ADS });
    },
    showBanner(opts) {
      const adEl = document.getElementById('ad');
      if (adEl) {
        adEl.style.visibility = 'hidden';
        adEl.style.pointerEvents = 'none';
        adEl.setAttribute('aria-hidden', 'true');
        adEl.innerHTML = '';
      }
      return AdMob.showBanner(opts);
    },
    removeBanner() {
      return AdMob.removeBanner();
    },
    prepareRewardVideoAd(opts) {
      return AdMob.prepareRewardVideoAd(opts);
    },
    showRewardVideoAd() {
      return AdMob.showRewardVideoAd();
    },
  };
}

async function initAudioSession() {
  // Prefer the Web Audio Session API so music behaves like a game (plays with silent switch).
  try {
    if (navigator.audioSession) navigator.audioSession.type = 'playback';
  } catch (_) {}
}

async function initStatusChrome() {
  try {
    await StatusBar.setStyle({ style: Style.Light });
    await StatusBar.setOverlaysWebView({ overlay: true });
  } catch (_) {}
  try {
    await SplashScreen.hide();
  } catch (_) {}
}

async function initGameCenter() {
  try {
    const user = await CapacitorGameConnect.signIn();
    gcSignedIn = true;
    console.info('[SnackNative] Game Center signed in', user && user.player_name);
  } catch (err) {
    gcSignedIn = false;
    console.warn('[SnackNative] Game Center sign-in failed', err);
  }
}

let gcSignedIn = false;

async function showRewardedAdNative() {
  try {
    if (launchPromise) {
      try {
        await launchPromise;
      } catch (_) {}
    }
    if (!adGate) return false;
    return await adGate.showRewarded();
  } catch (err) {
    console.warn('[SnackNative] rewarded ad failed/dismissed', err);
    return false;
  }
}

async function submitBestScore(score) {
  if (!isNative() || !(score > 0)) return;
  try {
    if (!gcSignedIn) {
      try {
        await CapacitorGameConnect.signIn();
        gcSignedIn = true;
      } catch (_) {}
    }
    await CapacitorGameConnect.submitScore({
      leaderboardID: GAME_CENTER.LEADERBOARD_ID,
      totalScoreAmount: Math.floor(score),
    });
  } catch (err) {
    console.warn('[SnackNative] submitScore failed', err);
  }
}

async function showGlobalLeaderboard() {
  if (!isNative()) {
    alert('Global Leaderboard is available in the iPhone app via Game Center.');
    return;
  }
  try {
    if (!gcSignedIn) {
      await CapacitorGameConnect.signIn();
      gcSignedIn = true;
    }
    await CapacitorGameConnect.showLeaderboard({
      leaderboardID: GAME_CENTER.LEADERBOARD_ID,
    });
  } catch (err) {
    console.warn('[SnackNative] showLeaderboard failed', err);
    alert('Could not open Game Center. Make sure you are signed into Game Center on this iPhone.');
  }
}

async function haptic(kind) {
  if (!isNative()) return;
  try {
    if (kind === 'eat') {
      await Haptics.impact({ style: ImpactStyle.Light });
    } else if (kind === 'crash') {
      await Haptics.impact({ style: ImpactStyle.Heavy });
    } else if (kind === 'unlock' || kind === 'scene') {
      await Haptics.notification({
        type: kind === 'unlock' ? NotificationType.Success : NotificationType.Warning,
      });
    } else {
      await Haptics.impact({ style: ImpactStyle.Medium });
    }
  } catch (_) {}
}

function wirePrivacyControls() {
  // ?privacyPreview=1 only reveals the iPhone button for screenshots.
  // It does not load ads or present a consent form. Clicks stay a no-op on web.
  if (!isNative() && privacyPreviewRequested()) {
    document.documentElement.classList.add('native-app');
    document.body.classList.add('native-app');
  }
  document.querySelectorAll('.privacyBtn').forEach((btn) => {
    if (btn.dataset.bound === '1') return;
    btn.dataset.bound = '1';
    btn.addEventListener('click', (event) => {
      onPrivacyTap(event).catch(() => {});
    });
  });
}

async function onPrivacyTap(event) {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }
  if (!isNative()) return;
  if (privacyBusy) return;
  privacyBusy = true;
  try {
    if (launchPromise) {
      try {
        await launchPromise;
      } catch (_) {}
    }
    if (!adGate) {
      setPrivacyNote('Could not open ad settings. You can keep playing.');
      return;
    }
    const result = await adGate.openPrivacySettings();
    if (result.shown) {
      setPrivacyNote(result.canRequestAds
        ? 'Saved. Ads can still show.'
        : 'Saved. Ads are off. You can keep playing.');
    } else if (result.error) {
      setPrivacyNote('Could not open ad settings. You can keep playing.');
    } else {
      setPrivacyNote('No ad-privacy form is required right now.');
    }
  } catch (_) {
    setPrivacyNote('Could not open ad settings. You can keep playing.');
  } finally {
    privacyBusy = false;
  }
}

async function init() {
  wirePrivacyControls();
  if (!isNative()) return;
  document.documentElement.classList.add('native-app');
  document.body.classList.add('native-app');
  const admob = createNativeAdMob();
  adGate = createAdGate(admob, {
    useTestAds: USE_TEST_ADS,
    banner: {
      adId: bannerId(),
      adSize: BannerAdSize.BANNER,
      position: BannerAdPosition.BOTTOM_CENTER,
      margin: 0,
      isTesting: USE_TEST_ADS,
    },
    rewarded: {
      adId: rewardedId(),
      isTesting: USE_TEST_ADS,
    },
  });
  launchPromise = (async () => {
    await initAudioSession();
    await initStatusChrome();
    // Consent, then ATT, then Game Center, then ads only if Google allows them.
    await completeNativeLaunch(admob, adGate, {
      umpPresentsAtt: UMP_PRESENTS_ATT,
      afterTracking: () => initGameCenter(),
    });
  })();
  try {
    await launchPromise;
  } catch (err) {
    console.warn('[SnackNative] startup privacy flow failed', err);
  }
}

const SnackNative = {
  isNative,
  init,
  showRewardedAd: showRewardedAdNative,
  submitBestScore,
  showGlobalLeaderboard,
  haptic,
  config: { ADMOB, GAME_CENTER, USE_TEST_ADS, UMP_PRESENTS_ATT },
};

window.SnackNative = SnackNative;

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    init().catch((e) => console.warn(e));
  });
} else {
  init().catch((e) => console.warn(e));
}

export default SnackNative;
