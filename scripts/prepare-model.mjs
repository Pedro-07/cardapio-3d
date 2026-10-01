// Prepara um GLB gerado por IA/escaneamento para o cardápio:
// centraliza, apoia na mesa (base em y=0) e escala para a largura real.
//
//   node scripts/prepare-model.mjs entrada.glb saida.glb <largura-em-cm>
//
// Depois comprima: npx @gltf-transform/cli optimize saida.glb saida.glb --texture-compress webp

import { NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import { getBounds } from "@gltf-transform/core";

const [input, output, widthCm] = process.argv.slice(2);
if (!input || !output || !widthCm) {
  console.error("uso: node scripts/prepare-model.mjs entrada.glb saida.glb <largura-em-cm>");
  process.exit(1);
}

const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
const doc = await io.read(input);
const scene = doc.getRoot().getDefaultScene() ?? doc.getRoot().listScenes()[0];

const { min, max } = getBounds(scene);
const size = [max[0] - min[0], max[1] - min[1], max[2] - min[2]];
const scale = Number(widthCm) / 100 / Math.max(size[0], size[2]);
const center = [(min[0] + max[0]) / 2, min[1], (min[2] + max[2]) / 2];

// Um nó raiz novo aplica escala e deslocamento sem mexer na geometria original.
const root = doc.createNode("prato").setScale([scale, scale, scale]).setTranslation([
  -center[0] * scale,
  -center[1] * scale,
  -center[2] * scale,
]);
for (const child of scene.listChildren()) {
  scene.removeChild(child);
  root.addChild(child);
}
scene.addChild(root);

await io.write(output, doc);
const cm = size.map((s) => ((s * scale) * 100).toFixed(1));
console.log(`✓ ${output}  L×A×P = ${cm[0]} × ${cm[1]} × ${cm[2]} cm`);
