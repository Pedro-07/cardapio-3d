"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { dishes, moments, restaurant, type Dish } from "@/data/menu";
import { Opening } from "./opening";
import { DishReel } from "./dish-reel";
import { DishSheet } from "./dish-sheet";
import { TableView } from "./table-view";

type Props = { table?: string; initialId?: string };

const signature = dishes.find((d) => d.media.video) ?? dishes[0];

export function MenuExperience({ table, initialId }: Props) {
  const deepLink = dishes.findIndex((d) => d.id === initialId);
  const [opened, setOpened] = useState(deepLink >= 0);
  const [active, setActive] = useState(Math.max(0, deepLink));
  const [sheet, setSheet] = useState<Dish | null>(null);
  const [tableDish, setTableDish] = useState<Dish | null>(null);
  const reelRef = useRef<HTMLDivElement>(null);
  const momentsRef = useRef<HTMLDivElement>(null);

  const goTo = useCallback((index: number, smooth = true) => {
    reelRef.current
      ?.querySelector(`[data-slide="${index}"]`)
      ?.scrollIntoView({ behavior: smooth ? "smooth" : "instant", block: "start" });
  }, []);

  // Link direto para um prato (?prato=…): posiciona sem animação.
  useEffect(() => {
    if (deepLink > 0) goTo(deepLink, false);
  }, [deepLink, goTo]);

  const current = dishes[active];
  const currentMoment = current.moment;

  // Mantém o momento atual visível no índice (a lista é mais larga que a tela).
  useEffect(() => {
    const row = momentsRef.current;
    const el = row?.querySelector<HTMLElement>(`[data-moment="${currentMoment}"]`);
    if (row && el) row.scrollTo({ left: el.offsetLeft - 20, behavior: "smooth" });
  }, [currentMoment]);

  return (
    <main className="relative mx-auto h-dvh max-w-md overflow-hidden">
      <DishReel ref={reelRef} dishes={dishes} active={active} onActiveChange={setActive} onOpen={setSheet} />

      {/* Barra superior: marca + índice dos momentos com fio de progresso */}
      <nav
        className={`pointer-events-none absolute inset-x-0 top-0 z-20 bg-gradient-to-b from-paper/85 to-transparent px-5 pb-10 pt-[max(1rem,env(safe-area-inset-top))] transition-opacity duration-700 ${
          opened ? "opacity-100" : "opacity-0"
        }`}
        aria-label="Momentos do cardápio"
      >
        <div className="flex items-baseline justify-between">
          <span className="display text-[1.5rem] tracking-wide">{restaurant.name}</span>
          {table && <span className="caption text-ink/50">Mesa {table}</span>}
        </div>
        <div ref={momentsRef} className="no-scrollbar pointer-events-auto relative -mx-5 mt-3 flex gap-5 overflow-x-auto px-5">
          {moments.map((m) => {
            const isCurrent = m.id === currentMoment;
            return (
              <button
                key={m.id}
                data-moment={m.id}
                type="button"
                onClick={() => goTo(dishes.findIndex((d) => d.moment === m.id))}
                aria-current={isCurrent}
                className={`caption shrink-0 py-1 transition-colors duration-500 ${isCurrent ? "text-ink" : "text-ink/40"}`}
              >
                {m.name}
              </button>
            );
          })}
        </div>
        <div className="mt-2 h-px bg-ink/10">
          <div
            className="h-px bg-accent transition-[width] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]"
            style={{ width: `${((active + 1) / dishes.length) * 100}%` }}
          />
        </div>
      </nav>

      {!opened && (
        <Opening
          table={table}
          video={signature.media.video!}
          poster={signature.media.poster}
          onEnter={() => setOpened(true)}
        />
      )}

      {sheet && (
        <DishSheet
          key={sheet.id}
          dish={sheet}
          onClose={() => setSheet(null)}
          onTable={(d) => setTableDish(d)}
          onGoTo={(id) => {
            setSheet(null);
            goTo(dishes.findIndex((d) => d.id === id));
          }}
        />
      )}

      {tableDish?.table && (
        <TableView dish={{ ...tableDish, table: tableDish.table }} onClose={() => setTableDish(null)} />
      )}
    </main>
  );
}
