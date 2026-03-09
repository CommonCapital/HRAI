// app/(dashboard)/(privateRoutes)/attendees/params.ts
//
// Only used by page.tsx (server component) for SSR prefetching.
// The client view (attendees-view.tsx) defines its own parsers inline
// to avoid import-chain type resolution issues with useQueryState.

import { createSearchParamsCache, parseAsInteger, parseAsString } from "nuqs/server";

export const loadAttendeesParams = createSearchParamsCache({
  jobId:  parseAsString.withDefault(""),
  page:   parseAsInteger.withDefault(1),
  search: parseAsString.withDefault(""),
  status: parseAsString.withDefault(""),
});