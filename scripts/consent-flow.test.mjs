import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import {
  completeNativeLaunch,
  consentAllowsAds,
  createAdGate,
  gatherConsent,
  privacyOptionsRequired,
  requestTrackingIfNeeded,
  runLaunchPrivacy,
  shouldPresentConsentForm,
  shouldRequestTracking,
} from './consent-flow.mjs';

function info(overrides) {
  return {
    status: 'NOT_REQUIRED',
    isConsentFormAvailable: false,
    canRequestAds: true,
    privacyOptionsRequirementStatus: 'NOT_REQUIRED',
    ...overrides,
  };
}

function fakeAdMob(handlers) {
  const calls = [];
  const api = {
    calls,
    async requestConsentInfo() {
      calls.push('requestConsentInfo');
      return handlers.requestConsentInfo ? handlers.requestConsentInfo(calls) : info();
    },
    async showConsentForm() {
      calls.push('showConsentForm');
      if (handlers.showConsentForm) return handlers.showConsentForm(calls);
      return info({ status: 'OBTAINED', canRequestAds: true, privacyOptionsRequirementStatus: 'REQUIRED' });
    },
    async showPrivacyOptionsForm() {
      calls.push('showPrivacyOptionsForm');
      if (handlers.showPrivacyOptionsForm) return handlers.showPrivacyOptionsForm(calls);
    },
    async trackingAuthorizationStatus() {
      calls.push('trackingAuthorizationStatus');
      if (handlers.trackingAuthorizationStatus) return handlers.trackingAuthorizationStatus();
      return { status: 'notDetermined' };
    },
    async requestTrackingAuthorization() {
      calls.push('requestTrackingAuthorization');
      if (handlers.requestTrackingAuthorization) return handlers.requestTrackingAuthorization();
      return { status: 'authorized' };
    },
    async initialize() {
      calls.push('initialize');
      if (handlers.initialize) return handlers.initialize();
    },
    async showBanner(opts) {
      calls.push('showBanner');
      api.lastBanner = opts;
      if (handlers.showBanner) return handlers.showBanner(opts);
    },
    async removeBanner() {
      calls.push('removeBanner');
      if (handlers.removeBanner) return handlers.removeBanner();
    },
    async prepareRewardVideoAd(opts) {
      calls.push('prepareRewardVideoAd');
      api.lastRewarded = opts;
      if (handlers.prepareRewardVideoAd) return handlers.prepareRewardVideoAd(opts);
    },
    async showRewardVideoAd() {
      calls.push('showRewardVideoAd');
      if (handlers.showRewardVideoAd) return handlers.showRewardVideoAd();
    },
    async resetConsentInfo() {
      calls.push('resetConsentInfo');
      throw new Error('production consent must not be reset');
    },
  };
  return api;
}

function gateFor(admob) {
  return createAdGate(admob, {
    useTestAds: true,
    banner: { adId: 'banner-test', isTesting: true },
    rewarded: { adId: 'reward-test', isTesting: true },
  });
}

test('only an exact boolean true allows ads', () => {
  assert.equal(consentAllowsAds({ canRequestAds: true }), true);
  assert.equal(consentAllowsAds({ canRequestAds: false }), false);
  assert.equal(consentAllowsAds({ canRequestAds: 'true' }), false);
  assert.equal(consentAllowsAds({}), false);
  assert.equal(consentAllowsAds(null), false);
  assert.equal(consentAllowsAds(undefined), false);
});

test('privacy options are required only for Google REQUIRED', () => {
  assert.equal(privacyOptionsRequired(info({ privacyOptionsRequirementStatus: 'REQUIRED' })), true);
  assert.equal(privacyOptionsRequired(info({ privacyOptionsRequirementStatus: 'NOT_REQUIRED' })), false);
  assert.equal(privacyOptionsRequired(info({ privacyOptionsRequirementStatus: 'UNKNOWN' })), false);
  assert.equal(privacyOptionsRequired(null), false);
});

test('the consent form is presented only when required and available', () => {
  assert.equal(shouldPresentConsentForm(info({
    status: 'REQUIRED',
    isConsentFormAvailable: true,
    canRequestAds: false,
  })), true);
  assert.equal(shouldPresentConsentForm(info({
    status: 'REQUIRED',
    isConsentFormAvailable: false,
  })), false);
  assert.equal(shouldPresentConsentForm(info({
    status: 'OBTAINED',
    isConsentFormAvailable: true,
  })), false);
  assert.equal(shouldPresentConsentForm(info({ status: 'NOT_REQUIRED' })), false);
});

test('manual ATT is a single notDetermined request unless UMP owns IDFA', () => {
  assert.equal(shouldRequestTracking('notDetermined', false), true);
  assert.equal(shouldRequestTracking('notDetermined', true), false);
  assert.equal(shouldRequestTracking('authorized', false), false);
  assert.equal(shouldRequestTracking('denied', false), false);
  assert.equal(shouldRequestTracking('restricted', false), false);
  assert.equal(shouldRequestTracking(undefined, false), false);
});

test('unknown or missing canRequestAds fails closed and does not show a form', async () => {
  const admob = fakeAdMob({
    requestConsentInfo: async () => ({ status: 'OBTAINED', privacyOptionsRequirementStatus: 'UNKNOWN' }),
  });
  const consent = await gatherConsent(admob);
  assert.equal(consent.canRequestAds, false);
  assert.ok(consent.error);
  assert.equal(consent.formShown, false);
  assert.deepEqual(admob.calls, ['requestConsentInfo']);
});

test('a required available form runs before any ad, then Google can allow ads', async () => {
  let gameCenter = 0;
  const admob = fakeAdMob({
    requestConsentInfo: async () => info({
      status: 'REQUIRED',
      isConsentFormAvailable: true,
      canRequestAds: false,
      privacyOptionsRequirementStatus: 'REQUIRED',
    }),
    showConsentForm: async () => info({
      status: 'OBTAINED',
      isConsentFormAvailable: true,
      canRequestAds: true,
      privacyOptionsRequirementStatus: 'REQUIRED',
    }),
  });
  const gate = gateFor(admob);
  const result = await completeNativeLaunch(admob, gate, {
    umpPresentsAtt: false,
    afterTracking: async () => {
      gameCenter += 1;
    },
  });
  assert.equal(result.consent.formShown, true);
  assert.equal(result.consent.canRequestAds, true);
  assert.equal(result.tracking.requested, true);
  assert.equal(gameCenter, 1);
  assert.equal(result.ads.bannerVisible, true);
  assert.equal(gate.snapshot().initCount, 1);
  const order = admob.calls;
  assert.ok(order.indexOf('showConsentForm') < order.indexOf('requestTrackingAuthorization'));
  assert.ok(order.indexOf('requestTrackingAuthorization') < order.indexOf('initialize'));
  assert.ok(order.indexOf('initialize') < order.indexOf('showBanner'));
  assert.equal(order.filter((name) => name === 'requestTrackingAuthorization').length, 1);
  assert.equal(order.includes('resetConsentInfo'), false);
  assert.equal(order.includes('prepareRewardVideoAd'), false);
});

test('NOT_REQUIRED with canRequestAds true skips the form and still asks ATT once before Game Center', async () => {
  const marks = [];
  const admob = fakeAdMob({
    requestConsentInfo: async () => info({ status: 'NOT_REQUIRED', canRequestAds: true }),
    trackingAuthorizationStatus: async () => ({ status: 'notDetermined' }),
  });
  const gate = gateFor(admob);
  await completeNativeLaunch(admob, gate, {
    umpPresentsAtt: false,
    afterTracking: async () => {
      marks.push('game-center');
    },
  });
  assert.equal(admob.calls.includes('showConsentForm'), false);
  assert.ok(admob.calls.indexOf('requestTrackingAuthorization') < admob.calls.length);
  assert.deepEqual(marks, ['game-center']);
  const attAt = admob.calls.indexOf('requestTrackingAuthorization');
  const initAt = admob.calls.indexOf('initialize');
  assert.ok(attAt !== -1 && attAt < initAt);
  assert.equal(gate.snapshot().initCount, 1);
});

test('prior consent that is already OBTAINED can request ads without another form', async () => {
  const admob = fakeAdMob({
    requestConsentInfo: async () => info({
      status: 'OBTAINED',
      isConsentFormAvailable: true,
      canRequestAds: true,
      privacyOptionsRequirementStatus: 'REQUIRED',
    }),
    trackingAuthorizationStatus: async () => ({ status: 'authorized' }),
  });
  const gate = gateFor(admob);
  const result = await completeNativeLaunch(admob, gate, { umpPresentsAtt: false, afterTracking: async () => {} });
  assert.equal(result.consent.formShown, false);
  assert.equal(result.consent.canRequestAds, true);
  assert.equal(result.tracking.requested, false);
  assert.equal(result.tracking.skipped, 'already-determined');
  assert.equal(admob.calls.includes('showConsentForm'), false);
  assert.equal(admob.calls.includes('requestTrackingAuthorization'), false);
  assert.equal(gate.snapshot().bannerVisible, true);
});

test('a consent info failure never throws, blocks ads, and still reaches Game Center', async () => {
  let gameCenter = 0;
  const admob = fakeAdMob({
    requestConsentInfo: async () => {
      throw new Error('offline');
    },
  });
  const gate = gateFor(admob);
  const result = await completeNativeLaunch(admob, gate, {
    umpPresentsAtt: false,
    afterTracking: async () => {
      gameCenter += 1;
    },
  });
  assert.equal(result.consent.canRequestAds, false);
  assert.equal(result.consent.error.message, 'offline');
  assert.equal(gameCenter, 1);
  assert.equal(gate.snapshot().initCount, 0);
  assert.equal(admob.calls.includes('initialize'), false);
  assert.equal(admob.calls.includes('showBanner'), false);
  assert.equal(await gate.showRewarded(), false);
  assert.equal(admob.calls.includes('prepareRewardVideoAd'), false);
});

test('a form failure fails closed unless a later read confirms canRequestAds', async () => {
  let reads = 0;
  const denied = fakeAdMob({
    requestConsentInfo: async () => {
      reads += 1;
      if (reads === 1) {
        return info({ status: 'REQUIRED', isConsentFormAvailable: true, canRequestAds: false });
      }
      throw new Error('still offline');
    },
    showConsentForm: async () => {
      throw new Error('form failed');
    },
  });
  const closed = await gatherConsent(denied);
  assert.equal(closed.canRequestAds, false);
  assert.equal(closed.formShown, true);
  assert.equal(closed.error.message, 'still offline');

  let reads2 = 0;
  const recovered = fakeAdMob({
    requestConsentInfo: async () => {
      reads2 += 1;
      if (reads2 === 1) {
        return info({ status: 'REQUIRED', isConsentFormAvailable: true, canRequestAds: false });
      }
      return info({ status: 'OBTAINED', canRequestAds: true, privacyOptionsRequirementStatus: 'REQUIRED' });
    },
    showConsentForm: async () => {
      throw new Error('form failed');
    },
  });
  const open = await gatherConsent(recovered);
  assert.equal(open.canRequestAds, true);
  assert.equal(open.error, null);
});

test('false consent does not initialize, and rewarded uses the same gate', async () => {
  const admob = fakeAdMob({});
  const gate = gateFor(admob);
  gate.apply({ canRequestAds: false, privacyOptionsRequired: true });
  await gate.syncBanner();
  assert.equal(await gate.showRewarded(), false);
  assert.equal(gate.snapshot().initCount, 0);
  assert.equal(admob.calls.includes('initialize'), false);
  assert.equal(admob.calls.includes('showBanner'), false);
  assert.equal(admob.calls.includes('prepareRewardVideoAd'), false);
});

test('concurrent banner and rewarded initialization runs once', async () => {
  let started = 0;
  const admob = fakeAdMob({
    initialize: () => new Promise((resolve) => {
      started += 1;
      setTimeout(resolve, 30);
    }),
  });
  const gate = gateFor(admob);
  gate.apply({ canRequestAds: true, privacyOptionsRequired: false });
  const [banner, reward, again] = await Promise.all([
    gate.syncBanner(),
    gate.showRewarded(),
    gate.syncBanner(),
  ]);
  assert.equal(started, 1);
  assert.equal(gate.snapshot().initCount, 1);
  assert.equal(banner.bannerVisible, true);
  assert.equal(again.bannerVisible, true);
  assert.equal(reward, true);
  assert.equal(admob.calls.filter((name) => name === 'initialize').length, 1);
  assert.equal(admob.calls.filter((name) => name === 'showBanner').length, 1);
  assert.equal(admob.calls.filter((name) => name === 'prepareRewardVideoAd').length, 1);
});

test('privacy settings reopen the form only when required, then recheck ads', async () => {
  let phase = 'before';
  const admob = fakeAdMob({
    requestConsentInfo: async () => {
      if (phase === 'before') {
        return info({
          status: 'OBTAINED',
          canRequestAds: true,
          privacyOptionsRequirementStatus: 'REQUIRED',
        });
      }
      return info({
        status: 'OBTAINED',
        canRequestAds: false,
        privacyOptionsRequirementStatus: 'REQUIRED',
      });
    },
    showPrivacyOptionsForm: async () => {
      phase = 'after';
    },
  });
  const gate = gateFor(admob);
  gate.apply({ canRequestAds: true, privacyOptionsRequired: true });
  await gate.syncBanner();
  assert.equal(gate.snapshot().bannerVisible, true);
  const result = await gate.openPrivacySettings();
  assert.equal(result.shown, true);
  assert.equal(result.canRequestAds, false);
  assert.equal(gate.snapshot().bannerVisible, false);
  assert.equal(admob.calls.includes('removeBanner'), true);
  assert.equal(await gate.showRewarded(), false);
  const prepareAfter = admob.calls.filter((name) => name === 'prepareRewardVideoAd').length;
  assert.equal(prepareAfter, 0);
});

test('privacy settings do not open the form when it is not required', async () => {
  const admob = fakeAdMob({
    requestConsentInfo: async () => info({
      status: 'NOT_REQUIRED',
      canRequestAds: true,
      privacyOptionsRequirementStatus: 'NOT_REQUIRED',
    }),
    showPrivacyOptionsForm: async () => {
      throw new Error('form should stay closed');
    },
  });
  const gate = gateFor(admob);
  gate.apply({ canRequestAds: true, privacyOptionsRequired: false });
  await gate.syncBanner();
  const result = await gate.openPrivacySettings();
  assert.equal(result.shown, false);
  assert.equal(result.canRequestAds, true);
  assert.equal(admob.calls.includes('showPrivacyOptionsForm'), false);
  assert.equal(gate.snapshot().bannerVisible, true);
});

test('a privacy form failure rechecks and does not leave ads running on an unknown result', async () => {
  let reads = 0;
  const admob = fakeAdMob({
    requestConsentInfo: async () => {
      reads += 1;
      if (reads === 1) {
        return info({ canRequestAds: true, privacyOptionsRequirementStatus: 'REQUIRED', status: 'OBTAINED' });
      }
      return { status: 'UNKNOWN' };
    },
    showPrivacyOptionsForm: async () => {
      throw new Error('unable to present');
    },
  });
  const gate = gateFor(admob);
  gate.apply({ canRequestAds: true, privacyOptionsRequired: true });
  await gate.syncBanner();
  const result = await gate.openPrivacySettings();
  assert.equal(result.shown, false);
  assert.equal(result.canRequestAds, false);
  assert.ok(result.error);
  assert.equal(gate.snapshot().bannerVisible, false);
  assert.equal(admob.calls.includes('removeBanner'), true);
});

test('UMP IDFA ownership suppresses the manual ATT prompt', async () => {
  const admob = fakeAdMob({
    trackingAuthorizationStatus: async () => ({ status: 'notDetermined' }),
  });
  const tracking = await requestTrackingIfNeeded(admob, true);
  assert.equal(tracking.requested, false);
  assert.equal(tracking.skipped, 'ump-idfa-message');
  assert.deepEqual(admob.calls, []);
  const launch = await runLaunchPrivacy(admob, {
    umpPresentsAtt: true,
    afterTracking: async () => {},
  });
  assert.equal(launch.tracking.requested, false);
  assert.equal(admob.calls.includes('requestTrackingAuthorization'), false);
});

test('the bridge keeps one ATT call, one initialize, and never resets consent', () => {
  const src = readFileSync(new URL('./native-bridge.js', import.meta.url), 'utf8');
  assert.match(src, /const UMP_PRESENTS_ATT = false/);
  assert.equal((src.match(/AdMob\.requestTrackingAuthorization/g) || []).length, 1);
  assert.equal((src.match(/AdMob\.initialize/g) || []).length, 1);
  assert.equal((src.match(/AdMob\.showBanner/g) || []).length, 1);
  assert.equal((src.match(/AdMob\.prepareRewardVideoAd/g) || []).length, 1);
  assert.equal(src.includes('resetConsentInfo'), false);
  assert.match(src, /completeNativeLaunch/);
  assert.match(src, /Privacy \/ Ad Settings|privacyBtn/);
});
