/**
 * Google UMP + ATT decisions for Snack Laps.
 * This module never touches the DOM and never calls AdMob itself.
 * Pass in a small client so tests can run without the native bridge.
 *
 * Ads are allowed only when Google's canRequestAds is the boolean true.
 * A missing field, a thrown call, or a failed form is not permission.
 */

export const ConsentStatus = {
  UNKNOWN: 'UNKNOWN',
  REQUIRED: 'REQUIRED',
  NOT_REQUIRED: 'NOT_REQUIRED',
  OBTAINED: 'OBTAINED',
};

export const PrivacyOptions = {
  UNKNOWN: 'UNKNOWN',
  NOT_REQUIRED: 'NOT_REQUIRED',
  REQUIRED: 'REQUIRED',
};

export const TrackingStatus = {
  NOT_DETERMINED: 'notDetermined',
  RESTRICTED: 'restricted',
  DENIED: 'denied',
  AUTHORIZED: 'authorized',
};

export function consentAllowsAds(info) {
  return !!(info && info.canRequestAds === true);
}

export function privacyOptionsRequired(info) {
  return !!(info && info.privacyOptionsRequirementStatus === PrivacyOptions.REQUIRED);
}

export function shouldPresentConsentForm(info) {
  return !!(
    info &&
    info.isConsentFormAvailable === true &&
    info.status === ConsentStatus.REQUIRED
  );
}

/**
 * Manual ATT only when UMP is not publishing an IDFA explainer,
 * and only while iOS still says the user has not answered.
 * One call site uses this so the system prompt is not requested twice.
 */
export function shouldRequestTracking(trackingStatus, umpPresentsAtt) {
  if (umpPresentsAtt) return false;
  return trackingStatus === TrackingStatus.NOT_DETERMINED;
}

function asError(err) {
  if (err instanceof Error) return err;
  return new Error(err == null ? 'consent failed' : String(err));
}

function confirmedInfo(info) {
  if (!info || typeof info.canRequestAds !== 'boolean') return null;
  return info;
}

function blankConsent() {
  return {
    canRequestAds: false,
    privacyOptionsRequired: false,
    status: null,
    formShown: false,
    error: null,
    info: null,
  };
}

function applyInfo(result, info) {
  result.canRequestAds = info.canRequestAds === true;
  result.privacyOptionsRequired = privacyOptionsRequired(info);
  result.status = info.status == null ? null : info.status;
  result.info = info;
  result.error = null;
  return result;
}

/**
 * Request the latest consent info and, when Google says a form is required
 * and available, present it before returning. Never throws.
 */
export async function gatherConsent(admob) {
  const result = blankConsent();
  let info;
  try {
    info = confirmedInfo(await admob.requestConsentInfo());
  } catch (err) {
    result.error = asError(err);
    return result;
  }
  if (!info) {
    result.error = new Error('canRequestAds was not confirmed');
    return result;
  }

  if (shouldPresentConsentForm(info)) {
    result.formShown = true;
    try {
      const after = confirmedInfo(await admob.showConsentForm());
      if (after) {
        info = after;
      } else {
        info = confirmedInfo(await admob.requestConsentInfo());
        if (!info) {
          result.error = new Error('canRequestAds was not confirmed');
          return result;
        }
      }
    } catch (err) {
      result.error = asError(err);
      try {
        const reread = confirmedInfo(await admob.requestConsentInfo());
        if (!reread) return result;
        info = reread;
      } catch (err2) {
        result.error = asError(err2);
        return result;
      }
    }
  }

  return applyInfo(result, info);
}

/**
 * ATT after the UMP form, and only when this app owns the prompt.
 * Never throws. Does not request ads.
 */
export async function requestTrackingIfNeeded(admob, umpPresentsAtt) {
  const trace = { requested: false, status: null, error: null, skipped: null };
  if (umpPresentsAtt) {
    trace.skipped = 'ump-idfa-message';
    return trace;
  }
  let status;
  try {
    const res = await admob.trackingAuthorizationStatus();
    status = res && res.status;
  } catch (err) {
    trace.error = asError(err);
    trace.skipped = 'status-unavailable';
    return trace;
  }
  trace.status = status || null;
  if (!shouldRequestTracking(status, umpPresentsAtt)) {
    trace.skipped = 'already-determined';
    return trace;
  }
  try {
    const res = await admob.requestTrackingAuthorization();
    trace.requested = true;
    trace.status = (res && res.status) || status;
  } catch (err) {
    trace.error = asError(err);
  }
  return trace;
}

/**
 * Launch order: UMP consent, then ATT (unless an IDFA message owns it),
 * then afterTracking (Game Center). Ads stay off until the caller applies
 * the consent result. Never throws.
 */
export async function runLaunchPrivacy(admob, options) {
  const umpPresentsAtt = !!(options && options.umpPresentsAtt);
  const consent = await gatherConsent(admob);
  const tracking = await requestTrackingIfNeeded(admob, umpPresentsAtt);
  if (options && typeof options.afterTracking === 'function') {
    try {
      await options.afterTracking();
    } catch (err) {
      tracking.afterTrackingError = asError(err);
    }
  }
  return { consent, tracking };
}

/**
 * Shared ad gate. initialize() runs at most once, and only after canRequestAds
 * is true. Rewarded loads use the same gate. Privacy settings re-read Google's
 * flag and remove the banner when ads are no longer allowed.
 */
export function createAdGate(admob, options) {
  const useTestAds = !!(options && options.useTestAds);
  const banner = (options && options.banner) || {};
  const rewarded = (options && options.rewarded) || {};

  let canRequestAds = false;
  let privacyOptionsFlag = false;
  let ready = false;
  let initPromise = null;
  let initCount = 0;
  let bannerVisible = false;
  let bannerOp = null;
  let adsPaused = false;

  function apply(consent) {
    canRequestAds = !!(consent && consent.canRequestAds === true);
    privacyOptionsFlag = !!(consent && consent.privacyOptionsRequired === true);
  }

  async function ensureInitialized() {
    if (adsPaused || canRequestAds !== true) return false;
    if (ready) return true;
    if (!initPromise) {
      initCount += 1;
      initPromise = Promise.resolve()
        .then(() => admob.initialize({ initializeForTesting: useTestAds }))
        .then(() => {
          ready = true;
        })
        .catch((err) => {
          initPromise = null;
          ready = false;
          throw err;
        });
    }
    try {
      await initPromise;
      return ready === true && canRequestAds === true && !adsPaused;
    } catch (_) {
      return false;
    }
  }

  async function hideBanner() {
    if (bannerOp) {
      try {
        await bannerOp;
      } catch (_) {}
    }
    bannerOp = null;
    if (!bannerVisible) return;
    try {
      await admob.removeBanner();
    } catch (_) {}
    bannerVisible = false;
  }

  async function syncBanner() {
    if (adsPaused) {
      return { bannerVisible, initialized: ready, paused: true };
    }
    if (canRequestAds !== true) {
      await hideBanner();
      return { bannerVisible: false, initialized: ready, paused: false };
    }
    const ok = await ensureInitialized();
    if (!ok || canRequestAds !== true || adsPaused) {
      await hideBanner();
      return { bannerVisible: false, initialized: ready, paused: adsPaused };
    }
    if (!bannerVisible && !bannerOp) {
      bannerOp = Promise.resolve()
        .then(() => admob.showBanner(banner))
        .then(async () => {
          if (canRequestAds !== true || adsPaused) {
            bannerVisible = false;
            try {
              await admob.removeBanner();
            } catch (_) {}
            return;
          }
          bannerVisible = true;
        })
        .catch(() => {
          bannerVisible = false;
        })
        .finally(() => {
          if (!bannerVisible) bannerOp = null;
        });
    }
    if (bannerOp) {
      try {
        await bannerOp;
      } catch (_) {}
    }
    return { bannerVisible, initialized: ready, paused: false };
  }

  async function showRewarded() {
    if (adsPaused || canRequestAds !== true) return false;
    const ok = await ensureInitialized();
    if (!ok || adsPaused || canRequestAds !== true) return false;
    try {
      await admob.prepareRewardVideoAd(rewarded);
      await admob.showRewardVideoAd();
      return true;
    } catch (_) {
      return false;
    }
  }

  async function openPrivacySettings() {
    adsPaused = true;
    try {
      let info;
      try {
        info = confirmedInfo(await admob.requestConsentInfo());
      } catch (err) {
        canRequestAds = false;
        return { shown: false, canRequestAds: false, privacyOptionsRequired: privacyOptionsFlag, error: asError(err) };
      }
      if (!info) {
        canRequestAds = false;
        return {
          shown: false,
          canRequestAds: false,
          privacyOptionsRequired: privacyOptionsFlag,
          error: new Error('canRequestAds was not confirmed'),
        };
      }
      privacyOptionsFlag = privacyOptionsRequired(info);
      canRequestAds = info.canRequestAds === true;
      if (!privacyOptionsFlag) {
        return { shown: false, canRequestAds, privacyOptionsRequired: false, error: null };
      }
      try {
        await admob.showPrivacyOptionsForm();
      } catch (err) {
        try {
          const reread = confirmedInfo(await admob.requestConsentInfo());
          if (!reread) canRequestAds = false;
          else {
            canRequestAds = reread.canRequestAds === true;
            privacyOptionsFlag = privacyOptionsRequired(reread);
          }
        } catch (_) {
          canRequestAds = false;
        }
        return {
          shown: false,
          canRequestAds,
          privacyOptionsRequired: privacyOptionsFlag,
          error: asError(err),
        };
      }
      try {
        const after = confirmedInfo(await admob.requestConsentInfo());
        if (!after) canRequestAds = false;
        else {
          canRequestAds = after.canRequestAds === true;
          privacyOptionsFlag = privacyOptionsRequired(after);
        }
      } catch (_) {
        canRequestAds = false;
      }
      return { shown: true, canRequestAds, privacyOptionsRequired: privacyOptionsFlag, error: null };
    } finally {
      adsPaused = false;
      try {
        await syncBanner();
      } catch (_) {}
    }
  }

  function snapshot() {
    return {
      canRequestAds,
      privacyOptionsRequired: privacyOptionsFlag,
      ready,
      bannerVisible,
      initCount,
      adsPaused,
    };
  }

  return { apply, syncBanner, showRewarded, openPrivacySettings, snapshot };
}

/**
 * Full native launch used by the bridge: privacy order, then the ad gate.
 * Game Center is afterTracking. Ads initialize only inside the gate.
 */
export async function completeNativeLaunch(admob, gate, options) {
  const privacy = await runLaunchPrivacy(admob, options || {});
  gate.apply(privacy.consent);
  let ads = { bannerVisible: false, initialized: false, paused: false };
  try {
    ads = await gate.syncBanner();
  } catch (err) {
    privacy.adsError = asError(err);
  }
  return { ...privacy, ads };
}
