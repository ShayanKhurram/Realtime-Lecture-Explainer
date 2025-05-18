'use client';

import React, { useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useUser } from "@clerk/clerk-react";
import { AiOutlineClockCircle } from 'react-icons/ai';
import { Id } from '../../../convex/_generated/dataModel';
import { FileText, MessageSquare } from 'lucide-react';

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

type Note = {
  topic: string;
  keyConcepts: string[];
  bulletNotes: string[];
  definitions: { term: string; def: string }[];
  questions: string[];
  summary: string;
};

export default function ConversationHistory() {
  const { user } = useUser();
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("conversations");
  
  // Query saved conversations summaries from Convex
  const conversations = useQuery(api.conversations.listUserConversations, { 
    userId: user?.id || '' 
  }) || [];
  
  // Query saved notes from Convex
  const notes = useQuery(api.conversations.listUserNotes, {
    userId: user?.id || ''
  }) || [];
  
  // Query the full conversation details if one is selected
  const selectedConversation = useQuery(
    api.conversations.getConversationById, 
    selectedConversationId ? { id: selectedConversationId as Id<"conversations"> } : "skip"
  );
  
  // Query the full note details if one is selected
  const selectedNote = useQuery(
    api.conversations.getNoteById,
    selectedNoteId ? { id: selectedNoteId as Id<"notes"> } : "skip"
  );
  
  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Parse blocks from JSON if a conversation is selected
  const blocks = selectedConversation ? JSON.parse(selectedConversation.blocks) as Block[] : [];

  // Parse definitions if a note is selected
  const parseDefinitions = (defsString: string) => {
    try {
      return JSON.parse(defsString) as { term: string; def: string }[];
    } catch (e) {
      console.error("Failed to parse definitions:", e);
      return [];
    }
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    if (value === "conversations") {
      setSelectedNoteId(null);
    } else {
      setSelectedConversationId(null);
    }
  };

  return (
    <div className="flex h-screen bg-neutral-950">
      {/* Sidebar with tabs for conversations and notes */}
      <div className="w-1/4 border-r border-neutral-800 p-4 overflow-y-auto">
        <div className="mb-4 grid grid-cols-2 w-full rounded-lg overflow-hidden">
          <button 
            className={`flex items-center justify-center border-2 border-neutral-700  gap-2 px-3 py-2 ${
              activeTab === "conversations" 
                ? 'bg-neutral-800 text-white' 
                : ' text-neutral-300 hover:bg-neutral-700'
            }`}
            onClick={() => handleTabChange("conversations")}
          >
            <MessageSquare className="w-4 h-4" />
            Conversations
          </button>
          <button 
            className={`flex items-center border-2 border-neutral-700 justify-center gap-2 px-3 py-2 ${
              activeTab === "notes" 
                ? 'bg-neutral-800 text-white' 
                : ' text-neutral-300 hover:bg-neutral-700'
            }`}
            onClick={() => handleTabChange("notes")}
          >
            <FileText className="w-4 h-4" />
            Notes
          </button>
        </div>
        
        {activeTab === "conversations" && (
          <div className="mt-0">
            {conversations.length === 0 ? (
              <p className="text-neutral-400">No saved conversations</p>
            ) : (
              <div className="space-y-2">
                {conversations.map((conversation) => (
                  <div 
                    key={conversation._id}
                    className={`p-3 rounded-lg cursor-pointer ${
                      selectedConversationId === conversation._id 
                        ? 'bg-neutral-800 bg-opacity-30' 
                        : 'hover:bg-neutral-800'
                    }`}
                    onClick={() => setSelectedConversationId(conversation._id)}
                  >
                    <p className="text-white font-medium truncate">{conversation.summary}</p>
                    <p className="text-neutral-400 text-sm mt-1 flex items-center gap-1">
                      <AiOutlineClockCircle size={12} />
                      {formatDate(conversation.timestamp)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        
        {activeTab === "notes" && (
          <div className="mt-0">
            {notes.length === 0 ? (
              <p className="text-neutral-400">No saved notes</p>
            ) : (
              <div className="space-y-2">
                {notes.map((note) => (
                  <div 
                    key={note._id}
                    className={`p-3 rounded-lg cursor-pointer ${
                      selectedNoteId === note._id 
                        ? 'bg-neutral-800 bg-opacity-30' 
                        : 'hover:bg-neutral-800'
                    }`}
                    onClick={() => setSelectedNoteId(note._id)}
                  >
                    <p className="text-white font-medium truncate">{note.topic}</p>
                    <p className="text-neutral-400 text-sm mt-1 flex items-center gap-1">
                      <AiOutlineClockCircle size={12} />
                      {formatDate(note.timestamp)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Main content area */}
      <div className="w-3/4 p-6 overflow-y-auto">
        {activeTab === "conversations" ? (
          // Conversations View
          !selectedConversationId ? (
            <div className="flex flex-col items-center justify-center h-full text-neutral-400">
              <p>Select a conversation to view</p>
            </div>
          ) : selectedConversation ? (
            <div className="space-y-6">
              <div className="border-b border-neutral-800 pb-4">
                <h1 className="text-2xl font-bold text-white">{selectedConversation.summary}</h1>
                <p className="text-neutral-400 mt-2">
                  {formatDate(selectedConversation.timestamp)}
                </p>
              </div>
              
              {/* Render conversation blocks */}
              {blocks.map((b) =>
                b.type === 'trans' ? (
                  <div
                    key={`t${b.id}`}
                    className="rounded-lg p-3 space-y-2 "
                  >
                    <div className="text-neutral-500 text-xs flex gap-2 items-center">
                      <AiOutlineClockCircle size={14} />{b.createdAt}
                    </div>
                    {b.lines.map((ln, j) => (
                      <p key={j} className="text-gray-300">
                        {ln.text}
                      </p>
                    ))}
                  </div>
                ) : (
                  <div
                    key={`a${b.forId}`}
                    className="ml-8 rounded-lg p-3 bg-neutral-900 border border-neutral-700"
                  >
                    <p className="text-gray-200">{b.text || '…'}</p>
                  </div>
                )
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="animate-pulse text-blue-400">Loading...</div>
            </div>
          )
        ) : (
          // Notes View
          !selectedNoteId ? (
            <div className="flex flex-col items-center justify-center h-full text-neutral-400">
              <p>Select a note to view</p>
            </div>
          ) : selectedNote ? (
            <div className="p-5 rounded-lg  space-y-6">
              <div className="border-b border-neutral-700 pb-4">
                <h1 className="text-2xl font-bold text-white">{selectedNote.topic}</h1>
                <p className="text-neutral-400 mt-2">
                  {formatDate(selectedNote.timestamp)}
                </p>
              </div>

              <Section title="Key Concepts">
                {selectedNote.keyConcepts.map((c, i) => (
                  <Bullet key={i} icon="•">{c}</Bullet>
                ))}
              </Section>

              <Section title="Bullet Notes">
                {selectedNote.bulletNotes.map((b, i) => (
                  <Bullet key={i} icon="–">{b}</Bullet>
                ))}
              </Section>

              <Section title="Important Definitions">
                {parseDefinitions(selectedNote.definitions).map((d, i) => (
                  <Bullet key={i} icon="→">
                    <strong>{d.term}:</strong> {d.def}
                  </Bullet>
                ))}
              </Section>

              <Section title="Questions to Explore">
                {selectedNote.questions.map((q, i) => (
                  <Bullet key={i} icon="❓">{q}</Bullet>
                ))}
              </Section>

              <Section title="Summary">
                <p className="text-gray-300 italic">{selectedNote.summary}</p>
              </Section>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="animate-pulse text-green-400">Loading...</div>
            </div>
          )
        )}
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-lg text-gray-200 font-medium">{title}</h3>
      <div className="mt-2 space-y-2">{children}</div>
    </div>
  );
}

function Bullet({ icon, children }: { icon: string; children: React.ReactNode }) {
  return (
    <div className="bg-neutral-800 p-3 rounded-lg flex items-start gap-2">
      <span className="text-blue-400">{icon}</span>
      <p className="text-gray-100">{children}</p>
    </div>
  );
}