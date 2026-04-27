import { NextRequest, NextResponse } from 'next/server';

const VIDEO_ID_REGEX = /^[a-zA-Z0-9_-]{11}$/;
const WATCH_URL_BASE = 'https://www.youtube.com/watch';

const secondsToMinutes = (seconds: number): number => Math.max(1, Math.ceil(seconds / 60));

const extractVideoLengthSeconds = (html: string): number | null => {
  const lengthSecondsMatch = html.match(/"lengthSeconds":"(\d+)"/);
  if (lengthSecondsMatch?.[1]) {
    const value = Number.parseInt(lengthSecondsMatch[1], 10);
    return Number.isFinite(value) ? value : null;
  }

  const approxDurationMsMatch = html.match(/"approxDurationMs":"(\d+)"/);
  if (approxDurationMsMatch?.[1]) {
    const milliseconds = Number.parseInt(approxDurationMsMatch[1], 10);
    if (Number.isFinite(milliseconds)) {
      return Math.ceil(milliseconds / 1000);
    }
  }

  return null;
};

export async function GET(request: NextRequest) {
  const videoId = request.nextUrl.searchParams.get('videoId')?.trim() ?? '';

  if (!VIDEO_ID_REGEX.test(videoId)) {
    return NextResponse.json({ error: 'Invalid videoId' }, { status: 400 });
  }

  try {
    const watchUrl = `${WATCH_URL_BASE}?v=${videoId}&hl=en`;
    const response = await fetch(watchUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      },
      next: { revalidate: 86400 },
    });

    if (!response.ok) {
      return NextResponse.json({ durationMinutes: null }, { status: 502 });
    }

    const html = await response.text();
    const lengthSeconds = extractVideoLengthSeconds(html);

    if (!lengthSeconds) {
      return NextResponse.json({ durationMinutes: null }, { status: 404 });
    }

    return NextResponse.json(
      { durationMinutes: secondsToMinutes(lengthSeconds) },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800',
        },
      }
    );
  } catch {
    return NextResponse.json({ durationMinutes: null }, { status: 500 });
  }
}

