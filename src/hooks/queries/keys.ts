/**
 * Query keys for react-query.
 *
 * Kept in one place so an invalidation can never miss a cache entry because
 * two files spelled the same key differently. Hierarchical by design:
 * invalidating `projectKeys.detail(id)` also matches its documents and blind
 * spots, and `projectKeys.all` matches everything project-related.
 */
export const projectKeys = {
  all: ['projects'] as const,
  lists: () => [...projectKeys.all, 'list'] as const,
  list: (userId: string | undefined) => [...projectKeys.lists(), userId] as const,
  details: () => [...projectKeys.all, 'detail'] as const,
  detail: (projectId: string | undefined) => [...projectKeys.details(), projectId] as const,
  documents: (projectId: string | undefined) => [...projectKeys.detail(projectId), 'documents'] as const,
  blindSpots: (projectId: string | undefined) => [...projectKeys.detail(projectId), 'blindSpots'] as const,
  dnaHistory: (projectId: string | undefined) => [...projectKeys.detail(projectId), 'dnaHistory'] as const,
};

export const profileKeys = {
  all: ['profile'] as const,
  detail: (userId: string | undefined) => [...profileKeys.all, userId] as const,
};

export const portfolioKeys = {
  all: ['portfolio'] as const,
  detail: (userId: string | undefined) => [...portfolioKeys.all, userId] as const,
};
