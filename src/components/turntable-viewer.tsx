"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  /** Pasta com os quadros numerados 0001.webp, 0002.webp… */
  dir: string;
  count: number;
  alt: string;
  /** Voltas por segundo no giro automático. */
  speed?: number;
};

const frameUrl = (dir: string, i: number) => `${dir}/${String(i + 1).padStart(4, "0")}.webp`;

// Giro 360° feito com quadros reais: realismo fotográfico, arrastar para girar.
export function TurntableViewer({ dir, count, alt, speed = 0.12 }: Props) {
  const imgRef = useRef<HTMLImageElement>(null);
  const [loaded, setLoaded] = useState(0);
  const state = useRef({ pos: 0, dragging: false, lastX: 0, idleAt: 0 });

  // Pré-carrega todos os quadros para o giro não piscar.
  useEffect(() => {
    let done = 0;
    const imgs = Array.from({ length: count }, (_, i) => {
      const img = new Image();
      img.decoding = "async";
      img.onload = () => setLoaded(++done);
      img.src = frameUrl(dir, i);
      return img;
    });
    return () => imgs.forEach((img) => (img.onload = null));
  }, [dir, count]);

  const ready = loaded >= count;

  useEffect(() => {
    if (!ready) return;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    let prev = performance.now();
    let shown = -1;
    const tick = (now: number) => {
      const s = state.current;
      const dt = (now - prev) / 1000;
      prev = now;
      if (!reduce && !s.dragging && now > s.idleAt) s.pos += dt * speed * count;
      const frame = ((Math.round(s.pos) % count) + count) % count;
      if (frame !== shown && imgRef.current) {
        imgRef.current.src = frameUrl(dir, frame);
        shown = frame;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [ready, dir, count, speed]);

  const onDown = (e: React.PointerEvent) => {
    state.current.dragging = true;
    state.current.lastX = e.clientX;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onMove = (e: React.PointerEvent) => {
    const s = state.current;
    if (!s.dragging) return;
    // Uma largura de tela arrastada ≈ uma volta completa.
    s.pos -= ((e.clientX - s.lastX) / window.innerWidth) * count;
    s.lastX = e.clientX;
  };
  const onUp = () => {
    state.current.dragging = false;
    state.current.idleAt = performance.now() + 2500;
  };

  return (
    <div
      className="absolute inset-0 flex cursor-grab touch-pan-y select-none items-center justify-center active:cursor-grabbing"
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={onUp}
      role="img"
      aria-label={alt}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={imgRef}
        src={frameUrl(dir, 0)}
        alt=""
        draggable={false}
        className={`pointer-events-none h-[88%] w-auto max-w-[92%] object-contain transition-opacity duration-700 ${
          ready ? "opacity-100" : "opacity-70"
        }`}
      />
      {!ready && (
        <div className="absolute bottom-16 h-0.5 w-28 overflow-hidden rounded-full bg-white/10">
          <div className="h-full bg-ember" style={{ width: `${(loaded / count) * 100}%` }} />
        </div>
      )}
    </div>
  );
}
