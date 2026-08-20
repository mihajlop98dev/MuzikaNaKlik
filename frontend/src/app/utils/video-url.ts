/**
 * Single place that decides what a pasted video link is.
 *
 * Was three copies of one narrow YouTube regex (registration, add-video,
 * profile). Beyond the duplication it mishandled the link YouTube's own Share
 * button produces — `youtu.be/<id>?si=...` — because it captured everything up
 * to `&`, so the `?si=` tracking parameter ended up inside the id and the embed
 * URL silently pointed nowhere. Shorts and live links were rejected outright.
 *
 * Non-YouTube platforms resolve to a link card rather than a player: Instagram,
 * TikTok and Facebook embeds require the platform's own script, which loads
 * third-party cookies and drags a consent obligation along with it.
 */

export type VideoLink =
  | { kind: 'youtube'; id: string; embedUrl: string; url: string }
  | { kind: 'link'; platform: string | null; label: string; url: string }
  | null;

/** YouTube ids are exactly 11 chars from a fixed alphabet. */
const YT_ID = /^[A-Za-z0-9_-]{11}$/;

const YT_PATTERNS = [
  /youtube\.com\/watch\?(?:.*&)?v=([^&?#/\s]+)/i,
  /youtu\.be\/([^&?#/\s]+)/i,
  /youtube\.com\/shorts\/([^&?#/\s]+)/i,
  /youtube\.com\/live\/([^&?#/\s]+)/i,
  /youtube\.com\/embed\/([^&?#/\s]+)/i,
  /youtube\.com\/v\/([^&?#/\s]+)/i,
];

/**
 * `locative` is the form the name takes after "na" in Serbian — "na Instagramu",
 * not "na Instagram". Built into the table rather than derived, because the
 * ending depends on how each name ends and X needs a hyphen.
 */
const PLATFORMS: Array<{ test: RegExp; label: string; locative: string }> = [
  { test: /(?:^|\.)instagram\.com\//i, label: 'Instagram', locative: 'Instagramu' },
  { test: /(?:^|\.)tiktok\.com\//i, label: 'TikTok', locative: 'TikToku' },
  { test: /(?:^|\.)facebook\.com\//i, label: 'Facebook', locative: 'Facebooku' },
  { test: /(?:^|\.)fb\.watch\//i, label: 'Facebook', locative: 'Facebooku' },
  { test: /(?:^|\.)vimeo\.com\//i, label: 'Vimeo', locative: 'Vimeu' },
  { test: /(?:^|\.)dailymotion\.com\//i, label: 'Dailymotion', locative: 'Dailymotionu' },
  { test: /(?:^|\.)twitch\.tv\//i, label: 'Twitch', locative: 'Twitchu' },
  { test: /(?:^|\.)soundcloud\.com\//i, label: 'SoundCloud', locative: 'SoundCloudu' },
  { test: /(?:^|\.)x\.com\//i, label: 'X', locative: 'X-u' },
  { test: /(?:^|\.)twitter\.com\//i, label: 'X', locative: 'X-u' },
];

export function parseVideoUrl(raw: string): VideoLink {
  const url = (raw || '').trim();
  if (!url) return null;

  let parsed: URL;
  try {
    parsed = new URL(url.startsWith('http') ? url : `https://${url}`);
  } catch {
    return null;
  }

  // Only http(s) — blocks javascript: and data: from reaching an href/iframe.
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null;

  for (const pattern of YT_PATTERNS) {
    const id = url.match(pattern)?.[1];
    if (id && YT_ID.test(id)) {
      return {
        kind: 'youtube',
        id,
        embedUrl: `https://www.youtube.com/embed/${id}`,
        url: parsed.href,
      };
    }
  }

  const host = parsed.hostname;
  for (const { test, label, locative } of PLATFORMS) {
    if (test.test(host + '/')) {
      return {
        kind: 'link',
        platform: label,
        label: `Pogledaj na ${locative}`,
        url: parsed.href,
      };
    }
  }

  // Anything else that is still a valid http(s) address is kept as a plain
  // link — a performer's own site or an agency page is a legitimate answer to
  // "where can I see you play". No platform name to name, so the label drops
  // the preposition rather than reading "Pogledaj na Video".
  return { kind: 'link', platform: null, label: 'Pogledaj video', url: parsed.href };
}

export function isValidVideoUrl(raw: string): boolean {
  return parseVideoUrl(raw) !== null;
}
