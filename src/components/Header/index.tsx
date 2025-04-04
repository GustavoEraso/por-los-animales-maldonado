'use client'
import React, { useState } from 'react';
import Link from 'next/link';

import styles from './styles.module.css'

interface LinkChild {
    id: string;
    name: string;
    url: string;
}

interface Links {
    id: string;
    name: string;
    url: string;
    childs?: LinkChild[];
}


export default function Header() {
    const [visible, setVisibe] = useState<boolean>(false);

    const links: Links[] = [
        { id: 'LINKSNOSOTROS', name: 'NOSOTROS', url: '/#nosotros' },
        { id: 'LINKSADOPTA', name: 'ADOPTÁ', url: '/#adopta', childs: [
            { id: 'LINKSADOPTACONOCELOS', name: 'CONOCELOS', url: '/#conocelos' },
            { id: 'LINKSADOPTAQUIEROADOTAR', name: 'QUIERO ADOPTAR', url: '/#quiero-adoptar' },
            { id: 'LINKSADOPTAREQUISITOSDEADOPCION', name: 'REQUISOTOS DE ADOPCIÓN', url: '/#requisitos-de-adopcion' },
        ]},
        { id: 'LINKSSALVAVIDAS', name: 'SALVÁ VIDAS', url: '/#salva-vidas', childs: [
            { id: 'LINKSSALVAVIDASCASTA', name: 'CASTRÁ', url: '/#castrá' },
            { id: 'LINKSSALVAVIDASDENICIAMALTRATO', name: 'DENINCIA EL MALTRATO', url: '/#denuncia-el-maltrato' },
        ]},
        {
            id: 'LINKSPARTICIPA', name: 'PARTICIPÁ', url: '/#cparticipa', childs: [
                { id: 'LINKSPARTICIPAVOLUNTARIOS', name: 'VOLUNTARIOS', url: '/#sobre-nosotros' },
                { id: 'LINKSPARTICIPAHOGARDETRANSITO', name: 'HOGAR DE TRÁNSITO', url: '/#hogar-de-transito' },
                
            ]
        },
        { id: 'LINKSTIENDA', name: 'TIENDA', url: '/#tienda' },
        { id: 'LINKSDONACIONES', name: 'DONACIONES', url: '/#donaciones', childs: [
            { id: 'LINKSDONACIONESAPORTESECONOMICOS', name: 'APORTES ECONÓMICOS', url: '/#aportes-economicos' },
            { id: 'LINKSDONACIONESDONACIONDEINSUMOS', name: 'DONACÓN DE INSUMOS', url: '/donacion-de-insumos' },]},
        { id: 'LINKSCONTACTO', name: 'CONTACTO', url: '/#contacto' },
    ]

    return (
        <header className='flex justify-between w-full items-center relative z-50 bg-white shadow-md p-4'>
            <div className='w-32 h-32 flex-shrink-0' >
                <Link href="/"><img className='block w-32 h-32  object-contain' src="/logo300.png" alt="logo de por los animales maldonado" /></Link>
            </div>
            <div className='hidden md:block'>
                <ul className='flex space-x-4 text-md flex-wrap justify-center  bg-white'>
                    {links.map((link) => (
                        <li className="group relative flex flex-col items-center" key={link.id + 'desktop'}>
                            <a className={`inline-flex items-center gap-1 relative text-center p-2 ${styles.outline_bottom}`} href={link.url}>
                                {link.name}
                                {link.childs && (
                                    <svg className="w-3 h-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M6 9l6 6 6-6"></path>
                                    </svg>
                                )}
                            </a>
                            {link.childs && (
                                <ul className="absolute hidden group-hover:flex flex-col bottom-0 translate-y-full z-10 bg-white">
                                    {link.childs.map((child) => (
                                        <li key={child.id + 'desktop'}>
                                            <a className={`block text-center p-2 whitespace-nowrap ${styles.outline_bottom}`} href={child.url}>
                                                {child.name}
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </li>

                    ))}
                </ul>
            </div>

            <div>
                <Link href="/donar" ><span className=' block text-lg  text-white leading-tight p-2 bg-cyan-900 hover:bg-emerald-500 uppercase text-wrap text-center w-32 md:w-fit px-6 py-3 rounded-full'>Doná ahora</span></Link>
            </div>

            {/* Boton de menu */}
            <div className='bg-gray-200 p-2 rounded-md block md:hidden w-10 h-10'>
                <button aria-label='boton menu' onClick={(e) => { e.preventDefault(); setVisibe(!visible) }}  >
                    <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#5f6368"><path d="M120-240v-80h720v80H120Zm0-200v-80h720v80H120Zm0-200v-80h720v80H120Z" /></svg>
                </button>
            </div>
            {/* Menu responsive */}
            <div className={`${visible ? 'block' : 'hidden'} md:hidden  fixed top-0 right-0 left-0 bottom-0 bg-gray-200 flex flex-col items-center overflow-scroll`}>
                <button onClick={(e) => { e.preventDefault(); setVisibe(!visible) }} className='bg-gray-100 p-2 rounded-full self-end m-2'>
                    <svg className='w-6 h-6' fill='none' stroke='currentColor' viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M6 18L18 6M6 6l12 12'></path>
                    </svg>
                </button>
                <ul className='flex flex-col w-full space-x-4 gap-4 px-4 text-lg'>
                    {links.map((link) => (<>
                        {link.childs && (
                            <p key={link.id + 'mobile-title'} className='text-sm text-center font-bold'>{link.name} :</p>
                        )}
                        {link.childs &&
                            link.childs.map((child) => (
                                <li className='w-full rounded-2xl overflow-hidden' key={child.id + 'mobile'}>
                                    <a className='block text-center  hover:bg-gray-300 p-2' href={child.url}>{child.name}</a>
                                </li>
                            ))
                        }
                        {!link.childs &&
                            <li className=' w-full rounded-2xl overflow-hidden' onClick={() => setVisibe(false)} key={link.id + 'mobile'}>
                                <a className='block w- text-center hover:bg-gray-300 p-2' href={link.url}>{link.name}</a>
                            </li>
                        }
                    </>
                    ))}
                </ul>
            </div>
        </header>
    )
}