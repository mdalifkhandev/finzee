import React, { useRef, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Volume2, VolumeX, Pause, Play } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AudioPlayerProps {
  audioContent: string; // URL (blob: or data:) to audio
  onComplete?: () => void;
  autoPlay?: boolean;
  className?: string;
}

export function AudioPlayer({ audioContent, onComplete, autoPlay = true, className }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    if (!audioContent) return;

    // Use the URL directly (blob: URL from speak() function)
    audioRef.current = new Audio(audioContent);
    
    audioRef.current.onplay = () => setIsPlaying(true);
    audioRef.current.onpause = () => setIsPlaying(false);
    audioRef.current.onended = () => {
      setIsPlaying(false);
      onComplete?.();
    };

    if (autoPlay) {
      audioRef.current.play().catch(console.error);
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [audioContent, autoPlay, onComplete]);

  const togglePlayPause = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(console.error);
    }
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    
    audioRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const stop = () => {
    if (!audioRef.current) return;
    
    audioRef.current.pause();
    audioRef.current.currentTime = 0;
    setIsPlaying(false);
    onComplete?.();
  };

  if (!audioContent) return null;

  return (
    <div className={cn('flex items-center gap-1', className)}>
      <Button
        type="button"
        size="icon"
        variant="ghost"
        onClick={togglePlayPause}
        className="h-6 w-6"
      >
        {isPlaying ? (
          <Pause className="h-3 w-3" />
        ) : (
          <Play className="h-3 w-3" />
        )}
      </Button>
      
      <Button
        type="button"
        size="icon"
        variant="ghost"
        onClick={toggleMute}
        className="h-6 w-6"
      >
        {isMuted ? (
          <VolumeX className="h-3 w-3" />
        ) : (
          <Volume2 className="h-3 w-3" />
        )}
      </Button>

      {isPlaying && (
        <div className="flex items-center gap-0.5">
          <span className="h-2 w-0.5 animate-pulse bg-primary" style={{ animationDelay: '0ms' }} />
          <span className="h-3 w-0.5 animate-pulse bg-primary" style={{ animationDelay: '150ms' }} />
          <span className="h-2 w-0.5 animate-pulse bg-primary" style={{ animationDelay: '300ms' }} />
        </div>
      )}
    </div>
  );
}
