
// import type { HTMLAttributes } from 'react';
// import { useState, useEffect, useRef } from 'react';
// import styles from './styles.module.css';

// type CSSLength = number | string;
// const toCss = (v?: CSSLength) => (typeof v === 'number' ? `${v}px` : v);

// type AdjustableImageProps = HTMLAttributes<HTMLDivElement> & {
//     imageUrls: string[];
//     width?: CSSLength;
//     height?: CSSLength;
// };

// export default function AdjustableImage({
//     imageUrls,
//     width = '60%',
//     height = '100%',
//     className,
// }: AdjustableImageProps) {
//     const imgRef = useRef<HTMLDivElement>(null);

//     // cache de imágenes ya decodificadas
//     const cache = useRef<Map<string, HTMLImageElement>>(new Map());

//     // estado visual
//     const [currentImageIndex, setCurrentImageIndex] = useState(0);
//     const [src, setSrc] = useState<string | null>(null);

//     // tamaños base (intrínsecos) y dibujados (px)
//     const sizesRef = useRef({ w: 0, h: 0 });     // naturalWidth/Height de la imagen actual
//     const [bgSize, setBgSize] = useState({ w: 0, h: 0 });

//     // pan/zoom
//     const [x, setX] = useState(10);
//     const [y, setY] = useState(10);
//     const [size, setSize] = useState(100);

//     // ---------- helpers ----------
//     const clamp = (v: number) => Math.max(0, Math.min(100, v));

//     const loadImage = (url: string) =>
//         new Promise<HTMLImageElement>((resolve) => {
//             if (cache.current.has(url)) return resolve(cache.current.get(url)!);
//             const img = new Image();
//             img.crossOrigin = 'anonymous';
//             img.src = url;
//             const done = () => {
//                 cache.current.set(url, img);
//                 resolve(img);
//             };
//             if (typeof img.decode === 'function') {
//                 img.decode().then(done, done); // on fulfilled o rejected
//             } else {
//                 img.addEventListener('load', done, { once: true });
//                 img.addEventListener('error', done, { once: true });
//             }
//         });

//     const computeCoverSize = (Wc: number, Hc: number, Wi: number, Hi: number) => {
//         const r = Wi / Hi;
//         const hIfFitWidth = Wc / r;  // alto si ajusto por ancho
//         const wIfFitHeight = Hc * r; // ancho si ajusto por alto
//         // cover => el que cubra más
//         if (hIfFitWidth < Hc) return { w: wIfFitHeight, h: Hc };
//         return { w: Wc, h: hIfFitWidth };
//     };

//     // ---------- precarga y “swap” instantáneo ----------
//     useEffect(() => {
//         let alive = true;
//         const url = imageUrls[currentImageIndex];
//         if (!url) { setSrc(null); return; }

//         loadImage(url).then((img) => {
//             if (!alive) return;

//             // actualiza fuente visible
//             setSrc(url);

//             // guarda tamaño intrínseco
//             sizesRef.current = { w: img.naturalWidth, h: img.naturalHeight };

//             // calcula cover en px respecto al contenedor
//             const el = imgRef.current;
//             const Wc = el?.offsetWidth ?? 0;
//             const Hc = el?.offsetHeight ?? 0;
//             if (Wc && Hc) {
//                 const cover = computeCoverSize(Wc, Hc, img.naturalWidth, img.naturalHeight);
//                 setBgSize(cover);
//                 setSize(100);
//             }
//         });

//         // precarga vecinos para que el próximo cambio sea inmediato
//         const prev = imageUrls[currentImageIndex - 1];
//         const next = imageUrls[(currentImageIndex + 1) % imageUrls.length];
//         if (prev) { void loadImage(prev); }
//         if (next) { void loadImage(next); }

//         return () => { alive = false; };
//     }, [imageUrls, currentImageIndex]);

//     // ---------- zoom (en base al tamaño intrínseco guardado) ----------
//     const handleSize = (percentage: number) => {
//         if (!imgRef.current) return;
//         const elementWidth = imgRef.current.offsetWidth || 0;
//         const elementHeight = imgRef.current.offsetHeight || 0;

//         const newW = bgSize.w + (sizesRef.current.w * (percentage / 100));
//         const newH = bgSize.h + (sizesRef.current.h * (percentage / 100));

//         // no permitir achicar por debajo del contenedor
//         if (newW < elementWidth || newH < elementHeight) return;

//         setSize((prev) => prev + percentage);
//         setBgSize({ w: newW, h: newH });
//     };

//     // ---------- drag (pan) ----------
//     const dragging = useRef(false);
//     const dragData = useRef<{
//         startX: number; startY: number; originX: number; originY: number; width: number; height: number;
//     } | null>(null);

//     const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
//         const rect = e.currentTarget.getBoundingClientRect();
//         dragData.current = {
//             startX: e.clientX,
//             startY: e.clientY,
//             originX: x,
//             originY: y,
//             width: rect.width,
//             height: rect.height,
//         };
//         dragging.current = true;
//         e.currentTarget.setPointerCapture(e.pointerId);
//     };

//     const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
//         if (!dragging.current || !dragData.current) return;
//         const { startX, startY, originX, originY, width, height } = dragData.current;
//         const dxPx = e.clientX - startX;
//         const dyPx = e.clientY - startY;

//         const factor = size >= 100 ? -1 : 1;

//         setX(clamp(originX + factor * (dxPx / width) * 100));
//         setY(clamp(originY + factor * (dyPx / height) * 100));
//     };

//     const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
//         dragging.current = false;
//         e.currentTarget.releasePointerCapture(e.pointerId);
//     };

//     // ---------- UI ----------
//     return (
//         <div
//             ref={imgRef}
//             className={`${styles.main} ${className ?? ''}`}
//             style={{
//                 backgroundImage: src ? `url(${src})` : 'none',
//                 backgroundPosition: `${x}% ${y}%`,
//                 backgroundSize: `${bgSize.w}px ${bgSize.h}px`,
//                 width: toCss(width),
//                 height: toCss(height),
//             }}
//         >
//             <section data-html2canvas-ignore className={styles.controlerContainer}>
//                 <button onClick={() => handleSize(-5)}>&#x2796;&#xFE0E;</button>
//                 <span>zoom {size}%</span>
//                 <button onClick={() => handleSize(5)}>&#x2795;&#xFE0E;</button>
//             </section>

//             <section
//                 data-html2canvas-ignore
//                 className={styles.dragContainer}
//                 onPointerDown={handlePointerDown}
//                 onPointerMove={handlePointerMove}
//                 onPointerUp={handlePointerUp}
//                 onPointerLeave={handlePointerUp}
//                 onPointerCancel={handlePointerUp}
//             >
//                 <span>arrastra para ajustar la imagen</span>
//             </section>

//             {imageUrls.length > 1 && <section data-html2canvas-ignore className={styles.controlerContainer}>
//                 <button onClick={() => setCurrentImageIndex(i => (i - 1 + imageUrls.length) % imageUrls.length)}>&#x2770;</button>
//                 <span>imagen</span>
//                 <button onClick={() => setCurrentImageIndex(i => (i + 1) % imageUrls.length)}>&#x2771;</button>
//             </section>}
//         </div>
//     );
// }

import type { HTMLAttributes } from 'react';
import { useState, useEffect, useRef } from 'react';
import styles from './styles.module.css';

type CSSLength = number | string;
const toCss = (v?: CSSLength) => (typeof v === 'number' ? `${v}px` : v);

type AdjustableImageProps = HTMLAttributes<HTMLDivElement> & {
    imageUrls: string[];
    width?: CSSLength;
    height?: CSSLength;
};

export default function AdjustableImage({
    imageUrls,
    width = '60%',
    height = '100%',
    className,
}: AdjustableImageProps) {
    const imgRef = useRef<HTMLDivElement>(null);

    // cache de imágenes ya decodificadas
    const cache = useRef<Map<string, HTMLImageElement>>(new Map());

    // estado visual
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [src, setSrc] = useState<string | null>(null);

    // tamaños base (intrínsecos) y dibujados (px)
    const sizesRef = useRef({ w: 0, h: 0 });     // naturalWidth/Height de la imagen actual
    const [bgSize, setBgSize] = useState({ w: 0, h: 0 });

    // pan/zoom
    const [x, setX] = useState(10);
    const [y, setY] = useState(10);
    const [size, setSize] = useState(100);

    // estado para trackear el tamaño del contenedor
    const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

    // ---------- helpers ----------
    const clamp = (v: number) => Math.max(0, Math.min(100, v));

    const loadImage = (url: string) =>
        new Promise<HTMLImageElement>((resolve) => {
            if (cache.current.has(url)) return resolve(cache.current.get(url)!);
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.src = url;
            const done = () => {
                cache.current.set(url, img);
                resolve(img);
            };
            if (typeof img.decode === 'function') {
                img.decode().then(done, done); // on fulfilled o rejected
            } else {
                img.addEventListener('load', done, { once: true });
                img.addEventListener('error', done, { once: true });
            }
        });

    const computeCoverSize = (Wc: number, Hc: number, Wi: number, Hi: number) => {
        const r = Wi / Hi;
        const hIfFitWidth = Wc / r;  // alto si ajusto por ancho
        const wIfFitHeight = Hc * r; // ancho si ajusto por alto
        // cover => el que cubra más
        if (hIfFitWidth < Hc) return { w: wIfFitHeight, h: Hc };
        return { w: Wc, h: hIfFitWidth };
    };

    // función para recalcular el bgSize basado en el contenedor actual
    const recalculateBgSize = () => {
        if (!imgRef.current || !sizesRef.current.w || !sizesRef.current.h) return;

        const Wc = imgRef.current.offsetWidth;
        const Hc = imgRef.current.offsetHeight;

        if (Wc && Hc) {
            const cover = computeCoverSize(Wc, Hc, sizesRef.current.w, sizesRef.current.h);

            // Aplicar el factor de zoom actual
            const zoomFactor = size / 100;
            setBgSize({
                w: cover.w * zoomFactor,
                h: cover.h * zoomFactor
            });

            setContainerSize({ width: Wc, height: Hc });
        }
    };

    // ---------- Observer para cambios de tamaño del contenedor ----------
    useEffect(() => {
        if (!imgRef.current) return;

        const resizeObserver = new ResizeObserver((entries) => {
            for (const entry of entries) {
                const { width, height } = entry.contentRect;

                // Solo recalcular si realmente cambió el tamaño
                if (width !== containerSize.width || height !== containerSize.height) {
                    requestAnimationFrame(() => {
                        recalculateBgSize();
                    });
                }
            }
        });

        resizeObserver.observe(imgRef.current);

        return () => {
            resizeObserver.disconnect();
        };
    }, [containerSize.width, containerSize.height, size]);

    // ---------- precarga y "swap" instantáneo ----------
    useEffect(() => {
        let alive = true;
        const url = imageUrls[currentImageIndex];
        if (!url) { setSrc(null); return; }

        loadImage(url).then((img) => {
            if (!alive) return;

            // actualiza fuente visible
            setSrc(url);

            // guarda tamaño intrínseco
            sizesRef.current = { w: img.naturalWidth, h: img.naturalHeight };

            // calcula cover en px respecto al contenedor
            const el = imgRef.current;
            const Wc = el?.offsetWidth ?? 0;
            const Hc = el?.offsetHeight ?? 0;
            if (Wc && Hc) {
                const cover = computeCoverSize(Wc, Hc, img.naturalWidth, img.naturalHeight);
                setBgSize(cover);
                setSize(100);
                setContainerSize({ width: Wc, height: Hc });
            }
        });

        // precarga vecinos para que el próximo cambio sea inmediato
        const prev = imageUrls[currentImageIndex - 1];
        const next = imageUrls[(currentImageIndex + 1) % imageUrls.length];
        if (prev) { void loadImage(prev); }
        if (next) { void loadImage(next); }

        return () => { alive = false; };
    }, [imageUrls, currentImageIndex]);

    // ---------- zoom (en base al tamaño intrínseco guardado) ----------
    const handleSize = (percentage: number) => {
        if (!imgRef.current) return;
        const elementWidth = imgRef.current.offsetWidth || 0;
        const elementHeight = imgRef.current.offsetHeight || 0;

        const newSize = size + percentage;
        const zoomFactor = newSize / 100;

        // Calcular el tamaño base (cover) para el contenedor actual
        const baseCover = computeCoverSize(elementWidth, elementHeight, sizesRef.current.w, sizesRef.current.h);

        const newW = baseCover.w * zoomFactor;
        const newH = baseCover.h * zoomFactor;

        // no permitir achicar por debajo del contenedor
        if (newW < elementWidth || newH < elementHeight) return;

        setSize(newSize);
        setBgSize({ w: newW, h: newH });
    };

    // ---------- drag (pan) ----------
    const dragging = useRef(false);
    const dragData = useRef<{
        startX: number; startY: number; originX: number; originY: number; width: number; height: number;
    } | null>(null);

    const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        dragData.current = {
            startX: e.clientX,
            startY: e.clientY,
            originX: x,
            originY: y,
            width: rect.width,
            height: rect.height,
        };
        dragging.current = true;
        e.currentTarget.setPointerCapture(e.pointerId);
    };

    const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
        if (!dragging.current || !dragData.current) return;
        const { startX, startY, originX, originY, width, height } = dragData.current;
        const dxPx = e.clientX - startX;
        const dyPx = e.clientY - startY;

        const factor = size >= 100 ? -1 : 1;

        setX(clamp(originX + factor * (dxPx / width) * 100));
        setY(clamp(originY + factor * (dyPx / height) * 100));
    };

    const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
        dragging.current = false;
        e.currentTarget.releasePointerCapture(e.pointerId);
    };

    // ---------- UI ----------
    return (
        <div
            ref={imgRef}
            className={`${styles.main} ${className ?? ''}`}
            style={{
                backgroundImage: src ? `url(${src})` : 'none',
                backgroundPosition: `${x}% ${y}%`,
                backgroundSize: `${bgSize.w}px ${bgSize.h}px`,
                width: toCss(width),
                height: toCss(height),
            }}
        >
            <section data-html2canvas-ignore className={styles.controlerContainer}>
                <button onClick={() => handleSize(-5)}>&#x2796;&#xFE0E;</button>
                <span>zoom {size}%</span>
                <button onClick={() => handleSize(5)}>&#x2795;&#xFE0E;</button>
            </section>

            <section
                data-html2canvas-ignore
                className={styles.dragContainer}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerLeave={handlePointerUp}
                onPointerCancel={handlePointerUp}
            >
                <span>arrastra para ajustar la imagen</span>
            </section>

            {imageUrls.length > 1 && <section data-html2canvas-ignore className={styles.controlerContainer}>
                <button onClick={() => setCurrentImageIndex(i => (i - 1 + imageUrls.length) % imageUrls.length)}>&#x2770;</button>
                <span>imagen</span>
                <button onClick={() => setCurrentImageIndex(i => (i + 1) % imageUrls.length)}>&#x2771;</button>
            </section>}
        </div>
    );
}