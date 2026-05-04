import { track } from './analytics';

function getOrAssignSession(key: string, a: string, b: string): string {
  if (typeof window === 'undefined') return a;
  try {
    const cur = sessionStorage.getItem(key);
    if (cur === a || cur === b) return cur;
    const v = Math.random() < 0.5 ? a : b;
    sessionStorage.setItem(key, v);
    track('experiment_assign', { experiment: key, variant: v });
    return v;
  } catch {
    return a;
  }
}

/** A/B headline on hero paywall (premium unlock strip). */
export function getPaywallCopyVariant(): 'control' | 'explicit_price' {
  return getOrAssignSession('exp_paywall_copy_v1', 'control', 'explicit_price') as
    | 'control'
    | 'explicit_price';
}

/** Chapter bundle framing copy. */
export function getChapterFrameVariant(): 'chapters' | 'progression' {
  return getOrAssignSession('exp_chapter_frame_v1', 'chapters', 'progression') as
    | 'chapters'
    | 'progression';
}

/** Checkout reassurance microcopy. */
export function getCheckoutTrustVariant(): 'control' | 'expanded' {
  return getOrAssignSession('exp_checkout_trust_v1', 'control', 'expanded') as
    | 'control'
    | 'expanded';
}

/** Free-tier clarity on creator step 1 (plan test C). */
export function getCreatorLimitHintVariant(): 'control' | 'prominent' {
  return getOrAssignSession('exp_creator_limit_v1', 'control', 'prominent') as
    | 'control'
    | 'prominent';
}
