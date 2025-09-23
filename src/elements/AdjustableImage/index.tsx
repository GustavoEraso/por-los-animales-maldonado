import React from 'react';
import type { HTMLAttributes } from 'react';
import { useState, useEffect, useRef } from 'react';
import styles from './styles.module.css';

/**
 * CSS length value type (number in pixels or string with units).
 */
type CSSLength = number | string;

/**
 * Converts a CSS length value to a CSS string.
 *
 * @param {CSSLength} [v] - The value to convert
 * @returns {string | undefined} CSS string value
 */
const toCss = (v?: CSSLength): string | undefined => (typeof v === 'number' ? `${v}px` : v);

/**
 * Props for the AdjustableImage component.
 */
type AdjustableImageProps = HTMLAttributes<HTMLDivElement> & {
  /** Array of image URLs to display */
  imageUrls: string[];
  /** Width of the image container */
  width?: CSSLength;
  /** Height of the image container */
  height?: CSSLength;
};

/**
 * Advanced image viewer component with zoom, pan, and navigation capabilities.
 *
 * Provides an interactive image viewing experience with the following features:
 * - Zoom in/out functionality with percentage control
 * - Pan/drag to adjust image position within the container
 * - Navigation between multiple images with preloading
 * - Responsive design that adapts to container size changes
 * - Image caching for smooth transitions
 * - Cover sizing to ensure images fill the container appropriately
 *
 * **Special Use Case - Poster/Canvas Generation:**
 * This component is designed to work seamlessly with html2canvas and similar libraries
 * for generating images or posters. Users can precisely position and adjust images
 * before capturing the final result. The `data-html2canvas-ignore` attributes ensure
 * control elements are excluded from the generated output, providing a clean capture
 * of only the adjusted image content.
 *
 * @param {AdjustableImageProps} props - Component props
 * @param {string[]} props.imageUrls - Array of image URLs to display
 * @param {CSSLength} [props.width='60%'] - Width of the image container
 * @param {CSSLength} [props.height='100%'] - Height of the image container
 * @param {string} [props.className] - Additional CSS classes
 * @returns {React.ReactElement} The rendered adjustable image component
 *
 * @example
 * // Basic usage with single image
 * <AdjustableImage imageUrls={['/animal1.jpg']} />
 *
 * @example
 * // Multiple images with custom dimensions
 * <AdjustableImage
 *   imageUrls={['/dog1.jpg', '/dog2.jpg', '/dog3.jpg']}
 *   width={400}
 *   height={300}
 *   className="custom-viewer"
 * />
 *
 * @example
 * // Gallery of animal photos for poster generation
 * const animalPhotos = [
 *   '/animals/luna-perro.jpg',
 *   '/animals/michi-gato.jpg',
 *   '/animals/rocky-perro.jpg'
 * ];
 * <AdjustableImage imageUrls={animalPhotos} width="100%" height="400px" />
 *
 * @example
 * // Usage with html2canvas for poster generation
 * <AdjustableImage
 *   imageUrls={animal.images.map(img => img.imgUrl)}
 *   width="300px"
 *   height="300px"
 *   className="poster-image-adjuster"
 * />
 */
export default function AdjustableImage({
  imageUrls,
  width = '60%',
  height = '100%',
  className,
}: AdjustableImageProps): React.ReactElement {
  const imgRef = useRef<HTMLDivElement>(null);

  // Cache for already decoded images
  const cache = useRef<Map<string, HTMLImageElement>>(new Map());

  // Visual state
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [src, setSrc] = useState<string | null>(null);

  // Base (intrinsic) and rendered (px) sizes
  const sizesRef = useRef({ w: 0, h: 0 }); // naturalWidth/Height of current image
  const [bgSize, setBgSize] = useState({ w: 0, h: 0 });

  // Pan/zoom state
  const [x, setX] = useState(10);
  const [y, setY] = useState(10);
  const [size, setSize] = useState(100);

  // Container size tracking state
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  // Helper functions
  const clamp = (v: number) => Math.max(0, Math.min(100, v));

  // Loads and caches an image
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
        img.decode().then(done, done); // on fulfilled or rejected
      } else {
        img.addEventListener('load', done, { once: true });
        img.addEventListener('error', done, { once: true });
      }
    });

  // Computes cover size to fill container while maintaining aspect ratio
  const computeCoverSize = (Wc: number, Hc: number, Wi: number, Hi: number) => {
    const r = Wi / Hi;
    const hIfFitWidth = Wc / r; // height if fit by width
    const wIfFitHeight = Hc * r; // width if fit by height
    // cover => the one that covers more
    if (hIfFitWidth < Hc) return { w: wIfFitHeight, h: Hc };
    return { w: Wc, h: hIfFitWidth };
  };

  // Function to recalculate bgSize based on current container
  const recalculateBgSize = () => {
    if (!imgRef.current || !sizesRef.current.w || !sizesRef.current.h) return;

    const Wc = imgRef.current.offsetWidth;
    const Hc = imgRef.current.offsetHeight;

    if (Wc && Hc) {
      const cover = computeCoverSize(Wc, Hc, sizesRef.current.w, sizesRef.current.h);

      // Apply current zoom factor
      const zoomFactor = size / 100;
      setBgSize({
        w: cover.w * zoomFactor,
        h: cover.h * zoomFactor,
      });

      setContainerSize({ width: Wc, height: Hc });
    }
  };

  // ResizeObserver for container size changes
  useEffect(() => {
    if (!imgRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;

        // Only recalculate if size actually changed
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

  // Preload and instant swap
  useEffect(() => {
    let alive = true;
    const url = imageUrls[currentImageIndex];
    if (!url) {
      setSrc(null);
      return;
    }

    loadImage(url).then((img) => {
      if (!alive) return;

      // Update visible source
      setSrc(url);

      // Store intrinsic size
      sizesRef.current = { w: img.naturalWidth, h: img.naturalHeight };

      // Calculate cover in px relative to container
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

    // Preload neighbors so next change is immediate
    const prev = imageUrls[currentImageIndex - 1];
    const next = imageUrls[(currentImageIndex + 1) % imageUrls.length];
    if (prev) {
      void loadImage(prev);
    }
    if (next) {
      void loadImage(next);
    }

    return () => {
      alive = false;
    };
  }, [imageUrls, currentImageIndex]);

  // Zoom functionality (based on stored intrinsic size)
  const handleSize = (percentage: number) => {
    if (!imgRef.current) return;
    const elementWidth = imgRef.current.offsetWidth || 0;
    const elementHeight = imgRef.current.offsetHeight || 0;

    const newSize = size + percentage;
    const zoomFactor = newSize / 100;

    // Calcular el tamaño base (cover) para el contenedor actual
    const baseCover = computeCoverSize(
      elementWidth,
      elementHeight,
      sizesRef.current.w,
      sizesRef.current.h
    );

    const newW = baseCover.w * zoomFactor;
    const newH = baseCover.h * zoomFactor;

    // Don't allow shrinking below container size
    if (newW < elementWidth || newH < elementHeight) return;

    setSize(newSize);
    setBgSize({ w: newW, h: newH });
  };

  // Drag (pan) functionality
  const dragging = useRef(false);
  const dragData = useRef<{
    startX: number;
    startY: number;
    originX: number;
    originY: number;
    width: number;
    height: number;
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

  // Component UI
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

      {imageUrls.length > 1 && (
        <section data-html2canvas-ignore className={styles.controlerContainer}>
          <button
            onClick={() =>
              setCurrentImageIndex((i) => (i - 1 + imageUrls.length) % imageUrls.length)
            }
          >
            &#x2770;
          </button>
          <span>imagen</span>
          <button onClick={() => setCurrentImageIndex((i) => (i + 1) % imageUrls.length)}>
            &#x2771;
          </button>
        </section>
      )}
    </div>
  );
}
