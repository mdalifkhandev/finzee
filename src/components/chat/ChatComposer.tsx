import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Send, Volume2, VolumeX, Loader2, Mic } from 'lucide-react';
import { transcribe } from '@/lib/ai/router';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { appConfig } from '@/config/app';

interface ChatComposerProps {
  onSend: (message: string) => void;
  isLoading?: boolean;
  voiceReplyEnabled: boolean;
  onVoiceReplyToggle: () => void;
  className?: string;
}

export function ChatComposer({
  onSend,
  isLoading = false,
  voiceReplyEnabled,
  onVoiceReplyToggle,
  className,
}: ChatComposerProps) {
  const [text, setText] = useState('');
  const [recording, setRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const recordingStartRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { toast } = useToast();

  const MIN_RECORDING_MS = 500; // Minimum 0.5 seconds

  // Timer effect for recording duration
  useEffect(() => {
    if (recording) {
      timerRef.current = setInterval(() => {
        setElapsedMs(Date.now() - recordingStartRef.current);
      }, 100);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setElapsedMs(0);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [recording]);

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const tenths = Math.floor((ms % 1000) / 100);
    return `${seconds}.${tenths}s`;
  };

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRef.current = rec;
      chunksRef.current = [];
      recordingStartRef.current = Date.now();
      
      rec.ondataavailable = (e) => e.data.size && chunksRef.current.push(e.data);
      rec.onstop = async () => {
        stream.getTracks().forEach(track => track.stop());
        
        const duration = Date.now() - recordingStartRef.current;
        if (duration < MIN_RECORDING_MS) {
          toast({
            title: 'Recording too short',
            description: 'Hold the mic button a bit longer to record.',
          });
          return;
        }
        
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        
        setIsTranscribing(true);
        try {
          const result = await transcribe(blob);
          if (result.text) {
            setText((prev) => prev ? `${prev} ${result.text}` : result.text);
          }
        } catch (error) {
          console.error('Transcription error:', error);
          toast({
            title: "Didn't catch that",
            description: 'Please try again or type your message.',
            variant: 'destructive',
          });
        } finally {
          setIsTranscribing(false);
        }
      };
      
      rec.start();
      setRecording(true);
    } catch (error) {
      console.error('Microphone error:', error);
      toast({
        title: 'Microphone access required',
        description: 'Please enable microphone access to use voice input.',
        variant: 'destructive',
      });
    }
  }

  function stopRecording() {
    mediaRef.current?.stop();
    setRecording(false);
  }

  function send() {
    const t = text.trim();
    if (!t || isLoading) return;
    onSend(t);
    setText('');
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center gap-2 border rounded-full px-3 py-2 bg-background">
        <input
          className="flex-1 outline-none bg-transparent text-foreground placeholder:text-muted-foreground"
          placeholder={`Ask ${appConfig.brandName}…`}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isLoading || isTranscribing}
        />
        
        {isTranscribing && (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        )}
        
        {recording && (
          <span className="text-sm font-mono text-destructive font-medium min-w-[3ch]">
            {formatTime(elapsedMs)}
          </span>
        )}
        
        <button
          aria-label="Record"
          onMouseDown={startRecording}
          onMouseUp={stopRecording}
          onTouchStart={startRecording}
          onTouchEnd={stopRecording}
          disabled={isLoading || isTranscribing}
          className={cn(
            'w-9 h-9 rounded-full flex items-center justify-center transition-colors',
            recording ? 'bg-destructive animate-pulse' : 'bg-primary',
            (isLoading || isTranscribing) && 'opacity-50 cursor-not-allowed'
          )}
          title={recording ? 'Release to transcribe' : 'Hold to talk'}
        >
          <Mic className="h-4 w-4 text-primary-foreground" />
        </button>
        
        <div className="relative">
          <Button
            type="button"
            size="icon"
            variant="ghost"
            onClick={onVoiceReplyToggle}
            className={cn(
              'h-9 w-9 rounded-full transition-all',
              voiceReplyEnabled 
                ? 'text-primary bg-primary/10 ring-2 ring-primary ring-offset-2 ring-offset-background' 
                : 'text-muted-foreground hover:text-foreground'
            )}
            title={voiceReplyEnabled ? 'Disable voice replies' : 'Enable voice replies'}
          >
            {voiceReplyEnabled ? (
              <Volume2 className="h-4 w-4" />
            ) : (
              <VolumeX className="h-4 w-4" />
            )}
          </Button>
          {voiceReplyEnabled && (
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-primary" />
            </span>
          )}
        </div>
        
        <Button
          variant="default"
          size="sm"
          onClick={send}
          disabled={!text.trim() || isLoading || isTranscribing}
          className="rounded-full px-4"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            'Send'
          )}
        </Button>
      </div>
      
      <p className="text-xs text-center text-muted-foreground">
        {appConfig.brandName} can make mistakes. Always verify important financial decisions.
      </p>
    </div>
  );
}
