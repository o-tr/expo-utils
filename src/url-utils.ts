export function rewriteUrlIfNeeded(url: string): string {
  if (url.match(/https:\/\/ticket\.expo2025\.or\.jp\/api\/d\/events\?.*limit=\d+.*/)) {
    return url.replace(
      /https:\/\/ticket\.expo2025\.or\.jp\/api\/d\/events\?(.*)limit=\d+(.*)/,
      'https://ticket.expo2025.or.jp/api/d/events?$1limit=100$2'
    );
  }
  return url;
}