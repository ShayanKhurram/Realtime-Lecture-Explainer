// Now let's update the Home component to use the single recording button
'use client';

import Image from "next/image";
import Card from "./components/Card";
import { useRecording } from '@/context/Recordingcontext';
import { cn } from '@/lib/utils';
import { Mic, Save } from 'lucide-react';
import Notecard from "./components/Notecard";
import { Merriweather } from 'next/font/google';
import Header from "./components/Header";
import { Playwrite_DK_Loopet } from "next/font/google";
import { Authenticated } from "convex/react";
const merri = Merriweather({
    subsets: ["latin"],
    weight:"400",
});


export default function Home() {
  const { isRecording, toggleRecording, isSaving } = useRecording();
      
  return (
    <div className="flex-col gap-5 p-5">
       
          
      <div className="flex items-center  pt-50 justify-center">
        <p className={`text-gray-100 text-4xl font-extrabold ${merri.className}`}>Want my help with your boring lectures?</p>
      </div>

      <div className="flex justify-center p-15 items-center gap-4">
        {/* Unified Recording Button */}
        <button
          onClick={toggleRecording}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-white transition-colors duration-200 hover:bg-neutral-700',
            isRecording ? ' hover:bg-red-700' : ' hover:bg-neutral-700'
          )}
          disabled={isSaving}
        >
          <Mic className="w-4 h-4" />
          {isSaving 
            ? 'Saving...' 
            : isRecording 
              ? 'Stop Recording' 
              : 'Start Recording'}
        </button>

        {/* Recording Indicator */}
        {isRecording && (
          <div className="flex items-center space-x-2">
            <span className="h-3 w-3 rounded-full bg-red-500 animate-pulse"></span>
            <span className="text-red-500 font-semibold">Recording</span>
          </div>
        )}
        
        {/* Saving Indicator */}
        <Authenticated>
        {isSaving && (
          <div className="flex items-center space-x-2">
            <span className="h-3 w-3 rounded-full bg-yellow-500 animate-pulse"></span>
            <span className="text-yellow-500 font-semibold">Saving...</span>
          </div>
        )}
        </Authenticated>
      </div>        

      <div className="flex justify-center items-center gap-10"> 
        <Card/>
        <Notecard/>
      </div> 
    </div>
  );
}