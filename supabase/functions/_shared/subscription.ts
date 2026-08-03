// Subscription tiers and the AI message allowance that comes with them.
//
// Shared by the frontend (`@shared/subscription.ts`) and the edge functions
// (`../_shared/subscription.ts`). The database function
// public.ai_message_limit() mirrors this table and is the authority at write
// time; this copy exists so the UI can show the right number without a
// round-trip. Keep the two in sync.
//
// 'pro' and 'professional' are both accepted because the app has spelled the
// paid tier both ways — the dashboard said 'pro' while settings and the
// backend said 'professional', so professional users were shown the free
// allowance of 20.

export const UNLIMITED_AI_MESSAGES = Number.MAX_SAFE_INTEGER;

const AI_MESSAGE_LIMITS: Record<string, number> = {
  free: 20,
  pro: 500,
  professional: 500,
  team: UNLIMITED_AI_MESSAGES,
  enterprise: UNLIMITED_AI_MESSAGES,
};

/** Monthly AI message allowance for a subscription tier. Unknown tiers get the free allowance. */
export function aiMessageLimit(tier: string | null | undefined): number {
  return AI_MESSAGE_LIMITS[(tier ?? 'free').toLowerCase()] ?? AI_MESSAGE_LIMITS.free;
}

export function isUnlimitedTier(tier: string | null | undefined): boolean {
  return aiMessageLimit(tier) === UNLIMITED_AI_MESSAGES;
}

/** Limit formatted for display: '∞' for unlimited tiers. */
export function formatAiMessageLimit(tier: string | null | undefined): string {
  return isUnlimitedTier(tier) ? '∞' : String(aiMessageLimit(tier));
}

/** Messages left this month, or '∞'. Never negative. */
export function formatAiMessagesRemaining(
  tier: string | null | undefined,
  used: number | null | undefined,
): string {
  if (isUnlimitedTier(tier)) return '∞';
  return String(Math.max(0, aiMessageLimit(tier) - (used ?? 0)));
}
