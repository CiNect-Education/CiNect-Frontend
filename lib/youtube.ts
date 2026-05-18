const YOUTUBE_ID_RE = /^[\w-]{11}$/;

/** Accepts full YouTube URL or bare 11-char video id. */
export function parseYoutubeVideoId(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  if (YOUTUBE_ID_RE.test(trimmed)) return trimmed;

  try {
    const url = trimmed.startsWith("http") ? new URL(trimmed) : new URL(`https://${trimmed}`);
    const host = url.hostname.replace(/^www\./, "");

    if (host === "youtu.be") {
      const id = url.pathname.split("/").filter(Boolean)[0];
      return id && YOUTUBE_ID_RE.test(id) ? id : null;
    }

    if (host === "youtube.com" || host === "m.youtube.com" || host === "music.youtube.com") {
      const fromQuery = url.searchParams.get("v");
      if (fromQuery && YOUTUBE_ID_RE.test(fromQuery)) return fromQuery;

      const fromPath = url.pathname.match(/\/(?:embed|shorts|live)\/([\w-]{11})/);
      if (fromPath?.[1]) return fromPath[1];
    }
  } catch {
    return null;
  }

  return null;
}

export function youtubeWatchUrl(videoId: string): string {
  return `https://youtu.be/${videoId}`;
}

export function youtubeEmbedUrl(
  videoId: string,
  options?: { autoplay?: boolean },
): string {
  const params = new URLSearchParams({
    rel: "0",
    modestbranding: "1",
    ...(options?.autoplay ? { autoplay: "1", playsinline: "1" } : {}),
  });
  // Use youtube.com (allowed in CSP); nocookie is optional privacy mode.
  return `https://www.youtube.com/embed/${videoId}?${params.toString()}`;
}
