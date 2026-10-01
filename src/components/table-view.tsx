"use client";

import { useEffect, useRef, useState } from "react";
import type { ModelViewerElement } from "@google/model-viewer";
import type { Dish } from "@/data/menu";

type Props = {
  dish: Dish & { table: NonNullable<Dish["table"]> };
  onClose: () => void;
};

// Cotas: largura (a→b), profundidade (b→c), altura (b→d, aresta frontal).
const CORNERS = ["dim-a", "dim-b", "dim-c", "dim-d"] as const;
const LINES: [string, string][] = [
  ["dim-a", "dim-b"],
  ["dim-b", "dim-c"],
  ["dim-b", "dim-d"],
];

const fmtCm = (v: number) => `${v.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} cm`;

// Tela 4 — referência de porção em escala real, com AR (SPEC §5).
export function TableView({ dish, onClose }: Props) {
  const mvRef = useRef<ModelViewerElement | null>(null);
  const lineRefs = useRef<(SVGLineElement | null)[]>([]);
  const [ready, setReady] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [canAR, setCanAR] = useState<boolean | null>(null);

  // model-viewer depende do navegador: carrega só no cliente, com o Draco servido pelo site.
  useEffect(() => {
    const w = self as unknown as { ModelViewerElement?: Record<string, unknown> };
    w.ModelViewerElement = { ...w.ModelViewerElement, dracoDecoderLocation: "/draco/" };
    import("@google/model-viewer").then(() => setReady(true));
  }, []);

  useEffect(() => {
    const mv = mvRef.current;
    if (!ready || !mv) return;

    const onLoad = () => {
      setLoaded(true);
      setCanAR(mv.canActivateAR);
      const size = mv.getDimensions();
      const c = mv.getBoundingBoxCenter();
      const x0 = c.x - size.x / 2, x1 = c.x + size.x / 2;
      const y0 = c.y - size.y / 2, y1 = c.y + size.y / 2;
      const z0 = c.z - size.z / 2, z1 = c.z + size.z / 2;
      const pad = Math.max(size.x, size.z) * 0.04;
      const set = (name: string, x: number, y: number, z: number) =>
        mv.updateHotspot({ name: `hotspot-${name}`, position: `${x}m ${y}m ${z}m` });
      set("dim-a", x0, y0, z1 + pad);
      set("dim-b", x1 + pad, y0, z1 + pad);
      set("dim-c", x1 + pad, y0, z0);
      set("dim-d", x1 + pad, y1, z1 + pad);
      set("lbl-w", c.x, y0, z1 + pad);
      set("lbl-d", x1 + pad, y0, c.z);
      set("lbl-h", x1 + pad, c.y, z1 + pad);
    };

    let raf = 0;
    const draw = () => {
      LINES.forEach(([from, to], i) => {
        const line = lineRefs.current[i];
        const a = mv.queryHotspot(`hotspot-${from}`);
        const b = mv.queryHotspot(`hotspot-${to}`);
        if (!line || !a || !b) return;
        line.setAttribute("x1", String(a.canvasPosition.x));
        line.setAttribute("y1", String(a.canvasPosition.y));
        line.setAttribute("x2", String(b.canvasPosition.x));
        line.setAttribute("y2", String(b.canvasPosition.y));
      });
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);

    mv.addEventListener("load", onLoad);
    return () => {
      cancelAnimationFrame(raf);
      mv.removeEventListener("load", onLoad);
    };
  }, [ready]);

  const { width, depth, height } = dish.table.dimensions;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-paper" role="dialog" aria-modal="true" aria-label={`${dish.name} em tamanho real`}>
      <header className="flex items-start justify-between px-5 pt-[max(1.25rem,env(safe-area-inset-top))]">
        <div>
          <p className="caption text-accent">Na sua mesa</p>
          <p className="display mt-2 text-[2.2rem]">{dish.name}</p>
        </div>
        <button type="button" onClick={onClose} className="caption py-2 pl-4 text-ink/60">
          Fechar
        </button>
      </header>

      <div className="relative flex-1">
        <div className="absolute inset-0 bg-[radial-gradient(55%_40%_at_50%_55%,rgb(200_164_106/0.12),transparent_70%)]" />
        {ready && (
          <model-viewer
            ref={(el) => {
              mvRef.current = el as ModelViewerElement | null;
            }}
            src={dish.table.model}
            alt={`Representação de ${dish.name} em escala real`}
            ar
            ar-modes="webxr scene-viewer quick-look"
            ar-scale="fixed"
            ar-placement="floor"
            camera-controls
            camera-orbit="35deg 62deg 135%"
            min-camera-orbit="auto 0deg auto"
            max-camera-orbit="auto 85deg 160%"
            interaction-prompt="none"
            shadow-intensity="1"
            shadow-softness="0.9"
            environment-image="neutral"
            exposure="0.95"
            tone-mapping="neutral"
            touch-action="pan-y"
            className="mv absolute inset-0 h-full w-full"
          >
            {CORNERS.map((n) => (
              <div key={n} slot={`hotspot-${n}`} data-position="0m 0m 0m" className="dim-dot" />
            ))}
            <div slot="hotspot-lbl-w" data-position="0m 0m 0m" className="dim-label">
              {fmtCm(width)}
            </div>
            <div slot="hotspot-lbl-d" data-position="0m 0m 0m" className="dim-label">
              {fmtCm(depth)}
            </div>
            <div slot="hotspot-lbl-h" data-position="0m 0m 0m" className="dim-label">
              {fmtCm(height)}
            </div>
            <svg className="dim-lines" width="100%" height="100%" aria-hidden>
              {LINES.map((_, i) => (
                <line key={i} ref={(el) => { lineRefs.current[i] = el; }} />
              ))}
            </svg>
            <div slot="progress-bar" />
          </model-viewer>
        )}
        {!loaded && <p className="caption absolute inset-x-0 top-1/2 text-center text-ink/40">Carregando</p>}
      </div>

      <footer className="px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        <p className="text-[13px] text-ink/50">Representação aproximada, em escala real. {dish.table.weight}.</p>
        {canAR === false ? (
          <p className="mt-4 border-t hairline pt-4 text-[13px] text-ink/60">
            Abra pelo celular, no QR code da mesa, para colocar o prato sobre a mesa pela câmera.
          </p>
        ) : (
          <button
            type="button"
            disabled={!canAR}
            onClick={() => mvRef.current?.activateAR()}
            className="mt-4 flex h-12 w-full items-center justify-center bg-accent text-[15px] font-medium text-paper disabled:opacity-40"
          >
            Colocar na mesa pela câmera
          </button>
        )}
      </footer>
    </div>
  );
}
