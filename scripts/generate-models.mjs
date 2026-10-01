// Gera modelos 3D placeholder (GLB) em ESCALA REAL (1 unidade = 1 metro).
// Eles servem para o protótipo e para o AR "em tamanho real"; em produção,
// substitua cada arquivo por um escaneamento real do prato (ex.: fotogrametria).
//
//   node scripts/generate-models.mjs

import { Document, NodeIO } from "@gltf-transform/core";
import { mkdirSync } from "node:fs";
import { join } from "node:path";

const OUT = join(import.meta.dirname, "..", "public", "models");
mkdirSync(OUT, { recursive: true });

// Pseudoaleatório determinístico, para que os modelos não mudem a cada build.
function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

// ---------- geometria ----------

// Superfície de revolução. `profile` é uma lista [raio, altura] percorrida de
// baixo para cima (centro inferior → borda → centro superior), o que garante
// normais apontando para fora. `deform` permite deformar cada vértice.
function lathe(profile, segs = 48, deform) {
  const pos = [];
  for (let i = 0; i < profile.length; i++) {
    const [r, y] = profile[i];
    for (let j = 0; j < segs; j++) {
      const th = (j / segs) * Math.PI * 2;
      let p = [r * Math.cos(th), y, r * Math.sin(th)];
      if (deform) p = deform(p, th, r, i / (profile.length - 1));
      pos.push(...p);
    }
  }
  const idx = [];
  for (let i = 0; i < profile.length - 1; i++) {
    for (let j = 0; j < segs; j++) {
      const a = i * segs + j;
      const b = i * segs + ((j + 1) % segs);
      const c = (i + 1) * segs + j;
      const d = (i + 1) * segs + ((j + 1) % segs);
      idx.push(a, c, b, b, c, d);
    }
  }
  return { pos, idx, nrm: computeNormals(pos, idx) };
}

function computeNormals(pos, idx) {
  const n = new Array(pos.length).fill(0);
  for (let t = 0; t < idx.length; t += 3) {
    const [a, b, c] = [idx[t] * 3, idx[t + 1] * 3, idx[t + 2] * 3];
    const e1 = [pos[b] - pos[a], pos[b + 1] - pos[a + 1], pos[b + 2] - pos[a + 2]];
    const e2 = [pos[c] - pos[a], pos[c + 1] - pos[a + 1], pos[c + 2] - pos[a + 2]];
    const fn = [
      e1[1] * e2[2] - e1[2] * e2[1],
      e1[2] * e2[0] - e1[0] * e2[2],
      e1[0] * e2[1] - e1[1] * e2[0],
    ];
    for (const v of [a, b, c]) for (let k = 0; k < 3; k++) n[v + k] += fn[k];
  }
  for (let v = 0; v < n.length; v += 3) {
    const l = Math.hypot(n[v], n[v + 1], n[v + 2]) || 1;
    n[v] /= l;
    n[v + 1] /= l;
    n[v + 2] /= l;
  }
  return n;
}

function sphere(r, segs = 24, rings = 16, deform) {
  const profile = [];
  for (let i = 0; i <= rings; i++) {
    const phi = (i / rings) * Math.PI;
    profile.push([r * Math.sin(phi), -r * Math.cos(phi)]);
  }
  return lathe(profile, segs, deform);
}

function cylinder(r, h, segs = 32) {
  return lathe([[0, 0], [r, 0], [r, 0], [r, h], [r, h], [0, h]], segs);
}

// Caixa via lathe de 4 lados girada 45°.
function box(w, h, d) {
  const m = lathe([[0, 0], [0.5, 0], [0.5, 0], [0.5, 1], [0.5, 1], [0, 1]], 4);
  return transform(m, { ry: Math.PI / 4, s: [w * Math.SQRT2, h, d * Math.SQRT2], t: [0, -h / 2, 0] }, true);
}

// Aplica escala → rotação (x, y, z) → translação.
function transform(m, { s = [1, 1, 1], rx = 0, ry = 0, rz = 0, t = [0, 0, 0] }, preScale = false) {
  const rot = (v) => {
    let [x, y, z] = v;
    [y, z] = [y * Math.cos(rx) - z * Math.sin(rx), y * Math.sin(rx) + z * Math.cos(rx)];
    [x, z] = [x * Math.cos(ry) + z * Math.sin(ry), -x * Math.sin(ry) + z * Math.cos(ry)];
    [x, y] = [x * Math.cos(rz) - y * Math.sin(rz), x * Math.sin(rz) + y * Math.cos(rz)];
    return [x, y, z];
  };
  const pos = [];
  const nrm = [];
  for (let i = 0; i < m.pos.length; i += 3) {
    let p = [m.pos[i], m.pos[i + 1], m.pos[i + 2]];
    let n = [m.nrm[i], m.nrm[i + 1], m.nrm[i + 2]];
    if (preScale) {
      // box(): rotação antes da escala, para o lathe de 4 lados virar um retângulo
      p = rot(p).map((c, k) => c * s[k] + t[k]);
      n = rot(n).map((c, k) => c / s[k]);
    } else {
      p = rot(p.map((c, k) => c * s[k])).map((c, k) => c + t[k]);
      n = rot(n.map((c, k) => c / s[k]));
    }
    const l = Math.hypot(...n) || 1;
    pos.push(...p);
    nrm.push(...n.map((c) => c / l));
  }
  return { pos, nrm, idx: m.idx };
}

function merge(meshes) {
  const out = { pos: [], nrm: [], idx: [] };
  for (const m of meshes) {
    const base = out.pos.length / 3;
    out.pos.push(...m.pos);
    out.nrm.push(...m.nrm);
    out.idx.push(...m.idx.map((i) => i + base));
  }
  return out;
}

// Interpola a altura de um perfil em um dado raio (para apoiar itens na superfície).
function heightAt(profile, r) {
  for (let i = profile.length - 1; i > 0; i--) {
    const [r0, y0] = profile[i];
    const [r1, y1] = profile[i - 1];
    if (r >= Math.min(r0, r1) && r <= Math.max(r0, r1) && r0 !== r1) {
      return y0 + ((r - r0) / (r1 - r0)) * (y1 - y0);
    }
  }
  return profile[profile.length - 1][1];
}

// ---------- materiais ----------

const MAT = {
  bun: { color: "#C8792E", rough: 0.7 },
  bunInside: { color: "#EFD3A0", rough: 0.9 },
  sesame: { color: "#F5E6C4", rough: 0.6 },
  patty: { color: "#4A2A18", rough: 0.85 },
  cheese: { color: "#F2B233", rough: 0.35 },
  lettuce: { color: "#6DAA2C", rough: 0.55 },
  tomato: { color: "#C8281E", rough: 0.3 },
  bacon: { color: "#9B3A26", rough: 0.5 },
  wood: { color: "#A8743F", rough: 0.8 },
  crust: { color: "#D9953F", rough: 0.75 },
  sauce: { color: "#B8261A", rough: 0.4 },
  mozzarella: { color: "#FBF3DF", rough: 0.4 },
  basil: { color: "#2F7D2A", rough: 0.5 },
  friesBox: { color: "#D32F2F", rough: 0.5 },
  fry: { color: "#EDBB4F", rough: 0.6 },
  glass: { color: "#FFFFFF", rough: 0.05, alpha: 0.18 },
  lemonade: { color: "#D6EC8C", rough: 0.1, alpha: 0.82 },
  ice: { color: "#F2FBFF", rough: 0.05, alpha: 0.55 },
  lemon: { color: "#F3D23C", rough: 0.4 },
  straw: { color: "#2E7D5B", rough: 0.4 },
  plate: { color: "#F7F5F0", rough: 0.2 },
  chocolate: { color: "#3A1E12", rough: 0.35 },
  iceCream: { color: "#F6EAD0", rough: 0.6 },
  strawberry: { color: "#D0213A", rough: 0.35 },
  mint: { color: "#3E9B3A", rough: 0.5 },
};

// ---------- GLB ----------

async function writeModel(name, parts) {
  const doc = new Document();
  const buffer = doc.createBuffer();
  const scene = doc.createScene(name);
  const root = doc.createNode(name);
  scene.addChild(root);

  // Agrupa por material para reduzir draw calls.
  const byMat = new Map();
  for (const [matKey, mesh] of parts) {
    if (!byMat.has(matKey)) byMat.set(matKey, []);
    byMat.get(matKey).push(mesh);
  }

  for (const [matKey, meshes] of byMat) {
    const m = merge(meshes);
    const def = MAT[matKey];
    const hex = def.color.replace("#", "");
    const srgb = [0, 2, 4].map((o) => parseInt(hex.slice(o, o + 2), 16) / 255);
    const linear = srgb.map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
    const mat = doc
      .createMaterial(matKey)
      .setBaseColorFactor([...linear, def.alpha ?? 1])
      .setRoughnessFactor(def.rough)
      .setMetallicFactor(0);
    if (def.alpha !== undefined) mat.setAlphaMode("BLEND");

    const prim = doc
      .createPrimitive()
      .setMaterial(mat)
      .setAttribute("POSITION", doc.createAccessor().setType("VEC3").setArray(new Float32Array(m.pos)).setBuffer(buffer))
      .setAttribute("NORMAL", doc.createAccessor().setType("VEC3").setArray(new Float32Array(m.nrm)).setBuffer(buffer))
      .setIndices(doc.createAccessor().setType("SCALAR").setArray(new Uint32Array(m.idx)).setBuffer(buffer));
    root.addChild(doc.createNode(matKey).setMesh(doc.createMesh(matKey).addPrimitive(prim)));
  }

  const file = join(OUT, `${name}.glb`);
  await new NodeIO().write(file, doc);
  console.log("✓", file);
}

// ---------- pratos ----------

function burger({ double = false, bacon = false, seed = 1 }) {
  const r = rng(seed);
  const parts = [];
  let y = 0;

  const bottomBun = [[0, 0], [0.05, 0], [0.054, 0.006], [0.055, 0.014], [0.053, 0.022], [0, 0.022]];
  parts.push(["bun", lathe(bottomBun, 48)]);
  y = 0.022;

  const patty = (y0) =>
    lathe(
      [[0, y0], [0.056, y0], [0.058, y0 + 0.008], [0.056, y0 + 0.016], [0, y0 + 0.016]],
      56,
      ([x, py, z], th, rad) => {
        const k = 1 + 0.035 * Math.sin(7 * th) + 0.02 * Math.sin(13 * th + 1);
        return [x * k, py + (rad > 0 ? 0.0015 * Math.sin(5 * th) : 0), z * k];
      },
    );
  const cheese = (y0) =>
    lathe([[0, y0], [0.074, y0], [0.074, y0 + 0.003], [0, y0 + 0.003]], 4, ([x, py, z]) => {
      const dist = Math.hypot(x, z);
      return [x, py - Math.max(0, dist - 0.05) * 0.7, z];
    });

  for (let i = 0; i < (double ? 2 : 1); i++) {
    parts.push(["patty", patty(y)]);
    y += 0.016;
    parts.push(["cheese", transform(cheese(y), { ry: i * 0.5 + 0.2 })]);
    y += 0.003;
  }

  if (bacon) {
    for (let i = 0; i < 3; i++) {
      const b = box(0.11, 0.003, 0.022);
      const wavy = { ...b, pos: b.pos.map((v, k) => (k % 3 === 1 ? v + 0.003 * Math.sin(b.pos[k - 1] * 90) : v)) };
      parts.push(["bacon", transform(wavy, { ry: i * 1.05 + r() * 0.3, t: [0, y + 0.002 + i * 0.002, 0] })]);
    }
    y += 0.008;
  }

  parts.push([
    "lettuce",
    lathe([[0, y], [0.062, y - 0.002], [0.062, y + 0.003], [0, y + 0.004]], 64, ([x, py, z], th, rad) => {
      const w = rad > 0.03 ? 0.006 * Math.sin(9 * th) + 0.003 * Math.sin(17 * th) : 0;
      const k = 1 + 0.06 * Math.sin(11 * th);
      return [x * k, py + w, z * k];
    }),
  ]);
  y += 0.004;

  parts.push(["tomato", cylinder(0.042, 0.006, 40)]);
  parts[parts.length - 1][1] = transform(parts[parts.length - 1][1], { t: [0.006, y, -0.004] });
  y += 0.006;

  const top = [
    [0, y], [0.052, y], [0.055, y + 0.006], [0.055, y + 0.02],
    [0.047, y + 0.037], [0.032, y + 0.048], [0.016, y + 0.052], [0, y + 0.053],
  ];
  parts.push(["bun", lathe(top, 64)]);

  const seeds = [];
  for (let i = 0; i < 45; i++) {
    const rad = Math.sqrt(r()) * 0.047;
    const th = r() * Math.PI * 2;
    const h = heightAt(top, rad);
    seeds.push(
      transform(sphere(1, 8, 6), {
        s: [0.0022, 0.0011, 0.0036],
        ry: r() * Math.PI,
        rx: -(rad / 0.047) * 0.6,
        t: [rad * Math.cos(th), h - 0.0003, rad * Math.sin(th)],
      }),
    );
  }
  parts.push(["sesame", merge(seeds)]);
  return parts;
}

function pizza() {
  const r = rng(7);
  const parts = [];
  parts.push(["wood", cylinder(0.195, 0.015, 64)]);
  const base = 0.015;
  parts.push([
    "crust",
    lathe(
      [[0, base], [0.17, base], [0.176, base + 0.007], [0.173, base + 0.017], [0.162, base + 0.016], [0.155, base + 0.009], [0, base + 0.009]],
      96,
      ([x, y, z], th, rad) => {
        const k = 1 + (rad > 0.15 ? 0.012 * Math.sin(6 * th) + 0.008 * Math.sin(15 * th) : 0);
        return [x * k, y, z * k];
      },
    ),
  ]);
  parts.push(["sauce", transform(cylinder(0.157, 0.002, 96), { t: [0, base + 0.009, 0] })]);

  const cheese = [];
  for (let i = 0; i < 16; i++) {
    const rad = Math.sqrt(r()) * 0.13;
    const th = r() * Math.PI * 2;
    const s = 0.016 + r() * 0.012;
    cheese.push(
      transform(sphere(1, 16, 8, ([x, y, z], t) => [x * (1 + 0.15 * Math.sin(5 * t)), y, z]), {
        s: [s, 0.004, s * (0.8 + r() * 0.4)],
        ry: r() * 3,
        t: [rad * Math.cos(th), base + 0.012, rad * Math.sin(th)],
      }),
    );
  }
  parts.push(["mozzarella", merge(cheese)]);

  const leaves = [];
  for (let i = 0; i < 9; i++) {
    const rad = 0.03 + r() * 0.1;
    const th = r() * Math.PI * 2;
    leaves.push(
      transform(sphere(1, 12, 6), {
        s: [0.016, 0.0015, 0.008],
        ry: r() * 3,
        t: [rad * Math.cos(th), base + 0.0165, rad * Math.sin(th)],
      }),
    );
  }
  parts.push(["basil", merge(leaves)]);
  return parts;
}

function fries() {
  const r = rng(3);
  const parts = [];
  const rb = 0.04 * Math.SQRT2;
  const rt = 0.056 * Math.SQRT2;
  const h = 0.11;
  parts.push([
    "friesBox",
    transform(lathe([[0, 0], [rb, 0], [rt, h], [rt * 0.97, h], [rb * 0.97, 0.004], [0, 0.004]], 4), { ry: Math.PI / 4 }),
  ]);
  const sticks = [];
  for (let i = 0; i < 46; i++) {
    const len = 0.085 + r() * 0.035;
    const x = (r() - 0.5) * 0.075;
    const z = (r() - 0.5) * 0.075;
    const yBase = 0.035 + r() * 0.03;
    sticks.push(
      transform(box(0.009, len, 0.009), {
        rx: (r() - 0.5) * 0.5,
        rz: (r() - 0.5) * 0.5,
        ry: r() * 3,
        t: [x, yBase + len / 2, z],
      }),
    );
  }
  parts.push(["fry", merge(sticks)]);
  return parts;
}

function lemonade() {
  const r = rng(11);
  const parts = [];
  const H = 0.16;
  parts.push([
    "glass",
    lathe([[0, 0], [0.036, 0], [0.042, H], [0.039, H], [0.033, 0.012], [0, 0.012]], 64),
  ]);
  parts.push(["lemonade", lathe([[0, 0.013], [0.0328, 0.013], [0.0385, 0.13], [0, 0.13]], 64)]);
  const ice = [];
  for (let i = 0; i < 5; i++) {
    ice.push(
      transform(box(0.022, 0.022, 0.022), {
        rx: r() * 0.8,
        ry: r() * 3,
        rz: r() * 0.8,
        t: [(r() - 0.5) * 0.03, 0.105 + r() * 0.02, (r() - 0.5) * 0.03],
      }),
    );
  }
  parts.push(["ice", merge(ice)]);
  parts.push(["lemon", transform(cylinder(0.024, 0.005, 40), { rx: Math.PI / 2, t: [0.036, H - 0.012, 0.0025] })]);
  parts.push(["straw", transform(cylinder(0.0035, 0.17, 16), { rz: -0.2, t: [-0.01, 0.015, 0.008] })]);
  return parts;
}

function petitGateau() {
  const r = rng(5);
  const parts = [];
  parts.push([
    "plate",
    lathe([[0, 0], [0.05, 0], [0.052, 0.006], [0.1, 0.01], [0.125, 0.022], [0.122, 0.024], [0.098, 0.013], [0.05, 0.009], [0, 0.009]], 96),
  ]);
  const b = 0.009;
  parts.push([
    "chocolate",
    transform(
      lathe([[0, 0], [0.036, 0], [0.034, 0.03], [0.03, 0.042], [0.018, 0.047], [0, 0.048]], 48, ([x, y, z], th) => {
        const k = 1 + 0.01 * Math.sin(8 * th);
        return [x * k, y, z * k];
      }),
      { t: [-0.02, b, 0] },
    ),
  ]);
  // calda escorrendo no prato
  parts.push([
    "chocolate",
    transform(
      lathe([[0, 0], [0.05, 0], [0.05, 0.002], [0, 0.003]], 48, ([x, y, z], th) => {
        const k = 1 + 0.18 * Math.sin(5 * th) + 0.08 * Math.sin(11 * th);
        return [x * k, y, z * k];
      }),
      { t: [-0.02, b, 0] },
    ),
  ]);
  parts.push([
    "iceCream",
    transform(
      sphere(0.026, 32, 16, ([x, y, z], th) => {
        const k = 1 + 0.05 * Math.sin(6 * th) * (y < 0 ? 1.6 : 0.6);
        return [x * k, y, z * k];
      }),
      { s: [1, 0.85, 1], t: [0.045, b + 0.021, 0.02] },
    ),
  ]);
  parts.push(["strawberry", transform(sphere(1, 20, 12), { s: [0.012, 0.016, 0.012], rz: 0.9, t: [0.05, b + 0.01, -0.035] })]);
  const leaves = [];
  for (let i = 0; i < 3; i++) {
    leaves.push(
      transform(sphere(1, 10, 6), {
        s: [0.011, 0.0015, 0.005],
        ry: i * 2.1 + r() * 0.3,
        rz: 0.3,
        t: [0.045 + Math.cos(i * 2.1) * 0.006, b + 0.043, 0.02 + Math.sin(i * 2.1) * 0.006],
      }),
    );
  }
  parts.push(["mint", merge(leaves)]);
  return parts;
}

await writeModel("duplo-bacon", burger({ double: true, bacon: true, seed: 2 }));
await writeModel("pizza-margherita", pizza());
await writeModel("batata-frita", fries());
await writeModel("limonada-suica", lemonade());
await writeModel("petit-gateau", petitGateau());
