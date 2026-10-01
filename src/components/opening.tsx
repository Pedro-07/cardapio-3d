"use client";

import { useRef } from "react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import { restaurant } from "@/data/menu";

gsap.registerPlugin(useGSAP);

type Props = {
  table?: string;
  video: string;
  poster: string;
  onEnter: () => void;
};

const today = () =>
  new Date()
    .toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })
    .replace("-feira", "");

// Tela 1 — abertura (SPEC §5). Cria o clima antes de qualquer prato.
export function Opening({ table, video, poster, onEnter }: Props) {
  const scope = useRef<HTMLDivElement>(null);
  const leaving = useRef(false);
  const touchY = useRef<number | null>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
        tl.fromTo("[data-o='bg']", { opacity: 0 }, { opacity: 1, duration: 1.6, ease: "power2.inOut" })
          .from("[data-o='letter']", { yPercent: 110, duration: 1.2, stagger: 0.06 }, 0.3)
          .from("[data-o='fade']", { opacity: 0, y: 12, duration: 1, stagger: 0.12 }, 0.9);
      });
    },
    { scope },
  );

  const leave = () => {
    if (leaving.current) return;
    leaving.current = true;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return onEnter();
    gsap.to(scope.current, { yPercent: -100, duration: 0.9, ease: "power2.inOut", onComplete: onEnter });
  };

  return (
    <div
      ref={scope}
      className="fixed inset-0 z-40 flex flex-col overflow-hidden bg-paper"
      onWheel={(e) => e.deltaY > 20 && leave()}
      onTouchStart={(e) => (touchY.current = e.touches[0].clientY)}
      onTouchMove={(e) => {
        if (touchY.current !== null && touchY.current - e.touches[0].clientY > 50) leave();
      }}
    >
      <div data-o="bg" className="absolute inset-0">
        <video
          src={video}
          poster={poster}
          autoPlay
          muted
          loop
          playsInline
          className="h-full w-full scale-110 object-cover opacity-40 blur-[6px]"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-paper/70 via-paper/30 to-paper" />
      </div>

      <div className="relative flex flex-1 flex-col px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(1.25rem,env(safe-area-inset-top))]">
        <p data-o="fade" className="caption text-ink/60">
          {table ? `Mesa ${table} · ` : ""}
          {today()}
        </p>

        <div className="mt-auto">
          <h1 className="display overflow-hidden text-[clamp(5.5rem,34vw,9rem)] leading-[0.85]" aria-label={restaurant.name}>
            {restaurant.name.split("").map((l, i) => (
              <span key={i} data-o="letter" className="inline-block">
                {l}
              </span>
            ))}
          </h1>
          <p data-o="fade" className="caption mt-3 text-accent">
            {restaurant.subtitle}
          </p>

          <figure data-o="fade" className="mt-10 border-l hairline pl-4">
            <blockquote className="display text-[1.6rem] italic leading-[1.15] text-ink/90">
              “{restaurant.chefNote}”
            </blockquote>
            <figcaption className="caption mt-3 text-ink/50">{restaurant.chef} · Nota da noite</figcaption>
          </figure>

          <button
            data-o="fade"
            type="button"
            onClick={leave}
            className="mt-10 flex w-full items-center justify-between border-t hairline pt-5 text-left"
          >
            <span className="text-[15px]">Ver o cardápio</span>
            <span className="caption text-ink/50">Deslize para cima ↑</span>
          </button>
        </div>
      </div>
    </div>
  );
}
