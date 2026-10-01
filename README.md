# Cardápio 3D

Cardápio digital em que o cliente escaneia o QR code da mesa e vê cada prato em 3D,
com medidas reais, peso, ingredientes, nutrição e alergênicos. Com o botão
**"Ver na minha mesa"**, o prato é colocado sobre a mesa em **tamanho real** usando a
câmera do celular (AR): ARCore/Scene Viewer no Android e Quick Look no iPhone.

## Rodar

```bash
npm install
npm run dev          # http://localhost:3000
```

- `/?mesa=7` abre o cardápio identificando a mesa 7
- `/?prato=tomahawk` abre direto num prato
- `/qr` gera e imprime os QR codes das mesas

> O AR só funciona em HTTPS e no celular. Para testar no seu aparelho, publique
> (ex.: Vercel) ou use um túnel HTTPS para o `localhost`.

## Onde mexer

A direção visual, as telas e as regras de movimento estão em `SPEC.md`.

| O quê | Arquivo |
| --- | --- |
| Pratos, textos, preços, origem, harmonização | `src/data/menu.ts` |
| Abertura (marca + nota do chef) | `src/components/opening.tsx` |
| Pratos em tela cheia | `src/components/dish-reel.tsx` |
| Ficha do prato | `src/components/dish-sheet.tsx` |
| Na sua mesa (3D, medidas, AR) | `src/components/table-view.tsx` |
| Fotos e vídeos | `public/media/<prato>/` (`poster.webp`, `video.mp4`, `1.webp`…) |

## Modelos 3D

Os `.glb` são referências de porção: forma aproximada, escala real (1 unidade = 1 metro),
gerados por `node scripts/generate-models.mjs`. Um modelo vindo de IA ou escaneamento entra com
`node scripts/prepare-model.mjs entrada.glb saida.glb <largura-em-cm>`. Para produção, substitua cada arquivo por um
escaneamento do prato de verdade, mantendo a escala em metros e o arquivo leve
(idealmente < 3 MB). Caminhos comuns:

- **Fotogrametria pelo celular** (Polycam, Luma, RealityScan): fotografe o prato em volta e exporte GLB.
- **Imagem → 3D por IA**: bom para rascunhos rápidos; confira a escala depois.
- **Modelagem 3D profissional** (Blender) para pratos de destaque.

Após trocar um modelo, confira as medidas em `menu.ts` e comprima com
`npx @gltf-transform/cli optimize entrada.glb saida.glb`.
