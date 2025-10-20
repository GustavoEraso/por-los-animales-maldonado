'use client';
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
 * - **Zoom in/out functionality** - Scale images with percentage control while maintaining aspect ratio
 * - **Cross-device panning** - Desktop mouse drag (pointer events) and mobile single-finger drag (touch events)
 * - **Native scroll-based panning** - Uses browser's native scroll mechanics for smooth movement
 * - **Automatic boundary constraints** - Browser-native scroll limits prevent images from moving outside the viewport
 * - **Multi-image navigation** - Switch between multiple images with preloading for instant transitions
 * - **Responsive design** - Adapts to container size changes automatically via ResizeObserver
 * - **Image caching** - Preloads and caches images for smooth, flicker-free experience
 * - **Cover sizing algorithm** - Intelligently calculates image dimensions to fill container appropriately
 * - **Hidden scrollbars** - Clean UI with invisible but functional scrollbars
 * - **Smooth transitions** - Animated zoom changes for better user experience
 *
 * **Interaction Methods:**
 * - Desktop: Click and drag with mouse to pan, use zoom buttons to scale
 * - Mobile: Single-finger drag to pan (multi-touch gestures not supported), tap zoom buttons to scale
 * - Prevents page scrolling on mobile during interaction via non-passive touch listeners
 *
 * **Technical Implementation:**
 * The component uses a scroll-based positioning system for panning combined with direct
 * width/height manipulation for zoom. When zoomed in, the image wrapper becomes larger than
 * its container, enabling native scroll behavior. The drag gesture modifies `scrollLeft` and
 * `scrollTop` properties for smooth, performant panning with automatic boundary constraints
 * handled by the browser.
 *
 * **Important: html2canvas Compatibility:**
 * Zoom is applied by directly modifying width/height (width * scale, height * scale) rather
 * than using CSS transform: scale(). This is critical for html2canvas compatibility, as CSS
 * transforms are visual-only and don't affect the actual DOM layout that html2canvas captures.
 * Direct dimension manipulation ensures the zoomed state is correctly captured in the generated image.
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
 * @param {CSSLength} [props.width] - Width of the image container (optional, inherits from parent by default)
 * @param {CSSLength} [props.height] - Height of the image container (optional, inherits from parent by default)
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
  const mainRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Cache for already decoded images
  const cache = useRef<Map<string, HTMLImageElement>>(new Map());

  // Visual state
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [src, setSrc] = useState<string | null>(null);
  const [imgSize, setImgSize] = useState<{ width: number; height: number }>({
    width: 0,
    height: 0,
  });

  // Zoom state
  const [scale, setScale] = useState(1);

  /**
   * Loads and caches an image for instant display.
   * Uses the Image.decode() API when available for better performance.
   */
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

  /**
   * Effect to preload and display the current image.
   * Calculates the cover-sized dimensions to fill the container.
   * Also preloads neighboring images for instant navigation.
   */
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

      const containerSize = containerRef.current?.getBoundingClientRect();
      if (!containerSize) return;

      // Calculate image size for cover behavior
      const containerRatio = containerSize.width / containerSize.height;
      const imgRatio = img.naturalWidth / img.naturalHeight;
      let displayWidth = 0;
      let displayHeight = 0;

      if (imgRatio > containerRatio) {
        // Image is wider than container - match height and overflow width
        displayHeight = containerSize.height;
        displayWidth = img.naturalWidth * (containerSize.height / img.naturalHeight);
      } else {
        // Image is taller than container - match width and overflow height
        displayWidth = containerSize.width;
        displayHeight = img.naturalHeight * (containerSize.width / img.naturalWidth);
      }

      // Set calculated image dimensions
      setImgSize({
        width: displayWidth,
        height: displayHeight,
      });
      setScale(1);
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

  /**
   * Setup native touch event listeners with { passive: false } to allow preventDefault.
   * This is necessary to prevent page scrolling during single-finger touch interactions on mobile.
   * Note: Multi-touch gestures (like pinch-to-zoom) are not supported in this implementation.
   */
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const preventScroll = (e: TouchEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };

    // Add non-passive touch listeners to prevent default scrolling
    container.addEventListener('touchstart', preventScroll, { passive: false });
    container.addEventListener('touchmove', preventScroll, { passive: false });

    return () => {
      container.removeEventListener('touchstart', preventScroll);
      container.removeEventListener('touchmove', preventScroll);
    };
  }, []);

  /**
   * Effect to recalculate image size when mainRef container changes dimensions.
   * Uses ResizeObserver to detect size changes and adjust the image to maintain cover behavior.
   */
  useEffect(() => {
    const mainContainer = mainRef.current;
    if (!mainContainer || !src) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;

        // Only recalculate if we have a loaded image
        const cachedImg = cache.current.get(imageUrls[currentImageIndex]);
        if (!cachedImg) return;

        // Calculate image size for cover behavior
        const containerRatio = width / height;
        const imgRatio = cachedImg.naturalWidth / cachedImg.naturalHeight;
        let displayWidth = 0;
        let displayHeight = 0;

        if (imgRatio > containerRatio) {
          // Image is wider than container - match height and overflow width
          displayHeight = height;
          displayWidth = cachedImg.naturalWidth * (height / cachedImg.naturalHeight);
        } else {
          // Image is taller than container - match width and overflow height
          displayWidth = width;
          displayHeight = cachedImg.naturalHeight * (width / cachedImg.naturalWidth);
        }

        // Update image dimensions
        setImgSize({
          width: displayWidth,
          height: displayHeight,
        });
      }
    });

    resizeObserver.observe(mainContainer);

    return () => {
      resizeObserver.disconnect();
    };
  }, [src, imageUrls, currentImageIndex]);

  /**
   * Drag (pan) functionality using native scroll.
   * Instead of manipulating CSS position, we modify the scrollLeft/scrollTop
   * of the container, providing smooth panning with automatic boundary constraints.
   */
  const dragging = useRef(false);
  const dragData = useRef<{
    startX: number;
    startY: number;
    originX: number;
    originY: number;
  } | null>(null);

  /**
   * Initiates drag operation and stores initial scroll position.
   * Shared handler for both pointer events (desktop) and touch events (mobile).
   *
   * @param {number} clientX - X coordinate of the pointer/touch
   * @param {number} clientY - Y coordinate of the pointer/touch
   */
  const handleStart = (clientX: number, clientY: number) => {
    dragData.current = {
      startX: clientX,
      startY: clientY,
      originX: containerRef.current?.scrollLeft || 0,
      originY: containerRef.current?.scrollTop || 0,
    };
    dragging.current = true;
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    handleStart(e.clientX, e.clientY);
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    // Only handle single-finger touch for panning
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      handleStart(touch.clientX, touch.clientY);
    }
  };

  /**
   * Handles pointer/touch movement during drag operation.
   * Updates scroll position in the opposite direction of the drag delta
   * to create natural panning behavior.
   *
   * @param {number} clientX - Current X coordinate of the pointer/touch
   * @param {number} clientY - Current Y coordinate of the pointer/touch
   */
  const handleMovement = (clientX: number, clientY: number) => {
    if (!dragging.current || !dragData.current) return;

    const { startX, startY, originX, originY } = dragData.current;
    const deltaX = clientX - startX;
    const deltaY = clientY - startY;

    containerRef.current?.scrollTo({
      left: originX - deltaX,
      top: originY - deltaY,
      behavior: 'auto',
    });
  };

  const handleMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging.current) return;
    handleMovement(e.clientX, e.clientY);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    // Ignore multi-touch gestures
    if (e.touches.length !== 1) return;
    if (!dragging.current) return;

    const touch = e.touches[0];
    handleMovement(touch.clientX, touch.clientY);
  };

  /**
   * Ends drag operation and releases pointer capture.
   */
  const handleEnd = () => {
    dragging.current = false;
    dragData.current = null;
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.releasePointerCapture(e.pointerId);
    handleEnd();
  };

  const handleTouchEnd = () => {
    handleEnd();
  };

  /**
   * Handles zoom in/out operations.
   * Prevents zooming out below the container size to maintain coverage.
   * Applies zoom by directly modifying width/height dimensions (not CSS transforms)
   * to ensure html2canvas correctly captures the zoomed state.
   *
   * @param {number} porcentaje - Percentage to adjust zoom (positive to zoom in, negative to zoom out)
   */
  const handleZoom = (porcentaje: number) => {
    const mainContainer = mainRef.current?.getBoundingClientRect();
    const containerSize = containerRef.current?.getBoundingClientRect();

    if (!containerSize || !mainContainer) return;

    const newScale = scale + porcentaje / 100;

    if (
      porcentaje < 0 &&
      containerSize.width * newScale < mainContainer.width &&
      containerSize.height * newScale < mainContainer.height
    )
      return;

    if (newScale < 0.1) return;
    setScale(newScale);
  };

  return (
    <div
      ref={mainRef}
      className={styles.mainContainer + (className ? ` ${className}` : '')}
      style={{ width: toCss(width), height: toCss(height) }}
    >
      <div
        ref={containerRef}
        className={styles.imgContainer}
        onPointerDown={handlePointerDown}
        onPointerMove={handleMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
      >
        {src && (
          <div
            className={styles.imgWrapper}
            style={{
              width: imgSize.width * scale + 'px',
              height: imgSize.height * scale + 'px',
            }}
          >
            <img src={src} alt="" className={styles.imgElement} />
          </div>
        )}
      </div>
      <div className={styles.mainControlerContainer}>
        <section data-html2canvas-ignore className={styles.controlerContainer}>
          <button onClick={() => handleZoom(-5)}>&#x2796;&#xFE0E;</button>
          <span>zoom {Math.round(scale * 100)}%</span>
          <button onClick={() => handleZoom(5)}>&#x2795;&#xFE0E;</button>
        </section>

        <section data-html2canvas-ignore className={styles.dragContainer}>
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
    </div>
  );
}
