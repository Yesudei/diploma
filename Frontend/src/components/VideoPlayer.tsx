'use client';

interface VideoPlayerProps {
  videoId: string;
  onProgress?: (percent: number) => void;
  onComplete?: () => void;
}

export default function VideoPlayer({ videoId, onComplete }: VideoPlayerProps) {
  if (!videoId) {
    return (
      <div className="aspect-video bg-[#18181F] rounded-xl flex items-center justify-center">
        <p className="text-[#7A7570] text-sm">Видео байхгүй байна</p>
      </div>
    );
  }

  return (
    <div className="aspect-video rounded-xl overflow-hidden bg-black">
      <iframe
        src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`}
        title="Video player"
        className="w-full h-full"
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        onEnded={() => onComplete?.()}
      />
    </div>
  );
}
