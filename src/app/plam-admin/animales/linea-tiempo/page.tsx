'use client';
import { CalendarIcon, FilterIcon } from '@/components/Icons';
import Loader from '@/components/Loader';
import TransactionCard from '@/components/TransactionCard';
import { getFirestoreData } from '@/lib/firebase/getFirestoreData';
import { AnimalTransactionType } from '@/types';
import Link from 'next/dist/client/link';
import { useEffect, useState, useRef } from 'react';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const INITIAL_DATE_FILTER = {
  startDate: (() => {
    const date = new Date();
    date.setDate(date.getDate() - 3);
    date.setHours(0, 0, 0, 0);
    return date.getTime();
  })(),
  endDate: (() => {
    const date = new Date();
    date.setHours(23, 59, 59, 999);
    return date.getTime();
  })(),
};

const formatToLocalDateString = (timestamp: number): string => {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function LineaTiempoPage() {
  const [loading, setLoading] = useState<boolean>(false);
  const [transactions, setransactions] = useState<AnimalTransactionType[]>([]);
  const [dateFilter, setDateFilter] = useState<{ startDate: number; endDate: number }>(
    INITIAL_DATE_FILTER
  );

  const [searchControler, setSearchControler] = useState<boolean>(false);
  const MIN_LOADING_TIME = 600;

  const cardsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadData = async () => {
      const start = Date.now();
      try {
        setLoading(true);
        const data = await getFirestoreData({
          currentCollection: 'animalTransactions',
          orderBy: 'date',
          direction: 'desc',
          filter: [
            ['date', '>=', dateFilter.startDate],
            ['date', '<=', dateFilter.endDate],
          ],
        });
        setransactions(data);
      } catch (error) {
        console.error('Error loading transactions:', error);
      } finally {
        const elapsed = Date.now() - start;
        const remaining = MIN_LOADING_TIME - elapsed;
        if (remaining > 0) {
          setTimeout(() => {
            setLoading(false);
          }, remaining);
        } else {
          setLoading(false);
        }
      }
    };
    loadData();
  }, [searchControler]);

  // Animación de las cards cuando cargan los datos
  useGSAP(
    () => {
      if (loading || !transactions.length) return;

      // Animar las cards de estadísticas
      if (cardsRef.current) {
        const cards = cardsRef.current.children;
        gsap.fromTo(
          cards,
          {
            opacity: 0,
            y: 50,
            scale: 0.8,
          },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.6,
            stagger: 0.15,
            ease: 'back.out(1.7)',
          }
        );
      }
    },
    { dependencies: [loading, transactions], scope: cardsRef }
  );

  return (
    <section className=" bg-gradient-to-tr from-cream-light to-amber-sunset w-full p-2 sm:px-6 md:px-10 lg:px-20 flex flex-col gap-2  items-center pb-28">
      {loading && <Loader />}
      <div className="w-full flex flex-col gap-4 items-center justify-start ">
        <div className="w-full flex justify-start">
          <div className="flex   bg-cream-light p-3 rounded">
            <Link
              href={'/plam-admin/animales'}
              className="flex items-center gap-2 px-2 text-gray-400 "
            >
              <FilterIcon size="md" title="Filtros activos" />
              <h3 className="text-2xl font-bold underline">Animales Activos</h3>
            </Link>
            <div className="flex items-center gap-2 rounded p-2 bg-amber-sunset">
              <CalendarIcon size="md" className="text-gray-600" title="Calendario de adopciones" />
              <h4 className="text-2xl font-bold underline">ver eventos por fecha</h4>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-2 items-center justify-center bg-cream-light p-4 rounded">
          <h1 className="text-4xl font-bold underline">Linea del tiempo</h1>
          <div className="flex gap-4">
            <input
              className="bg-white px-2 rounded outline focus:outline-3 focus:outline-amber-sunset"
              type="date"
              value={formatToLocalDateString(dateFilter.startDate)}
              onChange={(e) => {
                if (!e.target.value) {
                  setDateFilter((prev) => ({
                    ...prev,
                    startDate: new Date().getTime() - 1 * 24 * 60 * 60 * 1000,
                  }));
                  return;
                }

                const [year, month, day] = e.target.value.split('-').map(Number);
                const uruguayDate = new Date(year, month - 1, day, 0, 0, 0, 0);

                setDateFilter((prev) => ({
                  ...prev,
                  startDate: uruguayDate.getTime(),
                }));
              }}
            />
            <input
              className="bg-white px-2 rounded outline focus:outline-3 focus:outline-amber-sunset"
              type="date"
              value={formatToLocalDateString(dateFilter.endDate)}
              onChange={(e) => {
                if (!e.target.value) {
                  setDateFilter((prev) => ({
                    ...prev,
                    endDate: new Date().getTime(),
                  }));
                  return;
                }

                const [year, month, day] = e.target.value.split('-').map(Number);
                const uruguayDate = new Date(year, month - 1, day, 23, 59, 59, 999);

                setDateFilter((prev) => ({
                  ...prev,
                  endDate: uruguayDate.getTime(),
                }));
              }}
            />
            <button
              className="rounded px-4 p-2 bg-black text-white"
              onClick={() => setSearchControler(!searchControler)}
            >
              Buscar
            </button>
          </div>
        </div>
      </div>
      <section className="w-full mb-6">
        <h2 className="text-2xl font-bold text-center mb-4 text-gray-800">
          Estadísticas del Período
        </h2>
        <div ref={cardsRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-green-dark rounded-3xl p-6 pb-2 shadow-lg">
            <h3 className="text-lg text-white mb-2">Total de Eventos</h3>
            <p className="text-7xl text-white">{transactions.length}</p>
            <p className="text-sm text-cream-light mt-1">Transacciones registradas</p>
          </div>
          <div className="bg-green-dark rounded-3xl p-6 pb-2 shadow-lg">
            <h3 className="text-lg text-white mb-2">Total de animales ingresados</h3>
            <p className="text-7xl text-white">
              {transactions.filter((t) => t.transactionType === 'create').length}
            </p>
            <p className="text-sm text-cream-light mt-1">Casos nuevos</p>
            {dateFilter.startDate < new Date('2025-12-01').getTime() && (
              <p className="text-xs text-cream-light mt-1">
                (no incluye ingresos anteriores al 01/12/25)
              </p>
            )}
          </div>
          <div className="bg-caramel-deep rounded-3xl p-6 pb-2 shadow-lg">
            <h3 className="text-lg text-white mb-2">Casos Atendidos</h3>
            <p className="text-7xl text-white">{new Set(transactions.map((t) => t.id)).size}</p>
            <p className="text-sm text-cream-light mt-1">Animales únicos</p>
          </div>

          <div className="bg-amber-sunset rounded-3xl p-6 pb-2 shadow-lg ">
            <h3 className="text-lg text-black mb-2">Adopciones</h3>
            <p className="text-7xl text-black">
              {
                transactions.filter(
                  (t) => t.status === 'adoptado' || t.changes?.after?.status === 'adoptado'
                ).length
              }
            </p>
            <p className="text-sm text-green-dark mt-1">Con familia nueva</p>
          </div>
          <div className="bg-green-forest rounded-3xl p-6 pb-2 shadow-lg sm:col-span-2">
            <h3 className="text-lg text-white mb-2">Deuda Generada</h3>
            <p className="text-7xl text-white">
              ${transactions.reduce((sum, t) => sum + (t.cost || 0), 0)}
            </p>
            <p className="text-sm text-cream-light mt-1">Total en gastos</p>
            {dateFilter.startDate < new Date('2025-12-01').getTime() && (
              <p className="text-xs text-cream-light mt-1">
                (no incluye gastos anteriores al 01/12/25)
              </p>
            )}
          </div>
        </div>
      </section>
      <ul className="flex flex-col max-w-3xl  ">
        {transactions.map((transaction, index) => (
          <li className="  border-l-2 relative pt-6 pl-2 " key={transaction.id + index}>
            <TransactionCard transaction={transaction} showImg />
          </li>
        ))}
      </ul>
    </section>
  );
}
