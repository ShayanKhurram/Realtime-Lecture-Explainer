'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRecording } from '@/context/Recordingcontext';
import { cn } from '@/lib/utils';
import { AiOutlineClockCircle } from 'react-icons/ai';
import { useMutation } from 'convex/react';
import { IoMicOutline } from 'react-icons/io5';
import { api } from '../../../convex/_generated/api';
import { useUser } from "@clerk/clerk-react";
import { getResponse } from '../actions/route';

// Types remain the same
type TransLine = {
  text: string;
  timestamp: string;
};

type TransBlock = {
  type: 'trans';
  id: number;
  lines: TransLine[];
  createdAt: string;
};

type AiBlock = {
  type: 'ai';
  forId: number;
  text: string;
};

type Block = TransBlock | AiBlock;

type SavedConversation = {
  timestamp: string;
  blocks: Block[];
};

const CONTEXT =
  'You are an assistant helping students during a class by explaining lecture transcriptions. Give answers in 4 sentences.';

// Transcribing animation component
const TranscribingAnimation = () => {
  return (
    <div className="flex items-center gap-2 p-3 rounded-lg text-gray-400">
      <div className="flex space-x-1">
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-150"></div>
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-300"></div>
      </div>
      <span className="text-sm">Transcribing...</span>
    </div>
  );
};

export default function Card() {
  const user = useUser();
  const { isRecording, transcriptions, isSaving, setIsSaving } = useRecording();
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [savedConversations, setSavedConversations] = useState<SavedConversation[]>([]);
  const [aiQueue, setAiQueue] = useState<TransBlock[]>([]);
  const [aiBusy, setAiBusy] = useState(false);
  const [localIsSaving, setLocalIsSaving] = useState(false);

  const pulledRef = useRef(0);
  const nextIdRef = useRef(1);
  const wasRecording = useRef(isRecording);

  // Convex mutation to save conversations
  const saveToConvex = useMutation(api.conversations.create);

  const nowStamp = () =>
    new Date().toLocaleTimeString('en-GB', { hour12: false });

  // Build/extend transcription blocks, queue full ones
  useEffect(() => {
    while (pulledRef.current < transcriptions.length) {
      const lineText = transcriptions[pulledRef.current++];
      const lineObj: TransLine = { text: lineText, timestamp: nowStamp() };

      setBlocks((prev) => {
        const last = prev[prev.length - 1] as Block | undefined;
        let updated = [...prev];

        if (
          !last ||
          last.type === 'ai' ||
          (last.type === 'trans' && last.lines.length === 4)
        ) {
          const block: TransBlock = {
            type: 'trans',
            id: nextIdRef.current++,
            lines: [lineObj],
            createdAt: nowStamp(),
          };
          updated.push(block);
          if (block.lines.length === 4) setAiQueue((q) => [...q, block]);
        } else {
          const trans = last as TransBlock;
          const newLines = [...trans.lines, lineObj];
          const newBlock: TransBlock = { ...trans, lines: newLines };
          updated = [...updated.slice(0, -1), newBlock];
          if (newLines.length === 4) setAiQueue((q) => [...q, newBlock]);
        }

        return updated;
      });
    }
  }, [transcriptions]);

  // Process AI queue
  useEffect(() => {
    if (aiBusy || aiQueue.length === 0) return;
    const nextTrans = aiQueue[0];
    setAiBusy(true);
    let streamed = '';

    (async () => {
      for await (const chunk of getResponse(
        CONTEXT,
        nextTrans.lines.map((l) => l.text).join(' ')
      )) {
        streamed += chunk;
        setBlocks((prev) => {
          const idx = prev.findIndex(
            (b) => b.type === 'trans' && (b as TransBlock).id === nextTrans.id
          );
          const head = prev.slice(0, idx + 1);
          const tail = prev.slice(idx + 1);
          if (
            tail[0]?.type === 'ai' &&
            (tail[0] as AiBlock).forId === nextTrans.id
          ) {
            return [
              ...head,
              { type: 'ai', forId: nextTrans.id, text: streamed },
              ...tail.slice(1),
            ];
          }
          return [...head, { type: 'ai', forId: nextTrans.id, text: streamed }, ...tail];
        });
      }
      setAiQueue((q) => q.slice(1));
      setAiBusy(false);
    })();
  }, [aiBusy, aiQueue]);

  // Check for recording stopped to save data
  useEffect(() => {
    // Detect when recording has stopped
    if (wasRecording.current && !isRecording && blocks.length > 0) {
      saveConversation();
    }
    
    wasRecording.current = isRecording;
  }, [isRecording, blocks]);
  
  // Function to save conversation
  const saveConversation = async () => {
    if (blocks.length === 0) return;
    
    // Set both local and context saving states
    setLocalIsSaving(true);
    setIsSaving(true);
    
    try {
      // Create a new conversation object
      const conversation: SavedConversation = {
        timestamp: new Date().toISOString(),
        blocks: [...blocks]
      };
      
      // Add to local state
      setSavedConversations(prev => [...prev, conversation]);
      
      // Save to Convex
      const result = await saveToConvex({
        timestamp: conversation.timestamp,
        blocks: JSON.stringify(conversation.blocks),
        summary: generateSummary(conversation.blocks),
        userId: user.user?.id || ''
      });
      
      console.log('Card: Saved to Convex:', result);
    } catch (error) {
      console.error('Card: Error saving to Convex:', error);
    } finally {
      setLocalIsSaving(false);
      setIsSaving(false);
    }
  };
  
  // Helper function to generate a short summary
  const generateSummary = (blocks: Block[]): string => {
    const transBlocks = blocks.filter(b => b.type === 'trans') as TransBlock[];
    if (transBlocks.length === 0) return "Empty conversation";
    
    const firstLines = transBlocks[0].lines.map(l => l.text).join(' ');
    return firstLines.substring(0, 100) + (firstLines.length > 100 ? '...' : '');
  };


  return (
    <div className="flex items-center justify-center h-screen">
      <div className="flex flex-col h-[800px] w-[750px] bg-neutral-950 shadow-md rounded-3xl border border-neutral-800 overflow-hidden">
        {/* ── Header ── */}
        <div className="flex items-center justify-between gap-3 p-5 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <IoMicOutline size={24} color="white" />
            <h1 className="text-white text-xl font-bold">Live Transcription Explanation</h1>
          </div>
          <p className="bg-neutral-700 text-white text-sm font-semibold px-3 py-0.5 rounded-full">
            Real time
          </p>
        </div>

        {/* ── Scrollable cards area ── */}
        <div className="flex-1 py-4 px-5 space-y-6 overflow-y-auto">
          
       
          
          {blocks.map((b) =>
            b.type === 'trans' ? (
              <div
                key={`t${b.id}`}
                className="rounded-lg p-3 space-y-2 bg-neutral-950"
              >
                <div className="text-neutral-500 font-bold text-xs flex gap-2 items-center"><AiOutlineClockCircle size={14} />{b.createdAt}</div>
                {b.lines.map((ln, j) => (
                  <p key={j} className="text-gray-300 text-sm">
                    {ln.text}
                  </p>
                ))}
              </div>
            ) : (
              <div
                key={`a${b.forId}`}
                className="ml-13 rounded-lg p-3 bg-neutral-800"
              >
                <p className="text-gray-200 text-sm">{b.text || '…'}</p>
              </div>
            )
          )}
           {/* Show transcribing animation when recording */}
           {isRecording && <TranscribingAnimation />}
        </div>
      </div>
    </div>
  );
}