"use client";

import { forwardRef, useEffect, useRef } from "react";
import { gsap } from "gsap";
import { SplitText } from "gsap/SplitText";
import { useGSAP } from "@gsap/react";
import { moments, roman, type Dish } from "@/data/menu";

gsap.registerPlugin(useGSAP, SplitText);

type Props = {
  dishes: Dish[];
  active: number;
  onActiveChange: (index: number) => void;
  onOpen: (dish: Dish) => void;
};

const momentName = (d: Dish) => moments.find((m) => m.id === d.moment)?.name ?? "";

// Tela 2 — pratos em tela cheia com snap vertical (SPEC §5).
export const DishReel = forwardRef<HTMLDivElement, Props>(function DishReel(
  { dishes, active, onActiveChange, onOpen },
  ref,
) {
  const scope = useRef<HTMLDivElement | null>(null);
  const videos = useRef<(HTMLVideoElement | null)[]>([]);

  // O prato "assentado" é o que ocupa a maior parte da tela.
  useEffect(() => {
    const root = scope.current;
    if (!root) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) onActiveChange(Number((e.target as HTMLElement).dataset.slide));
        }
      },
      { root, threshold: 0.6 },
    );
    root.querySelectorAll("[data-slide]").forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [onActiveChange]);

  // Só o prato visível toca vídeo; os vizinhos ficam no pôster (bateria e dados).
  useEffect(() => {
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    videos.current.forEach((v, i) => {
      if (!v) return;
      if (i === active && !reduce) v.play().catch(() => {});
      else v.pause();
    });
  }, [active]);

  // Nome do prato revelado linha a linha ao assentar.
  useGSAP(
    () => {
      const slide = scope.current?.querySelector(`[data-slide="${active}"]`);
      const title = slide?.querySelector("[data-r='title']");
      if (!slide || !title) return;
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const split = SplitText.create(title, { type: "lines", mask: "lines" });
        gsap.from(split.lines, { yPercent: 100, duration: 1.1, ease: "expo.out", stagger: 0.08 });
        gsap.from(slide.querySelectorAll("[data-r='fade']"), {
          opacity: 0,
          y: 10,
          duration: 0.9,
          ease: "expo.out",
          delay: 0.3,
          stagger: 0.06,
        });
        return () => split.revert();
      });
    },
    { scope, dependencies: [active], revertOnUpdate: true },
  );

  return (
    <div
      ref={(el) => {
        scope.current = el;
        if (typeof ref === "function") ref(el);
        else if (ref) ref.current = el;
      }}
      className="no-scrollbar h-dvh snap-y snap-mandatory overflow-y-scroll"
    >
      {dishes.map((d, i) => {
        const isActive = i === active;
        return (
          <section
            key={d.id}
            id={`prato-${d.id}`}
            data-slide={i}
            className="relative h-dvh snap-start snap-always overflow-hidden"
            aria-label={d.name}
          >
            {d.media.video ? (
              <video
                ref={(el) => {
                  videos.current[i] = el;
                }}
                src={d.media.video}
                poster={d.media.poster}
                muted
                loop
                playsInline
                preload={Math.abs(i - active) <= 1 ? "auto" : "none"}
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={isActive ? "on" : "off"}
                src={d.media.poster}
                alt=""
                loading={Math.abs(i - active) <= 1 ? "eager" : "lazy"}
                className={`absolute inset-0 h-full w-full object-cover ${isActive ? "slow-zoom" : ""}`}
              />
            )}
            <div className="absolute inset-x-0 bottom-0 h-[62%] bg-gradient-to-t from-paper via-paper/80 to-transparent" />

            <div className="absolute inset-x-0 bottom-0 px-5 pb-[max(1.75rem,env(safe-area-inset-bottom))]">
              <p data-r="fade" className="caption text-accent">
                {roman(i + 1)} · {momentName(d)}
              </p>
              <h2 data-r="title" className="display mt-3 text-[clamp(3.1rem,14.5vw,5.5rem)]">
                {d.name}
              </h2>
              <p data-r="fade" className="mt-4 text-[13px] tracking-wide text-ink/65">
                {d.facts.join("  ·  ")}
              </p>
              <div data-r="fade" className="mt-6 flex items-end justify-between border-t hairline pt-4">
                <span className="display text-[1.75rem] text-accent">{d.price}</span>
                <button
                  type="button"
                  onClick={() => onOpen(d)}
                  className="caption -mb-1 py-2 text-ink underline decoration-accent/60 underline-offset-[6px]"
                >
                  Conhecer o prato
                </button>
              </div>
            </div>
          </section>
        );
      })}
    </div>
  );
});
