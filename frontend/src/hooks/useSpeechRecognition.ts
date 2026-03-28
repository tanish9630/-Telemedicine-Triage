import { useState, useRef, useCallback } from 'react';

interface UseSpeechProps {
  onResult: (transcript: string) => void;
  groqApiKey?: string;
  lang?: string;
}

/**
 * Uses Groq's Whisper API (whisper-large-v3-turbo) for speech transcription.
 * Records audio via the browser's MediaRecorder, then sends the blob to Groq.
 */
export function useSpeechRecognition({ onResult, groqApiKey, lang = 'en' }: UseSpeechProps) {
  const [isListening, setIsListening] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const hasRecognitionSupport =
    typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia;

  const transcribeWithGroq = useCallback(
    async (audioBlob: Blob) => {
      if (!groqApiKey) {
        console.warn('No Groq API key provided for speech transcription.');
        return;
      }
      setIsTranscribing(true);
      try {
        const formData = new FormData();
        // Groq Whisper expects a file; we name it with the correct extension
        formData.append('file', audioBlob, 'recording.webm');
        formData.append('model', 'whisper-large-v3-turbo');
        formData.append('language', lang);
        formData.append('response_format', 'json');

        const res = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${groqApiKey}`,
          },
          body: formData,
        });

        if (res.ok) {
          const data = await res.json();
          const text: string = data.text?.trim();
          if (text) onResult(text);
        } else {
          const err = await res.json();
          console.error('Groq Whisper error:', err);
        }
      } catch (e) {
        console.error('Failed to transcribe with Groq Whisper:', e);
      } finally {
        setIsTranscribing(false);
      }
    },
    [groqApiKey, lang, onResult]
  );

  const startListening = useCallback(async () => {
    if (isListening) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];

      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        // Stop all mic tracks to release microphone
        streamRef.current?.getTracks().forEach((t) => t.stop());
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        await transcribeWithGroq(audioBlob);
        chunksRef.current = [];
      };

      recorder.start();
      setIsListening(true);
    } catch (e) {
      console.error('Failed to access microphone:', e);
    }
  }, [isListening, transcribeWithGroq]);

  const stopListening = useCallback(() => {
    if (!isListening || !mediaRecorderRef.current) return;
    mediaRecorderRef.current.stop();
    setIsListening(false);
  }, [isListening]);

  return {
    isListening,
    isTranscribing,
    startListening,
    stopListening,
    hasRecognitionSupport,
  };
}
