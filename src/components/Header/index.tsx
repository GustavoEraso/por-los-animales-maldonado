'use client'
import React, { useState } from 'react';
import Link from 'next/link';

import styles from './styles.module.css'
export default function Header() { 
    const [visible, setVisibe] = useState<boolean>(false);

    const linnks = [
        {id: 1, name: 'inicio', url: '/'},
        {id: 2, name: 'quiero apoyar', url: '/#apoyo'},
        {id: 3, name: 'nosotros', url: '/#sobre-nosotros'},
        {id: 4, name: 'contacto', url: '/#contacto'},
    ]

    return(
   <header className='flex justify-between w-full items-center relative z-50 bg-white shadow-md p-4'>
    <div className='flex flex-col '>
       <Link href="/"><span className='font-bold'> Por Los Animales</span></Link>
       <p className='text-xs text-balance'>Maldonado</p>
    </div>
    <div className='hidden md:block'>
        <ul className='flex space-x-4 text-md'>
            {linnks.map((link) => (
                <li key={link.id}>
                    <a className={`block w- text-center  p-2 ${styles.outline_bottom}`} href={link.url}>{link.name}</a>
                </li>
            ))}
        </ul>
    </div>

    {/* Boton de menu */}
    <div className='bg-gray-200 p-2 rounded-md block md:hidden w-10 h-10'> 
        <button aria-label='boton menu' onClick={(e) =>{ e.preventDefault(); setVisibe(!visible)}}  >            
        <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#5f6368"><path d="M120-240v-80h720v80H120Zm0-200v-80h720v80H120Zm0-200v-80h720v80H120Z"/></svg>
        </button>
    </div>
    {/* Menu responsive */}
    <div className={`${visible ? 'block' : 'hidden'} md:hidden  fixed top-0 right-0 left-0 bottom-0 bg-gray-200 flex flex-col items-center` }>
        <button onClick={(e) =>{ e.preventDefault(); setVisibe(!visible)}} className='bg-gray-100 p-2 rounded-full self-end m-2'>
            <svg className='w-6 h-6' fill='none' stroke='currentColor' viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M6 18L18 6M6 6l12 12'></path>
            </svg>
        </button>
        <ul className='flex flex-col w-full space-x-4 gap-4 px-4 text-lg'>
        {linnks.map((link) => (
                <li className=' w-full rounded-2xl overflow-hidden' onClick={()=>setVisibe(false)} key={link.id}>
                    <a className='block w- text-center hover:bg-gray-300 p-2' href={link.url}>{link.name}</a>
                </li>
            ))}
        </ul>
    </div>
   </header>
)
}