'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface RecordingContextType {
  isRecording: boolean;
  toggleRecording: () => Promise<void>;
  transcriptions: string[];
  isSaving: boolean;
  setIsSaving: (value: boolean) => void;
  resetTranscriptions: () => void;
}

const RecordingContext = createContext<RecordingContextType | undefined>(undefined);

export const useRecording = () => {
  const context = useContext(RecordingContext);
  if (context === undefined) {
    throw new Error('useRecording must be used within a RecordingProvider');
  }
  return context;
};

export function RecordingProvider({ children }: { children: React.ReactNode }) {
  const [isRecording, setIsRecording] = useState(false);
  const [transcriptions, setTranscriptions] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [seenTranscriptions] = useState(new Set<string>());
  
  const startRecording = async () => {
    try {
      const response = await fetch('http://localhost:8000/start', {
        method: 'POST',
      });
      const data = await response.json();
      if (data.status === 'started') {
        setIsRecording(true);
        // Clear transcriptions when starting new recording
        setTranscriptions([]);
        seenTranscriptions.clear();
      }
    } catch (error) {
      console.error('Error starting recording:', error);
    }
  };

  const stopRecording = async () => {
    try {
      const response = await fetch('http://localhost:8000/stop', {
        method: 'POST',
      });
      const data = await response.json();
      if (data.status === 'stopped') {
        setIsRecording(false);
      }
    } catch (error) {
      console.error('Error stopping recording:', error);
    }
  };

  const toggleRecording = async () => {
    if (isRecording) {
      await stopRecording();
    } else {
      await startRecording();
    }
  };
  
  const resetTranscriptions = () => {
    setTranscriptions([]);
    seenTranscriptions.clear();
  };

  // Poll for new transcriptions when recording is active
  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    const fetchTranscription = async () => {
      try {
        const response = await fetch('http://localhost:8000/transcript');
        const data = await response.json();
        if (data.transcript && !seenTranscriptions.has(data.transcript)) {
          setTranscriptions(prev => [...prev, data.transcript]);
          seenTranscriptions.add(data.transcript);
        }
      } catch (error) {
        console.error('Error fetching transcription:', error);
      }
    };

    if (isRecording) {
      // Fetch immediately and then every 2 seconds
      fetchTranscription();
      intervalId = setInterval(fetchTranscription, 2000);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isRecording, seenTranscriptions]);
  
  return (
    <RecordingContext.Provider
      value={{
        isRecording,
        toggleRecording,
        transcriptions,
        isSaving,
        setIsSaving,
        resetTranscriptions
      }}
    >
      {children}
    </RecordingContext.Provider>
  );
}