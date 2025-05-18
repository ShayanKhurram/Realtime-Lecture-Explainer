import React from 'react'
import { SignInButton, UserButton ,SignUpButton } from "@clerk/clerk-react";
import { Authenticated, Unauthenticated, AuthLoading, useQuery } from "convex/react";
import { api } from '../../../convex/_generated/api';
import { Playwrite_DK_Loopet } from 'next/font/google';
import { FilePen, Pencil } from 'lucide-react';
import { RiHistoryLine } from 'react-icons/ri';
import Link from 'next/link';
const play = Playwrite_DK_Loopet({

    weight:"400"
});
const Header = () => {
  return (
    <div className='p-2 flex justify-between items-center'>
      
    <div className='flex items-center  gap-6 '>
         <div className='pt-3'><button><FilePen size={24} className='text-white hover:cursor-pointer' /></button></div>
         <div className={`${play.className} text-white text-4xl`}>Clarity</div>
       
    </div>

        <div className='text-amber-50 flex justify-end items-center gap-2 '>
       <Unauthenticated>
       <button className='bg-white w-19 font-medium h-10 text-black rounded-4xl  '> <SignInButton  /></button>         
      <button className='border-2  w-35 font-medium h-10 text-white rounded-4xl'> <SignUpButton />   for free</button>         

        </Unauthenticated>
      </div>

      <Authenticated>
        <div className='flex gap-3 items-center'>
        <Link href={`/history`}>
        <RiHistoryLine size={24} className='text-white hover:cursor-pointer'/>
        </Link>
        <UserButton />
        </div>
      </Authenticated>
      <AuthLoading>
        <p>Still loading</p>
      </AuthLoading>
         
    </div>
  )
}

export default Header
