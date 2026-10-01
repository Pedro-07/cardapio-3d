"use client";

import { useMemo, useRef, useState } from "react";
import {
  BadgeCheck,
  ChevronLeft,
  ChevronRight,
  Clock,
  Minus,
  Plus,
  Scale,
  ShoppingBag,
  Users,
  Box,
  X,
  Check,
} from "lucide-react";
import { categories, formatPrice, products, restaurant, type Product } from "@/data/menu";
import { ModelStage } from "./model-stage";

type Tab = "ingredientes" | "nutricao" | "alergenicos";
type CartLine = { product: Product; qty: number };

export function Menu3D({ table, initialId }: { table?: string; initialId?: string }) {
  const [selectedId, setSelectedId] = useState(
    products.some((p) => p.id === initialId) ? initialId! : products[0].id,
  );
  const [tab, setTab] = useState<Tab>("ingredientes");
  const [qty, setQty] = useState(1);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [cartOpen, setCartOpen] = useState(false);
  const [sent, setSent] = useState(false);
  const railRef = useRef<HTMLDivElement>(null);

  const product = products.find((p) => p.id === selectedId)!;
  const index = products.indexOf(product);

  const lines: CartLine[] = useMemo(
    () =>
      Object.entries(cart)
        .filter(([, q]) => q > 0)
        .map(([id, q]) => ({ product: products.find((p) => p.id === id)!, qty: q })),
    [cart],
  );
  const cartCount = lines.reduce((n, l) => n + l.qty, 0);
  const cartTotal = lines.reduce((n, l) => n + l.qty * l.product.price, 0);

  const select = (id: string) => {
    setSelectedId(id);
    setQty(1);
    setTab("ingredientes");
    requestAnimationFrame(() => {
      railRef.current?.querySelector(`[data-id="${id}"]`)?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
    });
  };
  const step = (dir: 1 | -1) => select(products[(index + dir + products.length) % products.length].id);

  const addToCart = () => {
    setCart((c) => ({ ...c, [product.id]: (c[product.id] ?? 0) + qty }));
    setQty(1);
  };
  const setLine = (id: string, q: number) => setCart((c) => ({ ...c, [id]: Math.max(0, q) }));

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-ink pb-28 text-cream">
      {/* Cabeçalho */}
      <header className="flex items-center justify-between px-4 pb-1 pt-4">
        <div>
          <p className="font-display text-xl leading-tight">{restaurant.name}</p>
          <p className="text-xs text-cream/50">
            {restaurant.subtitle}
            {table && <span className="ml-2 rounded-full bg-white/8 px-2 py-0.5 text-cream/80">Mesa {table}</span>}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setCartOpen(true)}
          aria-label={`Pedido, ${cartCount} itens`}
          className="relative grid size-11 place-items-center rounded-full border border-white/10 bg-white/5"
        >
          <ShoppingBag className="size-5" />
          {cartCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 grid size-5 place-items-center rounded-full bg-ember text-[11px] font-bold text-ink">
              {cartCount}
            </span>
          )}
        </button>
      </header>

      {/* Palco 3D */}
      <section className="relative">
        <ModelStage product={product} />
        <button
          type="button"
          onClick={() => step(-1)}
          aria-label="Prato anterior"
          className="absolute left-2 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-black/30 text-cream/80 backdrop-blur"
        >
          <ChevronLeft className="size-5" />
        </button>
        <button
          type="button"
          onClick={() => step(1)}
          aria-label="Próximo prato"
          className="absolute right-2 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-black/30 text-cream/80 backdrop-blur"
        >
          <ChevronRight className="size-5" />
        </button>
        <p className="pointer-events-none absolute inset-x-0 top-2 text-center text-[11px] uppercase tracking-[0.2em] text-cream/40">
          Arraste para girar
        </p>
      </section>

      {/* Navegação por categoria + pratos */}
      <nav className="sticky top-0 z-20 border-b border-white/5 bg-ink/90 backdrop-blur-md">
        <div className="no-scrollbar flex gap-2 overflow-x-auto px-4 pt-3">
          {categories.map((c) => {
            const active = product.categoryId === c.id;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => select(products.find((p) => p.categoryId === c.id)!.id)}
                className={`h-8 shrink-0 rounded-full px-3.5 text-sm transition ${
                  active ? "bg-cream text-ink" : "bg-white/6 text-cream/70"
                }`}
              >
                {c.name}
              </button>
            );
          })}
        </div>
        <div ref={railRef} className="no-scrollbar flex snap-x gap-2.5 overflow-x-auto px-4 py-3">
          {products.map((p) => {
            const active = p.id === product.id;
            return (
              <button
                key={p.id}
                data-id={p.id}
                type="button"
                onClick={() => select(p.id)}
                className={`w-36 shrink-0 snap-center rounded-2xl border p-3 text-left transition ${
                  active ? "border-ember/70 bg-ember/10" : "border-white/8 bg-white/4"
                }`}
              >
                <Box className={`mb-2 size-4 ${active ? "text-ember" : "text-cream/40"}`} />
                <p className="truncate text-sm font-medium">{p.name}</p>
                <p className="text-xs text-cream/55">{formatPrice(p.price)}</p>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Detalhes */}
      <article key={product.id} className="fade-in px-4 pt-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl leading-none">{product.name}</h1>
            <p className="mt-1.5 text-sm text-ember">{product.tagline}</p>
          </div>
          <p className="shrink-0 pt-1 text-xl font-semibold tabular-nums">{formatPrice(product.price)}</p>
        </div>
        <p className="mt-3 text-[15px] leading-relaxed text-cream/70">{product.description}</p>

        <dl className="mt-5 grid grid-cols-2 gap-2">
          <Spec icon={<Scale className="size-4" />} label="Peso" value={`${product.weightGrams} g`} />
          <Spec
            icon={<Box className="size-4" />}
            label="Medidas (L×P×A)"
            value={`${product.dimensions.width}×${product.dimensions.depth}×${product.dimensions.height} cm`}
          />
          <Spec
            icon={<Users className="size-4" />}
            label="Serve"
            value={`${product.serves} ${product.serves > 1 ? "pessoas" : "pessoa"}`}
          />
          <Spec icon={<Clock className="size-4" />} label="Preparo" value={`~${product.prepMinutes} min`} />
        </dl>

        <ul className="mt-5 flex flex-wrap gap-2">
          {product.quality.map((q) => (
            <li key={q} className="flex items-center gap-1.5 rounded-full border border-emerald-400/20 bg-emerald-400/8 px-3 py-1 text-xs text-emerald-200">
              <BadgeCheck className="size-3.5" />
              {q}
            </li>
          ))}
        </ul>

        <div role="tablist" className="mt-6 grid grid-cols-3 rounded-xl bg-white/5 p-1 text-sm">
          {(
            [
              ["ingredientes", "Ingredientes"],
              ["nutricao", "Nutrição"],
              ["alergenicos", "Alergênicos"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              role="tab"
              type="button"
              aria-selected={tab === id}
              onClick={() => setTab(id)}
              className={`h-9 rounded-lg transition ${tab === id ? "bg-panel text-cream shadow" : "text-cream/55"}`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="min-h-40 pt-4">
          {tab === "ingredientes" && (
            <ul className="divide-y divide-white/5">
              {product.ingredients.map((i) => (
                <li key={i} className="py-2.5 text-[15px] text-cream/80">
                  {i}
                </li>
              ))}
            </ul>
          )}
          {tab === "nutricao" && <Nutrition product={product} />}
          {tab === "alergenicos" &&
            (product.allergens.length ? (
              <ul className="flex flex-wrap gap-2">
                {product.allergens.map((a) => (
                  <li key={a} className="rounded-full bg-amber-400/10 px-3 py-1.5 text-sm text-amber-200">
                    Contém {a.toLowerCase()}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-cream/70">Sem alergênicos principais declarados.</p>
            ))}
        </div>
      </article>

      {/* Barra de pedido */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-white/8 bg-ink/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-md items-center gap-3 px-4 py-3" style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}>
          <div className="flex h-12 items-center rounded-full border border-white/10">
            <button type="button" aria-label="Diminuir" onClick={() => setQty((q) => Math.max(1, q - 1))} className="grid size-12 place-items-center">
              <Minus className="size-4" />
            </button>
            <span className="w-5 text-center tabular-nums">{qty}</span>
            <button type="button" aria-label="Aumentar" onClick={() => setQty((q) => q + 1)} className="grid size-12 place-items-center">
              <Plus className="size-4" />
            </button>
          </div>
          <button
            type="button"
            onClick={addToCart}
            className="flex h-12 flex-1 items-center justify-between rounded-full bg-cream px-5 font-semibold text-ink active:scale-[0.98]"
          >
            <span>Adicionar</span>
            <span className="tabular-nums">{formatPrice(product.price * qty)}</span>
          </button>
        </div>
      </div>

      {/* Pedido */}
      {cartOpen && (
        <div className="fixed inset-0 z-40 flex items-end bg-black/60" onClick={() => setCartOpen(false)}>
          <div
            className="sheet-up mx-auto w-full max-w-md rounded-t-3xl bg-panel p-5"
            style={{ paddingBottom: "max(1.25rem, env(safe-area-inset-bottom))" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <p className="font-display text-2xl">Seu pedido</p>
              <button type="button" aria-label="Fechar" onClick={() => setCartOpen(false)} className="grid size-10 place-items-center rounded-full bg-white/5">
                <X className="size-4" />
              </button>
            </div>

            {sent ? (
              <div className="py-8 text-center">
                <div className="mx-auto mb-3 grid size-12 place-items-center rounded-full bg-emerald-400/15 text-emerald-300">
                  <Check className="size-6" />
                </div>
                <p className="font-medium">Pedido enviado para a cozinha</p>
                <p className="mt-1 text-sm text-cream/60">{table ? `Mesa ${table} · ` : ""}em breve chega na sua mesa.</p>
              </div>
            ) : lines.length === 0 ? (
              <p className="py-8 text-center text-sm text-cream/60">Nenhum item ainda.</p>
            ) : (
              <>
                <ul className="divide-y divide-white/5">
                  {lines.map(({ product: p, qty: q }) => (
                    <li key={p.id} className="flex items-center gap-3 py-3">
                      <div className="flex-1">
                        <p className="text-[15px]">{p.name}</p>
                        <p className="text-xs text-cream/55">{formatPrice(p.price)}</p>
                      </div>
                      <div className="flex items-center rounded-full border border-white/10">
                        <button type="button" aria-label="Diminuir" onClick={() => setLine(p.id, q - 1)} className="grid size-9 place-items-center">
                          <Minus className="size-3.5" />
                        </button>
                        <span className="w-4 text-center text-sm tabular-nums">{q}</span>
                        <button type="button" aria-label="Aumentar" onClick={() => setLine(p.id, q + 1)} className="grid size-9 place-items-center">
                          <Plus className="size-3.5" />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
                <div className="mt-4 flex items-center justify-between text-lg">
                  <span className="text-cream/70">Total</span>
                  <span className="font-semibold tabular-nums">{formatPrice(cartTotal)}</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSent(true);
                    setCart({});
                    setTimeout(() => {
                      setSent(false);
                      setCartOpen(false);
                    }, 2600);
                  }}
                  className="mt-4 h-12 w-full rounded-full bg-ember font-semibold text-ink active:scale-[0.98]"
                >
                  Enviar pedido
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Spec({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/6 bg-white/3 p-3">
      <dt className="flex items-center gap-1.5 text-xs text-cream/50">
        {icon}
        {label}
      </dt>
      <dd className="mt-1 text-[15px] font-medium tabular-nums">{value}</dd>
    </div>
  );
}

function Nutrition({ product }: { product: Product }) {
  const { kcal, protein, carbs, fat } = product.nutrition;
  const macros = [
    { label: "Proteínas", g: protein, kcal: protein * 4, color: "bg-sky-400" },
    { label: "Carboidratos", g: carbs, kcal: carbs * 4, color: "bg-amber-400" },
    { label: "Gorduras", g: fat, kcal: fat * 9, color: "bg-rose-400" },
  ];
  const total = macros.reduce((n, m) => n + m.kcal, 0);
  return (
    <div>
      <p className="text-sm text-cream/60">
        Porção inteira ({product.weightGrams} g) · <span className="font-semibold text-cream">{kcal} kcal</span>
      </p>
      <div className="mt-3 flex h-2.5 overflow-hidden rounded-full bg-white/5">
        {macros.map((m) => (
          <div key={m.label} className={m.color} style={{ width: `${(m.kcal / total) * 100}%` }} />
        ))}
      </div>
      <ul className="mt-3 space-y-2">
        {macros.map((m) => (
          <li key={m.label} className="flex items-center gap-2 text-[15px]">
            <span className={`size-2.5 rounded-full ${m.color}`} />
            <span className="flex-1 text-cream/75">{m.label}</span>
            <span className="tabular-nums">{m.g} g</span>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-cream/40">Valores aproximados.</p>
    </div>
  );
}
