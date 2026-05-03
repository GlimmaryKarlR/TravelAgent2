import React, { useEffect, useRef } from "react";
import createGlobe from "cobe";

interface GlobeProps {
  onSelect: (location: string) => void;
}

export default function Globe({ onSelect }: GlobeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointerInteracting = useRef<number | null>(null);
  const pointerInteractionPos = useRef(0);
  const r = useRef(0);

  useEffect(() => {
    let phi = 0;
    let width = 0;
    const onResize = () => canvasRef.current && (width = canvasRef.current.offsetWidth)

    window.addEventListener('resize', onResize)
    onResize()

    if (!canvasRef.current) return;

    // markers location: [latitude, longitude]
    const globe = createGlobe(canvasRef.current, {
      devicePixelRatio: 2,
      width: width * 2,
      height: width * 2,
      phi: 0,
      theta: 0,
      dark: 1,
      diffuse: 1.2,
      mapSamples: 16000,
      mapBrightness: 6,
      baseColor: [0.3, 0.3, 0.3],
      markerColor: [0.83, 0.69, 0.22], // Gold
      glowColor: [1, 1, 1],
      markers: [
        { location: [35.6762, 139.6503], size: 0.05 }, // Tokyo
        { location: [48.8566, 2.3522], size: 0.05 },  // Paris
        { location: [40.7128, -74.0060], size: 0.05 }, // NY
        { location: [-33.8688, 151.2093], size: 0.05 }, // Sydney
        { location: [25.2048, 55.2708], size: 0.05 }, // Dubai
      ],
    });

    let rafId: number;
    const update = () => {
      if (pointerInteracting.current === null) {
        phi += 0.005;
      }
      globe.update({ 
        phi: phi + r.current,
        width: width * 2,
        height: width * 2
      });
      rafId = requestAnimationFrame(update);
    }
    update();

    return () => {
      globe.destroy();
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  return (
    <div className="relative w-full max-w-[400px] aspect-square mx-auto cursor-grab active:cursor-grabbing">
      <canvas
        ref={canvasRef}
        onPointerDown={(e) => {
          pointerInteracting.current = e.clientX - pointerInteractionPos.current;
        }}
        onPointerUp={() => {
          pointerInteracting.current = null;
        }}
        onPointerOut={() => {
          pointerInteracting.current = null;
        }}
        onMouseMove={(e) => {
          if (pointerInteracting.current !== null) {
            const delta = e.clientX - pointerInteracting.current;
            pointerInteractionPos.current = delta;
            r.current = delta / 150;
          }
        }}
        style={{
          width: 400,
          height: 400,
          maxWidth: "100%",
          aspectRatio: "1",
        }}
      />
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-dark via-transparent to-transparent opacity-60" />
    </div>
  );
}
