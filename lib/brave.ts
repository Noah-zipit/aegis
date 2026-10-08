/**
 * Brave Search API client — https://brave.com/search/api/
 * Free tier: 2,000 queries/month. The key lives in Settings (localStorage);
 * it is sent only to api.search.brave.com, never anywhere else.
 */

export interface BraveWebResult {
  title: string;
  url: string;
  description: string;
  page_age?: string;
}

export async function braveWebSearch(
  query: string,
  apiKey: string,
  opts?: { count?: number; offset?: number }
): Promise<{ results: BraveWebResult[]; query: string }> {
  const params = new URLSearchParams({
    q: query,
    count: String(opts?.count ?? 10),
    offset: String(opts?.offset ?? 0),
    safesearch: "moderate",
    text_decorations: "0",
  });
  const res = await fetch(
    `https://api.search.brave.com/res/v1/web/search?${params.toString()}`,
    {
      headers: {
        Accept: "application/json",
        "X-Subscription-Token": apiKey,
      },
    }
  );
  if (res.status === 401 || res.status === 403) {
    throw new Error(
      "Brave rejected the API key (401/403). Check the key in Settings → Search."
    );
  }
  if (res.status === 429) {
    throw new Error(
      "Brave rate limit reached (429). The free tier allows 2,000 queries/month."
    );
  }
  if (!res.ok) {
    throw new Error(`Brave Search failed (HTTP ${res.status}).`);
  }
  const data = await res.json();
  const results: BraveWebResult[] = (data?.web?.results ?? []).map(
    (r: Record<string, unknown>) => ({
      title: String(r.title ?? ""),
      url: String(r.url ?? ""),
      description: String(r.description ?? ""),
      page_age: typeof r.page_age === "string" ? r.page_age : undefined,
    })
  );
  return { results, query: data?.query?.original ?? query };
}
