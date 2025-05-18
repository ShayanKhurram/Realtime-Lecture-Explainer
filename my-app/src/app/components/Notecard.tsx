'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRecording } from '@/context/Recordingcontext';
import { cn } from '@/lib/utils';
import { getResponse } from '../actions/route';
import { useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useUser } from "@clerk/clerk-react";
import { TbNotes } from "react-icons/tb";
import { MdOutlineFileDownload } from "react-icons/md";

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

type Note = {
  topic: string;
  keyConcepts: string[];
  bulletNotes: string[];
  definitions: { term: string; def: string }[];
  questions: string[];
  summary: string;
};

const CONTEXT = `
You are an AI note‐taking assistant. Given the following lecture transcription, generate structured notes in this exact format:

Lecture Topic:
[Detect topic]

Key Concepts:
- concept 1
- concept 2
…

Bullet Notes:
- quick takeaway 1
- quick takeaway 2
…

Important Definitions:
→ Term 1: Definition 1
→ Term 2: Definition 2
…

Questions to Explore:
❓ Question 1
❓ Question 2

Summary:
[Give a 1–2 sentence summary of the entire content.]

Only output the formatted notes (no raw transcript).
`;

const BATCH_SIZE = 8;

export default function Notecard() {
  const { isRecording, transcriptions, isSaving, setIsSaving } = useRecording();
  const { user } = useUser();
  const [note, setNote] = useState<Note | null>(null);
  const [busy, setBusy] = useState(false);
  const [localIsSaving, setLocalIsSaving] = useState(false);
  const [savedNotes, setSavedNotes] = useState<Array<{ id: string; note: Note; timestamp: string }>>([]);

  // Convex mutation to save notes
  const saveNoteToConvex = useMutation(api.conversations.createNote);

  // How many lines processed and tracking recording state
  const linesProcessed = useRef(0);
  const wasRecording = useRef(isRecording);

  // Periodic updates: every BATCH_SIZE new lines while recording
  useEffect(() => {
    if (!isRecording || busy) return;
    const total = transcriptions.length;
    if (total - linesProcessed.current >= BATCH_SIZE) {
      // consume BATCH_SIZE lines
      linesProcessed.current += BATCH_SIZE;
      runGenerate(transcriptions);
    }
  }, [transcriptions, isRecording, busy]);

  // Final overwrite and save when recording stops
  useEffect(() => {
    if (wasRecording.current && !isRecording) {
      const total = transcriptions.length;
      if (total > linesProcessed.current) {
        linesProcessed.current = total;
        runGenerate(transcriptions).then(() => {
          // Once we've finalized the note, save it to Convex
          if (note) {
            saveNote();
          }
        });
      } else if (note) {
        // If we have a note but no new lines, still save it
        saveNote();
      }
    }
    wasRecording.current = isRecording;
  }, [isRecording, transcriptions, busy, note]);

  // Reset on new recording session
  useEffect(() => {
    if (isRecording && !wasRecording.current) {
      // Starting a new recording session
      setNote(null);
      linesProcessed.current = 0;
    }
    wasRecording.current = isRecording;
  }, [isRecording]);

  // Core AI fetch + parse
  async function runGenerate(allLines: string[]) {
    setBusy(true);
    const promptText = allLines.join(' ');
    let response = '';
    for await (const chunk of getResponse(CONTEXT, promptText)) {
      response += chunk;
    }
    const parsed = parseResponse(response.trim());
    if (parsed) setNote(parsed);
    setBusy(false);
  }

  // Handle saving the note to Convex
  async function saveNote() {
    if (!note || !user) return;
    
    // Set both local and context saving states
    setLocalIsSaving(true);
    setIsSaving(true);
    
    try {
      // Create a new note object with current timestamp
      const timestamp = new Date().toISOString();
      
      // Save to Convex using the notes table
      const noteId = await saveNoteToConvex({
        userId: user.id,
        topic: note.topic,
        keyConcepts: note.keyConcepts,
        bulletNotes: note.bulletNotes,
        definitions: JSON.stringify(note.definitions),
        questions: note.questions,
        summary: note.summary,
        rawTranscription: transcriptions.join(' '),
        timestamp: timestamp
      });
      
      // Add to local state
      setSavedNotes(prev => [
        ...prev, 
        { 
          id: noteId as string, 
          note: note, 
          timestamp 
        }
      ]);
      
      console.log('Notecard: Note saved successfully with ID:', noteId);
    } catch (error) {
      console.error('Notecard: Error saving note to Convex:', error);
    } finally {
      setLocalIsSaving(false);
      setIsSaving(false);
    }
  }


  return (
    <div className='flex items-center justify-center h-screen'>
        <div className='flex flex-col h-[800px] w-[750px] bg-neutral-950 shadow-md rounded-3xl border border-neutral-800 overflow-hidden'>
                           {/* ── Header ── */}
                                 <div className="flex items-center justify-between gap-3 p-5 border-b border-gray-800">
                                   <div className="flex items-center gap-2">
                                     <TbNotes  size={24} color="white" />
                                     <h1 className="text-white text-xl font-bold">Intelligent Notes</h1>
                                   </div>
                                   <div>
                                       <p className="bg-neutral-700 text-white text-sm font-semibold px-3 py-0.5 rounded-4xl">
                                       <MdOutlineFileDownload   size={24} color="white" />
                                       </p>
                                   </div>
                                 </div>


                           {/*   Second header */}

                           <div>
                                 <div className='flex items-center  gap-3 p-3'>
                                       <p className="bg-[#2C2C70] text-white text-sm font-semibold px-3 py-0.5 rounded-sm">
                                         Ai generated
                                       </p>
                                       <p className="bg-[#6B4E10] text-white text-sm font-semibold px-3 py-0.5 rounded-sm">
                                         Key concepts
                                       </p>     
                                 </div>
                            
                            </div>      

                            <div className='flex-1 py-4 px-5 space-y-6 overflow-y-auto'>
                            {busy && <div className="text-gray-400 italic">AI is summarizing…</div>}

{note && (
  <div className="p-5 rounded-lg  space-y-6">
    <h2 className="text-lg text-gray-300 font-semibold">{note.topic}</h2>

    <Section title="Key Concepts">
      {note.keyConcepts.map((c, i) => (
        <Bullet key={i} icon="•">{c}</Bullet>
      ))}
    </Section>

    <Section title="Bullet Notes">
      {note.bulletNotes.map((b, i) => (
        <Bullet key={i} icon="–">{b}</Bullet>
      ))}
    </Section>

    <Section title="Important Definitions">
      {note.definitions.map((d, i) => (
        <Bullet key={i} icon="→">
          <strong>{d.term}:</strong> {d.def}
        </Bullet>
      ))}
    </Section>

    <Section title="Questions to Explore">
      {note.questions.map((q, i) => (
        <Bullet key={i} icon="❓">{q}</Bullet>
      ))}
    </Section>

    <Section title="Summary">
      <p className="text-gray-200 italic">{note.summary}</p>
    </Section>
  </div>
)}

</div>


        </div>
    </div>
  )
}


function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-md text-gray-300 font-medium">{title}</h3>
      <div className="mt-2 text-sm space-y-2">{children}</div>
    </div>
  );
}

function Bullet({ icon, children }: { icon: string; children: React.ReactNode }) {
  return (
    <div className="bg-neutral-800 p-3  rounded-lg flex items-start gap-2">
      <span className="text-blue-800 " >{icon}</span>
      <p className="text-gray-200 text-md">{children}</p>
    </div>
  );
}

// Parse the AI’s response into our Note shape
function parseResponse(raw: string): Note | null {
  const topic = raw.match(/Lecture Topic:\s*([\s\S]*?)\n/)?.[1]?.trim();
  const kc = raw.match(/Key Concepts:\s*([\s\S]*?)\n\n/)?.[1];
  const bn = raw.match(/Bullet Notes:\s*([\s\S]*?)\n\n/)?.[1];
  const defs = raw.match(/Important Definitions:\s*([\s\S]*?)\n\n/)?.[1];
  const qs = raw.match(/Questions to Explore:\s*([\s\S]*?)\n\n/)?.[1];
  const summary = raw.match(/Summary:\s*([\s\S]*)/)?.[1]?.trim();

  if (!topic || !kc || !bn || !defs || !qs || !summary) return null;

  const keyConcepts = kc
    .split(/\n|-/)
    .map(l => l.replace(/^-/, '').trim())
    .filter(Boolean);

  const bulletNotes = bn
    .split(/\n|-/)
    .map(l => l.replace(/^-/, '').trim())
    .filter(Boolean);

  const definitions = defs
    .split(/\n|→/)
    .map(l => l.replace(/^→/, '').trim())
    .filter(Boolean)
    .map(line => {
      const [term, def] = line.split(':').map(s => s.trim());
      return { term, def };
    });

  const questions = qs
    .split(/\n|❓/)
    .map(l => l.replace(/^❓/, '').trim())
    .filter(Boolean);

  return { topic, keyConcepts, bulletNotes, definitions, questions, summary };
}


