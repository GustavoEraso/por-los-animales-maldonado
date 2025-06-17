'use client'

import { useEffect, useState } from "react";
import { UserType } from "@/types";
import { getFirestoreData } from "@/lib/firebase/getFirestoreData";

export default function PlamAdmin() {

    const [users, setUsers] = useState<UserType[]>([])

    useEffect(() => {
        const getData = async () => {
            const res = await getFirestoreData({ currentCollection: 'authorizedEmails' })
            setUsers(res)
            console.log(res)
        }
        getData()
    }, [])
    return (
        <main className="flex flex-col   min-h-screen p-4 ">
            <h1 className="text-3xl font-bold mb-4">Esta es la lista de usuarios autorizados</h1>
            <table className="w-full text-sm text-left rtl:text-right ">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                    <tr>
                        <th className="w-fit py-1 bg-green-forest text-white" scope="col">
                            <span className=" py-3 px-2 md:px-4 lg:px-6 w-full text-start hover:bg-gray-300" >Email</span>
                        </th>
                        <th className="w-fit py-1 bg-green-forest text-white" scope="col">
                            <span className=" py-3 px-2 md:px-4 lg:px-6 w-full text-start hover:bg-gray-300" >nombre</span>
                        </th>
                        <th className="w-fit py-1 bg-green-forest text-white" scope="col">
                            <span className=" py-3 px-2 md:px-4 lg:px-6 w-full text-start hover:bg-gray-300" >Rol</span>
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {
                        users.length > 0 && users?.map((user) => (
                            <tr key={user.id} className="bg-white border-b hover:bg-gray-50">
                                <td scope="row" className="px-2 py-4 outline-1 outline-slate-200 font-medium text-gray-900 whitespace-nowrap ">
                                    {user.id}
                                </td>
                                <td className="px-2 py-4 outline-1 outline-slate-200">
                                    {user.name}
                                </td>
                                <td className="px-2 py-4 outline-1 outline-slate-200">
                                    {user.role}
                                </td>
                            </tr>
                        ))
                    }

                </tbody>
            </table>


        </main>
    );
}