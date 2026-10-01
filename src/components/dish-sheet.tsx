"use client";

import { useRef, type ReactNode } from "react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import { DONENESS, dishes, type Dish } from "@/data/menu";

gsap.registerPlugin(useGSAP);

type Props = {
  dish: Dish;
  onClose: () => void;
  onTable: (dish: Dish) => void;
  onGoTo: (dishId: string) => void;
};

// Tela 3 — ficha do prato em camadas (SPEC §5). O prato continua visível no topo.
export function DishSheet({ dish, onClose, onTable, onGoTo }: Props) {
  const scope = useRef<HTMLDivElement>(null);
  const closing = useRef(false);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.from("[data-s='backdrop']", { opacity: 0, duration: 0.5 });
        gsap.from("[data-s='panel']", { yPercent: 100, duration: 0.75, ease: "power2.inOut" });
        gsap.from("[data-s='block']", { opacity: 0, y: 14, duration: 0.9, ease: "expo.out", stagger: 0.07, delay: 0.35 });
      });
    },
    { scope },
  );

  const close = () => {
    if (closing.current) return;
    closing.current = true;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return onClose();
    gsap.to(scope.current!.querySelector("[data-s='panel']"), { yPercent: 100, duration: 0.55, ease: "power2.inOut" });
    gsap.to(scope.current!.querySelector("[data-s='backdrop']"), { opacity: 0, duration: 0.55, onComplete: onClose });
  };

  const wine = dish.pairing && dishes.find((d) => d.id === dish.pairing!.dishId);
  const gallery = [dish.media.poster, ...(dish.media.gallery ?? [])];

  const blocks: { title: string; body: ReactNode }[] = [
    {
      title: "O prato",
      body: (
        <>
          <p className="text-[15px] leading-relaxed text-ink/80">{dish.description}</p>
          <div className="no-scrollbar -mx-5 mt-5 flex snap-x gap-2 overflow-x-auto px-5">
            {gallery.map((src) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={src}
                src={src}
                alt=""
                loading="lazy"
                className="h-56 w-44 shrink-0 snap-start object-cover"
              />
            ))}
          </div>
        </>
      ),
    },
  ];

  if (dish.origin?.length) {
    blocks.push({
      title: dish.moment === "vinhos" ? "Origem" : "Origem e técnica",
      body: (
        <ol className="relative ml-1 border-l hairline">
          {dish.origin.map((o) => (
            <li key={o.label} className="relative pb-5 pl-5 last:pb-0">
              <span className="absolute -left-[3px] top-1.5 size-[5px] rounded-full bg-accent" />
              <p className="caption text-ink/45">{o.label}</p>
              <p className="mt-1 text-[15px]">{o.value}</p>
            </li>
          ))}
        </ol>
      ),
    });
  }

  if (dish.doneness !== undefined) {
    blocks.push({
      title: "Ponto",
      body: (
        <div>
          <div className="grid grid-cols-5 gap-1">
            {DONENESS.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 ${i === dish.doneness ? "bg-ember" : "bg-ink/10"}`}
                style={{ opacity: i === dish.doneness ? 1 : 0.4 + i * 0.12 }}
              />
            ))}
          </div>
          <p className="mt-3 text-[15px]">
            <span className="text-ember">{DONENESS[dish.doneness]}</span>
            <span className="text-ink/55"> é o ponto que o chef recomenda. Diga ao garçom se preferir outro.</span>
          </p>
        </div>
      ),
    });
  }

  if (wine && dish.pairing) {
    blocks.push({
      title: "Harmonização",
      body: (
        <button type="button" onClick={() => onGoTo(wine.id)} className="flex w-full items-center gap-4 text-left">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={wine.media.poster} alt="" className="h-24 w-16 shrink-0 object-cover" />
          <span>
            <span className="display block text-[1.6rem]">{wine.name}</span>
            <span className="mt-1 block text-[13px] text-ink/60">{dish.pairing.note}</span>
            <span className="caption mt-2 block text-accent">{wine.price} · Ver na carta</span>
          </span>
        </button>
      ),
    });
  }

  if (dish.table) {
    const { width, depth, height } = dish.table.dimensions;
    blocks.push({
      title: "Na sua mesa",
      body: (
        <div>
          <dl className="grid grid-cols-4 border-y hairline py-4 text-center">
            {[
              ["Larg.", `${width}`],
              ["Prof.", `${depth}`],
              ["Alt.", `${height}`],
              ["Peso", dish.table.weight],
            ].map(([k, v]) => (
              <div key={k}>
                <dt className="caption text-ink/45">{k}</dt>
                <dd className="display mt-1 text-[1.4rem]">{v}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-2 text-[12px] text-ink/45">Medidas em centímetros, com a tábua ou o prato de serviço.</p>
          <button
            type="button"
            onClick={() => onTable(dish)}
            className="mt-5 flex h-12 w-full items-center justify-center bg-ink text-[15px] font-medium text-paper active:opacity-80"
          >
            Ver em tamanho real
          </button>
        </div>
      ),
    });
  }

  return (
    <div ref={scope} className="fixed inset-0 z-30" role="dialog" aria-modal="true" aria-label={dish.name}>
      <button
        type="button"
        data-s="backdrop"
        aria-label="Fechar"
        onClick={close}
        className="absolute inset-0 bg-paper/55"
      />
      <div
        data-s="panel"
        className="no-scrollbar absolute inset-x-0 bottom-0 max-h-[88dvh] overflow-y-auto border-t hairline bg-paper px-5 pb-[max(2rem,env(safe-area-inset-bottom))]"
      >
        <div className="sticky top-0 z-10 -mx-5 flex items-center justify-between bg-paper/95 px-5 py-4 backdrop-blur">
          <p className="display text-[1.6rem]">{dish.name}</p>
          <button type="button" onClick={close} className="caption py-2 pl-4 text-ink/60">
            Fechar
          </button>
        </div>

        {blocks.map((b, i) => (
          <section key={b.title} data-s="block" className="border-t hairline pb-8 pt-5">
            <h3 className="caption mb-5 text-accent">
              {String(i + 1).padStart(2, "0")} — {b.title}
            </h3>
            {b.body}
          </section>
        ))}

        <footer data-s="block" className="border-t hairline pt-5 text-[13px] text-ink/50">
          {dish.allergens.length > 0 && <p>Contém: {dish.allergens.join(", ").toLowerCase()}.</p>}
          <p className="mt-1">Para pedir, chame o garçom.</p>
        </footer>
      </div>
    </div>
  );
}
