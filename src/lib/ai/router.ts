import { supabase } from '@/integrations/supabase/client';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

// Intent patterns for smart routing
const SPEND_INTENT = /(analy[sz]e|review|check).*(spend|budget|expenses|dining|groceries|subscriptions|goals)/i;

interface ChatResponse {
  text: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  model?: string;
  fallbackUsed?: boolean;
}

interface WelcomeResponse {
  text: string;
  voice?: { voice: string; pace: number };
}

interface TranscribeResponse {
  text: string;
}

interface SpeakResponse {
  audioContent: string;
}

export async function fetchWelcome(): Promise<WelcomeResponse> {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session?.access_token) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(`${SUPABASE_URL}/functions/v1/ai-welcome`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Welcome fetch failed');
  }

  return response.json();
}

export async function analyzeSpend(question?: string): Promise<ChatResponse> {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session?.access_token) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(`${SUPABASE_URL}/functions/v1/insights-generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ question }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Spend analysis failed');
  }

  return response.json();
}

export async function chat(message: string, context?: Record<string, unknown>): Promise<ChatResponse> {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session?.access_token) {
    throw new Error('Not authenticated');
  }

  // Check for spend/budget intent and route to insights-generate with question
  if (SPEND_INTENT.test(message)) {
    return analyzeSpend(message);
  }

  const response = await fetch(`${SUPABASE_URL}/functions/v1/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ message, context }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Chat request failed');
  }

  return response.json();
}

export async function transcribe(audioBlob: Blob): Promise<TranscribeResponse> {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session?.access_token) {
    throw new Error('Not authenticated');
  }

  const formData = new FormData();
  formData.append('audio', audioBlob, 'audio.webm');

  const response = await fetch(`${SUPABASE_URL}/functions/v1/voice-transcribe`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Transcription failed');
  }

  return response.json();
}

export async function speak(text: string, voice?: string, pace?: number): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session?.access_token) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(`${SUPABASE_URL}/functions/v1/voice-speak`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ text, voice, pace }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || 'TTS failed');
  }

  const audioBuffer = await response.arrayBuffer();
  const blob = new Blob([audioBuffer], { type: 'audio/mpeg' });
  return URL.createObjectURL(blob);
}
