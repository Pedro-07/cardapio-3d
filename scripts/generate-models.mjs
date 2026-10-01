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
  crust: { color: "#3B1C10", rough: 0.55 },
  meat: { color: "#B5414A", rough: 0.45 },
  fatCap: { color: "#E9D3A8", rough: 0.4 },
  bone: { color: "#E6D8BF", rough: 0.6 },
  darkWood: { color: "#3A2416", rough: 0.75 },
  blackPlate: { color: "#151313", rough: 0.35 },
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

// ---------- pratos (referência de porção, forma aproximada) ----------

// Bloco de carne arredondado: largura (x), altura (y), profundidade (z), em metros.
function steakSlab(w, h, d, seed) {
  const r = rng(seed);
  const a = r() * 6, b = r() * 6;
  return transform(
    lathe([[0, 0], [0.44, 0], [0.5, 0.12], [0.5, 0.88], [0.44, 1], [0, 1]], 48, ([x, y, z], th) => {
      const k = 1 + 0.05 * Math.sin(3 * th + a) + 0.03 * Math.sin(5 * th + b);
      return [x * k, y, z * k];
    }),
    { s: [w, h, d] },
  );
}

function board(w, h, d) {
  return transform(box(w, h, d), { t: [0, h / 2, 0] });
}

function ancho() {
  const parts = [["darkWood", board(0.32, 0.02, 0.22)]];
  parts.push(["crust", transform(steakSlab(0.15, 0.04, 0.11, 21), { t: [0, 0.02, 0] })]);
  return parts;
}

function tomahawk() {
  const parts = [["darkWood", board(0.48, 0.025, 0.28)]];
  parts.push(["crust", transform(steakSlab(0.2, 0.05, 0.15, 33), { t: [-0.07, 0.025, 0] })]);
  // osso longo saindo do corte
  parts.push(["bone", transform(cylinder(0.013, 0.24, 20), { rz: -Math.PI / 2 + 0.08, t: [0.02, 0.05, 0.01] })]);
  return parts;
}

function picanha() {
  const parts = [["blackPlate", lathe([[0, 0], [0.1, 0], [0.13, 0.012], [0.145, 0.022], [0.14, 0.024], [0.11, 0.014], [0, 0.012]], 96)]];
  for (let i = 0; i < 5; i++) {
    const x = -0.06 + i * 0.03;
    parts.push(["meat", transform(box(0.022, 0.06, 0.075), { rz: -0.35, t: [x, 0.04, 0] })]);
    parts.push(["fatCap", transform(box(0.024, 0.012, 0.077), { rz: -0.35, t: [x + 0.012, 0.068, 0] })]);
  }
  return parts;
}

await writeModel("ancho-angus", ancho());
await writeModel("tomahawk", tomahawk());
await writeModel("picanha-wagyu", picanha());
