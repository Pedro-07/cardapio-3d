"use client";

import { useEffect, useRef, useState } from "react";
import type { ModelViewerElement } from "@google/model-viewer";
import { Box, Ruler, ScanLine, Smartphone, X } from "lucide-react";
import type { Product } from "@/data/menu";
import { TurntableViewer } from "./turntable-viewer";

type Props = {
  product: Product;
};

// Pontos usados para desenhar as cotas (largura, profundidade, altura) sobre o modelo.
const CORNERS = ["dim-a", "dim-b", "dim-c", "dim-d"] as const;
const LINES: [string, string][] = [
  ["dim-a", "dim-b"], // largura
  ["dim-b", "dim-c"], // profundidade
  ["dim-b", "dim-d"], // altura (aresta frontal, mais próxima da câmera)
];

// Ângulo de 3/4 usado enquanto as medidas estão visíveis.
const DIMS_ORBIT = "35deg 68deg 140%";

const fmtCm = (v: number) => `${v.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} cm`;

export function ModelStage({ product }: Props) {
  const mvRef = useRef<ModelViewerElement | null>(null);
  const lineRefs = useRef<(SVGLineElement | null)[]>([]);
  const [ready, setReady] = useState(false);
  const [progress, setProgress] = useState(0);
  const [loadedSrc, setLoadedSrc] = useState<string | null>(null);
  const [canAR, setCanAR] = useState(false);
  const [showDims, setShowDims] = useState(false);
  const [arHelp, setArHelp] = useState(false);

  // model-viewer é um web component que depende do navegador: carrega só no cliente.
  useEffect(() => {
    // Decodificador Draco servido pelo próprio site (padrão seria um CDN do Google).
    const w = self as unknown as { ModelViewerElement?: Record<string, unknown> };
    w.ModelViewerElement = { ...w.ModelViewerElement, dracoDecoderLocation: "/draco/" };
    import("@google/model-viewer").then(() => setReady(true));
  }, []);

  // Enquanto as medidas estão visíveis, redesenha as linhas a cada frame
  // (a câmera anima até o ângulo de 3/4 e o cliente pode girar o prato).
  useEffect(() => {
    const mv = mvRef.current;
    if (!showDims || !mv) return;
    mv.resetTurntableRotation(0);
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
    return () => cancelAnimationFrame(raf);
  }, [showDims, ready]);

  useEffect(() => {
    const mv = mvRef.current;
    if (!ready || !mv) return;

    const onLoad = () => {
      setLoadedSrc(mv.src);
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
    const onProgress = (e: Event) => {
      const p = (e as CustomEvent<{ totalProgress: number }>).detail.totalProgress;
      setProgress(p);
    };

    mv.addEventListener("load", onLoad);
    mv.addEventListener("progress", onProgress);
    return () => {
      mv.removeEventListener("load", onLoad);
      mv.removeEventListener("progress", onProgress);
    };
  }, [ready]);

  const openAR = () => {
    const mv = mvRef.current;
    if (mv && canAR) mv.activateAR();
    else setArHelp(true);
  };

  const loaded = loadedSrc !== null && loadedSrc.endsWith(product.model);
  // Com giro fotográfico disponível, ele é a vista principal; o 3D fica para medidas e AR
  // (o model-viewer continua montado, invisível, para o AR abrir na hora).
  const photoMode = !!product.turntable && !showDims;
  const { width, depth, height } = product.dimensions;

  return (
    <div className="relative h-[52dvh] min-h-[340px] w-full overflow-hidden">
      <div className="stage-glow pointer-events-none absolute inset-0" />

      {ready && (
        <model-viewer
          ref={(el) => {
            mvRef.current = el as ModelViewerElement | null;
          }}
          src={product.model}
          alt={`Modelo 3D: ${product.name}`}
          ar
          ar-modes="webxr scene-viewer quick-look"
          ar-scale="fixed"
          ar-placement="floor"
          camera-controls
          auto-rotate={!showDims}
          auto-rotate-delay={2500}
          rotation-per-second="18deg"
          camera-orbit={showDims ? DIMS_ORBIT : (product.cameraOrbit ?? "30deg 70deg auto")}
          min-camera-orbit="auto 0deg auto"
          max-camera-orbit="auto 88deg 150%"
          interaction-prompt="none"
          shadow-intensity="1.1"
          shadow-softness="0.8"
          environment-image="neutral"
          exposure="1.05"
          tone-mapping="neutral"
          touch-action="pan-y"
          className={`mv absolute inset-0 h-full w-full transition-opacity duration-500 ${showDims ? "dims-on" : ""} ${
            photoMode ? "pointer-events-none opacity-0" : "opacity-100"
          }`}
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

      {photoMode && product.turntable && (
        <TurntableViewer
          key={product.id}
          dir={product.turntable.dir}
          count={product.turntable.frames}
          alt={`${product.name} girando em 360°`}
        />
      )}

      {!loaded && !photoMode && (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-3 text-cream/60">
          <Box className="size-8 animate-pulse" strokeWidth={1.25} />
          <div className="h-0.5 w-28 overflow-hidden rounded-full bg-white/10">
            <div className="h-full bg-ember transition-[width]" style={{ width: `${Math.round(progress * 100)}%` }} />
          </div>
        </div>
      )}

      <div className="absolute inset-x-0 bottom-3 flex items-center justify-between gap-2 px-4">
        <button
          type="button"
          onClick={() => setShowDims((v) => !v)}
          aria-pressed={showDims}
          className={`flex h-10 items-center gap-2 rounded-full border px-4 text-sm font-medium backdrop-blur-md transition ${
            showDims ? "border-ember bg-ember/15 text-ember" : "border-white/15 bg-black/35 text-cream"
          }`}
        >
          <Ruler className="size-4" />
          Medidas
        </button>
        <button
          type="button"
          onClick={openAR}
          className="flex h-10 items-center gap-2 rounded-full bg-ember px-4 text-sm font-semibold text-ink shadow-lg shadow-ember/25 active:scale-95"
        >
          <ScanLine className="size-4" />
          Ver na minha mesa
        </button>
      </div>

      {arHelp && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-ink/80 p-6 backdrop-blur-sm">
          <div className="relative max-w-xs rounded-2xl border border-white/10 bg-panel p-5 text-center">
            <button
              type="button"
              onClick={() => setArHelp(false)}
              aria-label="Fechar"
              className="absolute right-2 top-2 grid size-9 place-items-center rounded-full text-cream/60"
            >
              <X className="size-4" />
            </button>
            <Smartphone className="mx-auto mb-3 size-7 text-ember" />
            <p className="font-display text-lg text-cream">Realidade aumentada</p>
            <p className="mt-2 text-sm leading-relaxed text-cream/70">
              Abra o cardápio pelo celular (QR code da mesa) para colocar o prato sobre a sua mesa, em tamanho real.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
