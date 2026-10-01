"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Printer } from "lucide-react";
import { restaurant } from "@/data/menu";

export function QrSheet() {
  const [tables, setTables] = useState(12);
  const [codes, setCodes] = useState<{ table: number; url: string; img: string }[]>([]);

  useEffect(() => {
    const origin = window.location.origin;
    Promise.all(
      Array.from({ length: tables }, async (_, i) => {
        const url = `${origin}/?mesa=${i + 1}`;
        const img = await QRCode.toDataURL(url, { margin: 1, width: 360, color: { dark: "#100d0a", light: "#ffffff" } });
        return { table: i + 1, url, img };
      }),
    ).then(setCodes);
  }, [tables]);

  return (
    <main className="min-h-dvh bg-white p-6 text-neutral-900">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4 print:hidden">
          <div>
            <h1 className="font-display text-3xl">QR codes das mesas</h1>
            <p className="text-sm text-neutral-500">Cada QR abre o cardápio 3D já identificando a mesa.</p>
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm">
              Mesas
              <input
                type="number"
                min={1}
                max={100}
                value={tables}
                onChange={(e) => setTables(Math.min(100, Math.max(1, Number(e.target.value) || 1)))}
                className="h-10 w-20 rounded-lg border border-neutral-300 px-2"
              />
            </label>
            <button
              type="button"
              onClick={() => window.print()}
              className="flex h-10 items-center gap-2 rounded-lg bg-neutral-900 px-4 text-sm font-medium text-white"
            >
              <Printer className="size-4" />
              Imprimir
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 print:grid-cols-3">
          {codes.map((c) => (
            <div key={c.table} className="break-inside-avoid rounded-2xl border border-neutral-200 p-4 text-center">
              <p className="font-display text-lg">{restaurant.name}</p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={c.img} alt={`QR code da mesa ${c.table}`} className="mx-auto my-2 w-full max-w-44" />
              <p className="text-sm font-semibold">Mesa {c.table}</p>
              <p className="text-xs text-neutral-500">Aponte a câmera e veja os pratos em 3D</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
