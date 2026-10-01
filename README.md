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
- `/?prato=pizza-margherita` abre direto num prato
- `/qr` gera e imprime os QR codes das mesas

> O AR só funciona em HTTPS e no celular. Para testar no seu aparelho, publique
> (ex.: Vercel) ou use um túnel HTTPS para o `localhost`.

## Onde mexer

| O quê | Arquivo |
| --- | --- |
| Pratos, preços, medidas, ingredientes | `src/data/menu.ts` |
| Visualizador 3D, AR e cotas de medidas | `src/components/model-stage.tsx` |
| Tela do cardápio e pedido | `src/components/menu-3d.tsx` |
| Modelos 3D | `public/models/*.glb` |

## Modelos 3D

Os `.glb` atuais são placeholders estilizados gerados por `node scripts/generate-models.mjs`,
já na escala real (1 unidade = 1 metro). Para produção, substitua cada arquivo por um
escaneamento do prato de verdade, mantendo a escala em metros e o arquivo leve
(idealmente < 3 MB). Caminhos comuns:

- **Fotogrametria pelo celular** (Polycam, Luma, RealityScan): fotografe o prato em volta e exporte GLB.
- **Imagem → 3D por IA**: bom para rascunhos rápidos; confira a escala depois.
- **Modelagem 3D profissional** (Blender) para pratos de destaque.

Após trocar um modelo, confira as medidas em `menu.ts` e comprima com
`npx @gltf-transform/cli optimize entrada.glb saida.glb`.
