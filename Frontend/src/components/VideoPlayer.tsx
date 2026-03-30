'use client';
import { useEffect, useRef, useCallback } from 'react';

interface VideoPlayerProps {
  videoId: string;
  onProgress?: (percent: number) => void;
  onComplete?: () => void;
}

interface YouTubePlayer {
  playVideo: () => void;
  pauseVideo: () => void;
  destroy: () => void;
  getCurrentTime: () => number;
  getDuration: () => number;
  addEventListener: (event: string, listener: () => void) => void;
}

declare global {
  interface Window {
    YT: {
      Player: new (elementId: string, config: Record<string, unknown>) => YouTubePlayer;
      PlayerState: {
        PLAYING: number;
        PAUSED: number;
        ENDED: number;
      };
    };
    onYouTubeIframeAPIReady: () => void;
  }
}

export default function VideoPlayer({ videoId, onProgress, onComplete }: VideoPlayerProps) {
  const playerRef = useRef<YouTubePlayer | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const handleProgress = useCallback((percent: number) => {
    onProgress?.(percent);
  }, [onProgress]);

  const handleComplete = useCallback(() => {
    onComplete?.();
  }, [onComplete]);

  useEffect(() => {
    if (!videoId) return;

    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    const firstScript = document.getElementsByTagName('script')[0];
    firstScript.parentNode?.insertBefore(tag, firstScript);

    window.onYouTubeIframeAPIReady = () => {
      if (!window.YT) return;
      
      playerRef.current = new window.YT.Player('yt-player', {
        videoId,
        playerVars: {
          rel: 0,
          modestbranding: 1,
          iv_load_policy: 3,
          color: 'white',
        },
        events: {
          onStateChange: (event: { data: number }) => {
            const YT = window.YT;
            if (!YT || !playerRef.current) return;
            
            if (event.data === YT.PlayerState.PLAYING) {
              intervalRef.current = setInterval(() => {
                const current = playerRef.current?.getCurrentTime();
                const total = playerRef.current?.getDuration();
                if (total && total > 0 && current !== undefined) {
                  const pct = Math.round((current / total) * 100);
                  handleProgress(pct);
                  if (pct >= 90) handleComplete();
                }
              }, 5000);
            } else {
              if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
              }
            }
            if (event.data === YT.PlayerState.ENDED) {
              handleComplete();
            }
          },
        },
      });
    };

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      playerRef.current?.destroy();
    };
  }, [videoId, handleProgress, handleComplete]);

  if (!videoId) {
    return (
      <div className="aspect-video bg-[#18181F] rounded-xl flex items-center justify-center">
        <p className="text-[#7A7570] text-sm">Видео байхгүй байна</p>
      </div>
    );
  }

  return (
    <div className="aspect-video rounded-xl overflow-hidden bg-black" ref={containerRef}>
      <div id="yt-player" className="w-full h-full" />
    </div>
  );
}
