'use client';

import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap/dist/gsap';
import Chart from '@/components/Chart';

export default function PlamAdmin() {
  const cardsRef = useRef<HTMLDivElement>(null);

  // Datos mock para empezar
  const adoptionsData = [
    { label: 'Ene', value: 12 },
    { label: 'Feb', value: 8 },
    { label: 'Mar', value: 15 },
    { label: 'Abr', value: 20 },
    { label: 'May', value: 18 },
    { label: 'Jun', value: 25 },
  ];

  const statusData = [
    { name: 'En adopción', value: 45 },
    { name: 'Adoptados', value: 30 },
    { name: 'En tratamiento', value: 15 },
  ];

  const donationsData = [
    { label: '$50', value: 12 },
    { label: '$100', value: 3 },
    { label: '$200', value: 100 },
    { label: '$500', value: 8 },
    { label: '$1000+', value: 5 },
  ];

  // Datos para comparación de ingresos vs egresos
  const ingresosEgresosData = [
    {
      label: 'Ene',
      datasets: [
        { name: 'Ingresos', value: 2500 },
        { name: 'salidas', value: 1800 },
      ],
    },
    {
      label: 'Feb',
      datasets: [
        { name: 'Ingresos', value: 3200 },
        { name: 'papas', value: 2100 },
      ],
    },
    {
      label: 'Mar',
      datasets: [
        { name: 'Ingresos', value: 2800 },
        { name: 'Egresos', value: 2500 },
      ],
    },
    {
      label: 'Abr',
      datasets: [
        { name: 'Ingresos', value: 4100 },
        { name: 'Egresos', value: 2200 },
      ],
    },
    {
      label: 'May',
      datasets: [
        { name: 'Ingresos', value: 3600 },
        { name: 'Egresos', value: 2800 },
      ],
    },
    {
      label: 'Jun',
      datasets: [
        { name: 'Ingresos', value: 4200 },
        { name: 'Egresos', value: 3100 },
      ],
    },
  ];

  // Animación de las cards al cargar
  useEffect(() => {
    if (!cardsRef.current) return;

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
        duration: 0.8,
        stagger: 0.15,
        ease: 'back.out(1.7)',
        delay: 1.5, // Después de los charts
      }
    );
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
          Dashboard - Por Los Animales Maldonado
        </h1>

        {/* Statistics Cards */}
        <div ref={cardsRef} className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg p-6 shadow-lg">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Total Animales</h3>
            <p className="text-3xl font-bold text-blue-600">142</p>
            <p className="text-sm text-gray-500 mt-1">+12 este mes</p>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-lg">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Adopciones</h3>
            <p className="text-3xl font-bold text-green-600">38</p>
            <p className="text-sm text-gray-500 mt-1">+8 este mes</p>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-lg">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Donaciones</h3>
            <p className="text-3xl font-bold text-purple-600">$2,340</p>
            <p className="text-sm text-gray-500 mt-1">+$180 esta semana</p>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-lg p-6 shadow-lg">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Adopciones por Mes</h2>
            <Chart type="line" data={adoptionsData} colors={['#8884d8']} />
          </div>

          <div className="bg-white rounded-lg p-6 shadow-lg">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Estado de Animales</h2>
            <Chart type="pie" data={statusData} colors={['#ff7300', '#8dd1e1', '#d084d0']} />
          </div>
        </div>

        {/* Segundo row - Multi-line chart y bar chart */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-lg p-6 shadow-lg">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Ingresos vs Egresos</h2>
            <Chart type="line" data={ingresosEgresosData} colors={['#10b981', '#ef4444']} />
          </div>

          <div className="bg-white rounded-lg p-6 shadow-lg">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Donaciones por Monto</h2>
            <Chart type="bar" data={donationsData} colors={['#ffc658']} />
          </div>
        </div>
      </div>
    </div>
  );
}
