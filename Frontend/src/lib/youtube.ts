const VIDEO_ID_REGEX = /^[a-zA-Z0-9_-]{11}$/;
const durationCache = new Map<string, number | null>();

interface YouTubeDurationResponse {
  durationMinutes?: number | null;
}

export function normalizeYouTubeVideoId(value: string): string {
  const normalizedValue = value.trim();

  if (!normalizedValue) {
    return '';
  }

  if (VIDEO_ID_REGEX.test(normalizedValue)) {
    return normalizedValue;
  }

  try {
    const url = new URL(normalizedValue);

    if (url.hostname.includes('youtu.be')) {
      const shortId = url.pathname.replace(/^\/+/, '').split('/')[0] || '';
      return VIDEO_ID_REGEX.test(shortId) ? shortId : normalizedValue;
    }

    if (url.hostname.includes('youtube.com')) {
      const watchId = url.searchParams.get('v') || '';
      if (VIDEO_ID_REGEX.test(watchId)) {
        return watchId;
      }

      const pathId = url.pathname.split('/').filter(Boolean).pop() || '';
      return VIDEO_ID_REGEX.test(pathId) ? pathId : normalizedValue;
    }
  } catch {
    return normalizedValue;
  }

  return normalizedValue;
}

export async function getYouTubeDuration(
  videoId: string
): Promise<number | null> {
  const normalizedVideoId = normalizeYouTubeVideoId(videoId);

  if (!VIDEO_ID_REGEX.test(normalizedVideoId)) {
    return null;
  }

  if (durationCache.has(normalizedVideoId)) {
    return durationCache.get(normalizedVideoId) ?? null;
  }

  try {
    const response = await fetch(
      `/api/youtube/duration?videoId=${encodeURIComponent(normalizedVideoId)}`
    );

    if (!response.ok) {
      durationCache.set(normalizedVideoId, null);
      return null;
    }

    const payload = (await response.json()) as YouTubeDurationResponse;
    const durationMinutes = payload.durationMinutes;

    if (
      typeof durationMinutes !== 'number' ||
      !Number.isFinite(durationMinutes) ||
      durationMinutes <= 0
    ) {
      durationCache.set(normalizedVideoId, null);
      return null;
    }

    const roundedDuration = Math.max(1, Math.round(durationMinutes));
    durationCache.set(normalizedVideoId, roundedDuration);
    return roundedDuration;
  } catch {
    durationCache.set(normalizedVideoId, null);
    return null;
  }
}
