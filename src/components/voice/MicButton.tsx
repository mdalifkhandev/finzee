import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, Loader2 } from 'lucide-react';
import { AudioRecorder, requestMicrophonePermission, isMicrophoneSupported } from '@/lib/voice/recorder';
import { cn } from '@/lib/utils';

interface MicButtonProps {
  onAudioReady: (blob: Blob) => void;
  disabled?: boolean;
  className?: string;
}

export function MicButton({ onAudioReady, disabled, className }: MicButtonProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const recorderRef = useRef<AudioRecorder | null>(null);
  const animationFrameRef = useRef<number>();

  // Check microphone support on mount
  useEffect(() => {
    if (!isMicrophoneSupported()) {
      setHasPermission(false);
    }
  }, []);

  const updateAudioLevel = useCallback(() => {
    if (recorderRef.current && isRecording) {
      const level = recorderRef.current.getAudioLevel();
      setAudioLevel(level);
      animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
    }
  }, [isRecording]);

  const startRecording = async () => {
    try {
      // Request permission if not checked yet
      if (hasPermission === null) {
        const granted = await requestMicrophonePermission();
        setHasPermission(granted);
        if (!granted) return;
      } else if (hasPermission === false) {
        return;
      }

      recorderRef.current = new AudioRecorder();
      await recorderRef.current.start();
      setIsRecording(true);
      
      // Start audio level monitoring
      animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
    } catch (error) {
      console.error('Failed to start recording:', error);
      setHasPermission(false);
    }
  };

  const stopRecording = async () => {
    if (!recorderRef.current) return;

    // Stop audio level monitoring
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    setAudioLevel(0);

    try {
      setIsProcessing(true);
      const audioBlob = await recorderRef.current.stop();
      setIsRecording(false);
      onAudioReady(audioBlob);
    } catch (error) {
      console.error('Failed to stop recording:', error);
    } finally {
      setIsProcessing(false);
      recorderRef.current = null;
    }
  };

  const handleClick = () => {
    if (isProcessing) return;
    
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (recorderRef.current?.getIsRecording()) {
        recorderRef.current.stop();
      }
    };
  }, []);

  if (hasPermission === false) {
    return (
      <Button
        type="button"
        size="icon"
        variant="ghost"
        disabled
        className={cn('h-8 w-8 rounded-full opacity-50', className)}
        title="Microphone access denied"
      >
        <Mic className="h-4 w-4" />
      </Button>
    );
  }

  return (
    <Button
      type="button"
      size="icon"
      variant="ghost"
      onClick={handleClick}
      disabled={disabled || isProcessing}
      className={cn(
        'h-8 w-8 rounded-full transition-all',
        isRecording && 'bg-red-500/20 text-red-500 animate-pulse',
        className
      )}
      title={isRecording ? 'Stop recording' : 'Start recording'}
    >
      {isProcessing ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Mic className={cn('h-4 w-4', isRecording && 'text-red-500')} />
      )}
      
      {/* Audio level indicator */}
      {isRecording && (
        <span
          className="absolute inset-0 rounded-full border-2 border-red-500 opacity-50"
          style={{
            transform: `scale(${1 + audioLevel * 0.5})`,
            transition: 'transform 0.1s ease-out',
          }}
        />
      )}
    </Button>
  );
}
