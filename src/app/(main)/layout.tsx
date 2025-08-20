'use client';
import React, { useState, useEffect } from 'react';
import WhatsAppFloat from "@/components/WhatsAppFloat";

import { fetchContacts } from '@/lib/fetchContacts';
import { WpContactType } from '@/types';


export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  const [contacts,setContacts] = useState<WpContactType[]>([])

  useEffect(() => {
    const fetchData = async () => {
      const contacts = await fetchContacts();
      setContacts(contacts);
    };
    fetchData();
  }, []);

  return (
    <>
      {children}
      {contacts && <WhatsAppFloat contacts={contacts} />}
    </>
  );
}