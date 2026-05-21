import { useEffect, useRef, useState } from 'react';

interface ShowcaseVideoProps {
  src: string;
  className?: string;
}

/** Steam-style video: poster frame + large play button, audio on click. */
export function ShowcaseVideo({ src, className }: ShowcaseVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    setIsPlaying(false);
    const video = videoRef.current;
    if (!video) return;
    video.pause();
    video.currentTime = 0;
    video.muted = false;
  }, [src]);

  const handlePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = false;
    void video.play().then(() => setIsPlaying(true)).catch(() => {});
  };

  const handleVideoClick = () => {
    const video = videoRef.current;
    if (!video || !isPlaying) return;
    video.pause();
    setIsPlaying(false);
  };

  return (
    <div className="relative w-full h-full">
      <video
        ref={videoRef}
        key={src}
        src={src}
        className={className}
        playsInline
        preload="metadata"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => setIsPlaying(false)}
        onClick={handleVideoClick}
      />
      {!isPlaying && (
        <button
          type="button"
          onClick={handlePlay}
          className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/40 transition-colors cursor-pointer rounded"
          aria-label="Play video with sound"
        >
          <svg
            viewBox="0 0 48 48"
            className="w-[72px] h-[72px] text-white drop-shadow-lg"
            fill="currentColor"
            aria-hidden
          >
            <path d="M8 5v38l35-19L8 5z" />
          </svg>
        </button>
      )}
    </div>
  );
}
