const VIDEO_ID_REGEX = /^[a-zA-Z0-9_-]{11}$/;
const durationCache = new Map<string, number | null>();

interface YouTubeDurationResponse {
  durationMinutes?: number | null;
}

export async function getYouTubeDuration(
  videoId: string
): Promise<number | null> {
  const normalizedVideoId = videoId.trim();

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
