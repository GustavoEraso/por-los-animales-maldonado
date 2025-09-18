# TODO: Mejoras Sugeridas para el Proyecto

## 1️⃣ Estructura y Organización
- Reorganizar carpetas por dominio funcional (ej: animals/, auth/, donations/)
  ```
  src/
   ├── features/
   │   ├── animals/
   │   │   ├── components/
   │   │   ├── hooks/
   │   │   └── api/
   │   ├── donations/
   │   └── auth/
  ```

- Separar componentes UI de lógica de negocio (crear carpeta ui/)
  ```
  src/
   ├── ui/
   │   ├── buttons/
   │   ├── cards/
   │   ├── forms/
   │   └── layout/
   └── features/
  ```

## 2️⃣ Performance
- Optimizar carga de GSAP usando imports específicos
  ```jsx
  // Antes: Importando toda la librería GSAP
  import gsap from 'gsap';
  
  // Después: Imports específicos para reducir bundle size
  import { gsap } from 'gsap/dist/gsap';
  import { ScrollTrigger } from 'gsap/dist/ScrollTrigger';
  
  // Registrar solo los plugins necesarios
  gsap.registerPlugin(ScrollTrigger);
  ```

- Lazy loading de componentes pesados con dynamic()
  ```jsx
  // En pages/adopciones.js
  import dynamic from 'next/dynamic';
  
  // Componente cargado solo cuando es necesario
  const PhotoCarrousel = dynamic(
    () => import('@/components/PhotoCarrousel'),
    {
      loading: () => <div className="loading-skeleton h-64 w-full"></div>,
      ssr: false // Desactivar SSR para componentes con dependencias de cliente
    }
  );
  
  export default function AdopcionesPage() {
    return (
      <main>
        <h1>Animales en Adopción</h1>
        <PhotoCarrousel />
      </main>
    );
  }
  ```

- Implementar ISR (Incremental Static Regeneration) para páginas populares
  ```jsx
  // En pages/animales/[id].js
  export async function getStaticProps({ params }) {
    const { id } = params;
    const animal = await fetchAnimal(id);
    
    return {
      props: { animal },
      revalidate: 3600, // Revalidar cada hora
    };
  }
  
  export async function getStaticPaths() {
    const animales = await fetchAnimalesDestacados();
    
    return {
      paths: animales.map(animal => ({ params: { id: animal.id } })),
      fallback: 'blocking', // Genera nuevas páginas bajo demanda
    };
  }
  ```

## 3️⃣ Seguridad y Validación
- Implementar Zod para validación de inputs en APIs y formularios
  ```tsx
  // En lib/schemas/animalSchema.ts
  import { z } from 'zod';
  
  export const animalSchema = z.object({
    nombre: z.string().min(1, "El nombre es requerido"),
    edad: z.number().int().positive().optional(),
    tipo: z.enum(["perro", "gato", "otro"]),
    descripcion: z.string().max(500, "La descripción no puede exceder 500 caracteres"),
    fotos: z.array(z.string().url()).min(1, "Se requiere al menos una foto"),
    adoptado: z.boolean().default(false),
    contacto: z.object({
      nombre: z.string(),
      telefono: z.string().regex(/^\d{9}$/, "Debe ser un número de 9 dígitos"),
      email: z.string().email("Email inválido").optional()
    })
  });
  
  export type Animal = z.infer<typeof animalSchema>;
  
  // En app/api/animales/route.ts
  import { animalSchema } from '@/lib/schemas/animalSchema';
  import { NextRequest, NextResponse } from 'next/server';
  
  export async function POST(req: NextRequest) {
    try {
      const body = await req.json();
      
      // Validación con Zod
      const result = animalSchema.safeParse(body);
      
      if (!result.success) {
        return NextResponse.json(
          { error: result.error.format() },
          { status: 400 }
        );
      }
      
      // Datos validados
      const validatedData = result.data;
      
      // Continuar con la lógica de negocio...
      
    } catch (error) {
      return NextResponse.json(
        { error: 'Error interno del servidor' },
        { status: 500 }
      );
    }
  }
  ```

- Centralizar autenticación con middleware
  ```tsx
  // En middleware.ts
  import { NextResponse } from 'next/server';
  import type { NextRequest } from 'next/server';
  import { getAuth } from '@firebase/auth';
  
  export function middleware(request: NextRequest) {
    // Obtener token de la cookie o header
    const token = request.cookies.get('auth-token')?.value;
    
    // Rutas protegidas
    const protectedPaths = [
      '/admin',
      '/perfil',
      '/donaciones/historial',
    ];
    
    // Verificar si la ruta actual está protegida
    const isProtectedPath = protectedPaths.some(path => 
      request.nextUrl.pathname.startsWith(path)
    );
    
    if (isProtectedPath && !token) {
      // Redirigir a login con returnUrl
      const url = new URL('/login', request.url);
      url.searchParams.set('returnUrl', request.nextUrl.pathname);
      return NextResponse.redirect(url);
    }
    
    return NextResponse.next();
  }
  
  export const config = {
    matcher: [
      '/admin/:path*',
      '/perfil/:path*',
      '/donaciones/:path*',
    ],
  };
  ```

## 4️⃣ Developer Experience
- Añadir ESLint y Prettier para consistencia de código
  ```json
  // .eslintrc.json
  {
    "extends": [
      "next/core-web-vitals",
      "prettier"
    ],
    "plugins": ["prettier"],
    "rules": {
      "prettier/prettier": "error",
      "react/no-unescaped-entities": "off",
      "react-hooks/exhaustive-deps": "warn",
      "no-console": ["warn", { "allow": ["warn", "error"] }],
      "import/order": ["error", {
        "groups": [
          ["builtin", "external"],
          "internal",
          ["parent", "sibling", "index"]
        ],
        "newlines-between": "always",
        "alphabetize": { "order": "asc" }
      }]
    }
  }
  
  // .prettierrc
  {
    "semi": true,
    "singleQuote": true,
    "tabWidth": 2,
    "trailingComma": "es5",
    "printWidth": 80,
    "arrowParens": "avoid"
  }
  ```

- Implementar tests con Jest/Vitest y React Testing Library
  ```jsx
  // En tests/components/Card.test.tsx
  import { render, screen } from '@testing-library/react';
  import userEvent from '@testing-library/user-event';
  import Card from '@/components/Card';
  
  describe('Card Component', () => {
    const mockProps = {
      title: 'Perro en adopción',
      description: 'Hermoso perro busca hogar',
      image: '/perro.jpg',
      buttonText: 'Más información',
      onClick: vi.fn(),
    };
  
    it('renders correctly with all props', () => {
      render(<Card {...mockProps} />);
      
      expect(screen.getByText(mockProps.title)).toBeInTheDocument();
      expect(screen.getByText(mockProps.description)).toBeInTheDocument();
      expect(screen.getByRole('img')).toHaveAttribute('src', expect.stringContaining(mockProps.image));
      expect(screen.getByRole('button')).toHaveTextContent(mockProps.buttonText);
    });
  
    it('calls onClick when button is clicked', async () => {
      render(<Card {...mockProps} />);
      
      await userEvent.click(screen.getByRole('button'));
      expect(mockProps.onClick).toHaveBeenCalledTimes(1);
    });
  });
  
  // En vitest.config.ts
  import { defineConfig } from 'vitest/config';
  import react from '@vitejs/plugin-react';
  import { resolve } from 'path';
  
  export default defineConfig({
    plugins: [react()],
    test: {
      environment: 'jsdom',
      globals: true,
      setupFiles: ['./tests/setup.ts'],
    },
    resolve: {
      alias: {
        '@': resolve(__dirname, './src'),
      },
    },
  });
  ```

- Configurar Husky para pre-commit hooks
  ```bash
  # Instalación
  pnpm add -D husky lint-staged
  
  # Inicializar Husky
  npx husky install
  
  # Crear pre-commit hook
  npx husky add .husky/pre-commit "npx lint-staged"
  ```
  
  ```json
  // package.json (añadir)
  {
    "lint-staged": {
      "*.{js,jsx,ts,tsx}": [
        "eslint --fix",
        "prettier --write"
      ],
      "*.{json,css,md}": [
        "prettier --write"
      ]
    },
    "scripts": {
      "prepare": "husky install"
    }
  }
  ```

## 5️⃣ UX/UI
- Implementar sistema de notificaciones centralizado (ej: toast)
  ```tsx
  // En contexts/NotificationContext.tsx
  import React, { createContext, useContext, useState } from 'react';
  
  type NotificationType = 'success' | 'error' | 'warning' | 'info';
  
  interface Notification {
    id: string;
    message: string;
    type: NotificationType;
    duration?: number;
  }
  
  interface NotificationContextType {
    notifications: Notification[];
    showNotification: (message: string, type: NotificationType, duration?: number) => void;
    dismissNotification: (id: string) => void;
  }
  
  const NotificationContext = createContext<NotificationContextType | undefined>(undefined);
  
  export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
  
    const showNotification = (message: string, type: NotificationType, duration = 5000) => {
      const id = Date.now().toString();
      
      setNotifications(prev => [...prev, { id, message, type, duration }]);
      
      if (duration > 0) {
        setTimeout(() => {
          dismissNotification(id);
        }, duration);
      }
    };
  
    const dismissNotification = (id: string) => {
      setNotifications(prev => prev.filter(notification => notification.id !== id));
    };
  
    return (
      <NotificationContext.Provider value={{ notifications, showNotification, dismissNotification }}>
        {children}
        <ToastContainer />
      </NotificationContext.Provider>
    );
  };
  
  const ToastContainer: React.FC = () => {
    const { notifications, dismissNotification } = useContext(NotificationContext)!;
  
    return (
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
        {notifications.map(notification => (
          <div 
            key={notification.id}
            className={`toast toast-${notification.type} p-4 rounded-md shadow-md flex justify-between`}
          >
            <p>{notification.message}</p>
            <button onClick={() => dismissNotification(notification.id)}>×</button>
          </div>
        ))}
      </div>
    );
  };
  
  export const useNotification = () => {
    const context = useContext(NotificationContext);
    if (context === undefined) {
      throw new Error('useNotification must be used within a NotificationProvider');
    }
    return context;
  };
  
  // Uso en componentes
  const MyComponent = () => {
    const { showNotification } = useNotification();
    
    const handleSubmit = async () => {
      try {
        await saveData();
        showNotification('Datos guardados correctamente', 'success');
      } catch (error) {
        showNotification('Error al guardar los datos', 'error');
      }
    };
    
    return <button onClick={handleSubmit}>Guardar</button>;
  };
  ```

- Mejorar estados de loading con skeletons
  ```tsx
  // En components/SkeletonCard.tsx
  export default function SkeletonCard() {
    return (
      <div className="card w-full animate-pulse">
        <div className="bg-gray-300 h-48 rounded-t-md"></div>
        <div className="p-4 space-y-3">
          <div className="h-6 bg-gray-300 rounded w-3/4"></div>
          <div className="h-4 bg-gray-300 rounded w-1/2"></div>
          <div className="h-4 bg-gray-300 rounded w-5/6"></div>
          <div className="h-10 bg-gray-300 rounded w-1/3 mt-4"></div>
        </div>
      </div>
    );
  }
  
  // En components/AnimalList.tsx
  import { useState, useEffect } from 'react';
  import Card from './Card';
  import SkeletonCard from './SkeletonCard';
  import { fetchAnimals } from '@/lib/fetchAnimal';
  
  export default function AnimalList() {
    const [animals, setAnimals] = useState([]);
    const [loading, setLoading] = useState(true);
    
    useEffect(() => {
      const loadAnimals = async () => {
        try {
          const data = await fetchAnimals();
          setAnimals(data);
        } catch (error) {
          console.error('Error fetching animals', error);
        } finally {
          setLoading(false);
        }
      };
      
      loadAnimals();
    }, []);
    
    if (loading) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      );
    }
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {animals.map(animal => (
          <Card
            key={animal.id}
            title={animal.nombre}
            description={animal.descripcion}
            image={animal.fotos[0]}
            buttonText="Ver detalles"
            onClick={() => { /* navegación */ }}
          />
        ))}
      </div>
    );
  }
  ```

## 6️⃣ Optimizaciones Avanzadas
- Implementar SWR o React Query para manejo de estado del servidor
  ```tsx
  // En hooks/useAnimals.ts con SWR
  import useSWR from 'swr';
  
  const fetcher = (url: string) => fetch(url).then(res => {
    if (!res.ok) throw new Error('Error en la petición');
    return res.json();
  });
  
  export function useAnimals(filters?: Record<string, any>) {
    const queryString = filters ? `?${new URLSearchParams(filters).toString()}` : '';
    const { data, error, isLoading, mutate } = useSWR(
      `/api/animales${queryString}`, 
      fetcher,
      {
        revalidateOnFocus: false,
        revalidateIfStale: false,
        dedupingInterval: 60000, // 1 minuto
      }
    );
  
    return {
      animals: data,
      isLoading,
      isError: !!error,
      error,
      mutate, // Para actualizar el cache manualmente
    };
  }
  
  // Uso en componente
  import { useAnimals } from '@/hooks/useAnimals';
  
  export default function AnimalsPage() {
    const [filters, setFilters] = useState({ tipo: 'perro' });
    const { animals, isLoading, isError } = useAnimals(filters);
    
    // Interfaz para cambiar filtros
    const handleFilterChange = (newFilters) => {
      setFilters(prev => ({ ...prev, ...newFilters }));
    };
    
    if (isLoading) return <SkeletonGrid />;
    if (isError) return <ErrorMessage />;
    
    return (
      <div>
        <FilterControls filters={filters} onChange={handleFilterChange} />
        <AnimalGrid animals={animals} />
      </div>
    );
  }
  ```

- Optimizar bundle size con Webpack Bundle Analyzer
  ```js
  // En next.config.js
  const withBundleAnalyzer = require('@next/bundle-analyzer')({
    enabled: process.env.ANALYZE === 'true',
  });
  
  module.exports = withBundleAnalyzer({
    // Configuración existente
    images: {
      domains: ['res.cloudinary.com'],
    },
    // Optimizaciones adicionales
    webpack: (config, { dev, isServer }) => {
      // Ejemplo: Excluir moment.js locales para reducir tamaño
      if (!isServer) {
        config.resolve.alias = {
          ...config.resolve.alias,
          moment$: 'moment/moment.js',
        };
      }
      
      return config;
    },
  });
  
  // En package.json (añadir script)
  {
    "scripts": {
      "analyze": "ANALYZE=true next build"
    }
  }
  ```

## Priorización Sugerida
- Alta prioridad: Validación con Zod, notificaciones, optimización GSAP
- Media prioridad: Reorganización de carpetas, tests, SWR/React Query
- Baja prioridad: Bundle analyzer, ISR, Husky hooks

---

*Este archivo resume las mejoras recomendadas por GitHub Copilot para el proyecto. Puedes ir tachando o agregando tareas según avances.*