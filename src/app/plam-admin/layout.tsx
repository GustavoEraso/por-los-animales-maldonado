// app/dashboard/layout.tsx
'use client';
import Link from "next/link"

import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { auth } from '@/firebase';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (!user) {
                router.replace('/login'); // 🔐 redirige si no hay sesión
            } 
        });

        return () => unsubscribe();
    }, [router]);

    const [showMenu, setShowMenu] = useState<boolean>(true)


    return (
        <section className=" relative flex w-full min-h-screen ">
            <section className="absolute flex flex-col h-full bg-green-forest text-white  z-20">
                <section className=" sticky top-32 z-10">
                    <div className={` transition-all duration-300 ${!showMenu ? 'w-0' : 'w-full px-2'} overflow-hidden pt-2`}>
                        <Link className="w-full px-2 py-1 text-xl  hover:bg-cream-light hover:text-green-dark " href={'/plam-admin/'}>
                            <span >MENU</span>
                        </Link>
                        <ul className="flex flex-col gap-1">
                            <li className=" rounded flex hover:bg-cream-light hover:text-green-dark">
                                <Link className="w-full px-2 py-1 " href={'/plam-admin/animales'}>
                                    <span >Animales</span>
                                </Link>
                            </li>

                            <li className=" rounded flex hover:bg-cream-light hover:text-green-dark">
                                <Link className="w-full px-2 py-1 " href={'/plam-admin/usuarios'}>
                                    <span >Usuarios</span>
                                </Link>
                            </li>

                        </ul>
                    </div>
                    <button className='absolute -right-5 top-1/2 -z-10  bg-green-forest  rounded-r-3xl h-20 ' onClick={() => setShowMenu(!showMenu)} >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className='w-6 h-6 transition-all duration-500' style={{ transform: showMenu ? 'rotateY(-180deg)' : 'rotateY(0deg)', perspective: '1000px' }}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                        </svg>

                    </button>
                </section>
            </section>
            <section className=" flex justify-center w-full overflow-x-scroll ">

                {children}

            </section>

        </section>
    )

}
