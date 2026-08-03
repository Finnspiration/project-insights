// Run with: deno test supabase/functions/_shared/subscription.test.ts
//
// The paid tier has been spelled both 'pro' and 'professional' in this
// codebase, which is how the dashboard ended up showing paying users the free
// allowance of 20. Both spellings must resolve to the same limit, and this
// table must stay in sync with public.ai_message_limit() in the database.

import { assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts';
import {
  aiMessageLimit,
  formatAiMessageLimit,
  formatAiMessagesRemaining,
  isUnlimitedTier,
} from './subscription.ts';

Deno.test('both spellings of the paid tier get the same allowance', () => {
  assertEquals(aiMessageLimit('pro'), 500);
  assertEquals(aiMessageLimit('professional'), 500);
  assertEquals(aiMessageLimit('Professional'), 500);
});

Deno.test('free and unknown tiers get the free allowance', () => {
  assertEquals(aiMessageLimit('free'), 20);
  assertEquals(aiMessageLimit('gold'), 20);
  assertEquals(aiMessageLimit(null), 20);
  assertEquals(aiMessageLimit(undefined), 20);
});

Deno.test('team and enterprise are unlimited', () => {
  assertEquals(isUnlimitedTier('team'), true);
  assertEquals(isUnlimitedTier('enterprise'), true);
  assertEquals(isUnlimitedTier('professional'), false);
  assertEquals(formatAiMessageLimit('team'), '∞');
});

Deno.test('remaining is clamped at zero and shows infinity for unlimited tiers', () => {
  assertEquals(formatAiMessagesRemaining('free', 25), '0');
  assertEquals(formatAiMessagesRemaining('free', 5), '15');
  assertEquals(formatAiMessagesRemaining('pro', 100), '400');
  assertEquals(formatAiMessagesRemaining('team', 9999), '∞');
  assertEquals(formatAiMessagesRemaining('free', null), '20');
});
