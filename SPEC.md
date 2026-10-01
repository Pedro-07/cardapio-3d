# SPEC — Cardápio "Mesa do Chef" (demo steakhouse)

Fonte da verdade da implementação. Toda tela consulta este arquivo.

## 1. Briefing

- **Produto:** cardápio digital por QR code para restaurantes de alto padrão. Não é app de pedido: é **vitrine e experiência**. O cliente explora pratos com vídeo, fotos, história, harmonização e referência de tamanho real; o pedido continua com o garçom.
- **Público:** clientes de restaurantes caros. Esperam silêncio visual, ritmo lento, informação de origem e técnica.
- **Demo:** steakhouse fictícia **LUME — Casa de Carnes**. Todo texto, preço e origem abaixo é **demonstrativo** e será trocado pelos dados reais de cada cliente.
- **Personalidade:** noturna, precisa, quente, discreta. **Não é:** fast-food, rústica de churrascaria rodízio, "app de delivery".
- **Uso:** 100% celular, em pé de mesa, luz baixa. Uma mão.
- **3D:** só como **referência de porção** ("Na sua mesa"), sem promessa de fidelidade.

## 2. Direção de arte — Mesa do Chef

- **Conceito:** o prato entra em cena como num filme; o resto da tela se cala.
- **Gesto central:** cada prato ocupa a tela inteira com vídeo em loop; o nome surge em serifada grande na base, revelado linha a linha.
- **Tipografia:** Instrument Serif (display) + Geist (texto, legendas, números).
- **Paleta:** fundo `#0E0C0A`, tinta `#F2EBE0`, acento latão `#C8A46A`. Brasa (`#E0662B`) só no ponto de cozimento.
- **Textura:** grão sutil (5%) sobre toda a interface.
- **Movimento:** lento e confiante. Entradas em `expo.out` (0,9–1,2 s); trocas em `power2.inOut`. Nada pula, nada quica.

## 3. Tokens

```css
:root {
  --paper: #0e0c0a;
  --ink: #f2ebe0;
  --accent: #c8a46a;
  --ember: #e0662b;

  --font-display: "Instrument Serif", serif;
  --font-text: "Geist", sans-serif;

  --fs-hero: clamp(3.25rem, 15vw, 5.5rem);
  --fs-h2: clamp(2.25rem, 10vw, 3.5rem);
  --fs-body: 1rem;
  --fs-caption: 0.6875rem; /* legendas em caixa alta, tracking 0.18em */

  --gutter: 1.25rem;
  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
}
```

Regras: títulos com `line-height` 0.95 e `letter-spacing` -0.01em; legendas em caixa alta pequenas; latão só em detalhes (numeração, linhas finas, preço). Sem cards com sombra, sem `rounded-2xl` genérico: superfícies são planos escuros com fios de 1px `rgb(242 235 224 / 0.1)`.

## 4. Stack

- Next.js (App Router) + TypeScript + Tailwind (tokens mapeados no `@theme`).
- GSAP + `@gsap/react` (SplitText para os títulos). Sem Lenis: a navegação é por snap de tela cheia, não scroll longo.
- `@google/model-viewer` mantido só para "Na sua mesa" (AR + medidas).
- Vídeos MP4 H.264 verticais 720×1280, sem áudio, ≤ 2,5 MB, com pôster WebP.

```
src/app/page.tsx               → abertura + cardápio
src/components/opening.tsx     → tela de abertura
src/components/dish-reel.tsx   → pratos em tela cheia (snap vertical)
src/components/dish-sheet.tsx  → ficha do prato (camadas)
src/components/table-view.tsx  → "Na sua mesa" (3D/AR)
src/data/menu.ts               → conteúdo
public/media/<prato>/          → video.mp4, poster.webp, 1..4.webp
```

## 5. Telas

### Tela 1 — Abertura
Objetivo: criar o clima antes de qualquer prato.
Conteúdo:
- Legenda: `MESA 7 · QUINTA, 1 DE OUTUBRO` (data do dia)
- Marca: **LUME**
- Sub: `Casa de Carnes`
- Nota do chef: *"Hoje a brasa está com lenha de laranjeira. O ancho saiu da câmara de maturação esta manhã."* — Chef [PREENCHER]
- Ação: `Ver o cardápio` (+ dica `deslize para cima`)
Fundo: vídeo do prato-assinatura (Tomahawk) desfocado e escurecido 60%.
Entrada: vídeo funde de 0→1 (1,6 s); "LUME" revelado por máscara, letra a letra (stagger 0,06, expo.out); nota do chef entra 0,4 s depois.
Saída: deslizar para cima → a abertura sobe e o primeiro prato já está tocando por baixo.
Reduced motion: estático, sem vídeo (pôster).

### Tela 2 — Pratos em tela cheia (o reel)
Objetivo: navegar e desejar. É o "wow" principal.
Layout: cada prato = 100dvh, snap vertical. Vídeo (ou foto com zoom lento 1→1,06 em 8 s) cobrindo a tela; gradiente escuro só no terço inferior.
Base do prato:
- Numeração e momento em latão: `II · CORTES`
- Nome em display grande (2 linhas no máximo)
- Linha de fatos em Geist pequena: `400 g · serve 1 · maturado 30 dias`
- Preço em latão
- Botão discreto: `Conhecer o prato` (abre a Tela 3)
Topo fixo: marca `LUME` pequena à esquerda; à direita os momentos (`Entradas · Cortes · Acompanhamentos · Sobremesas · Vinhos`) como índice que acompanha o prato atual, com fio de progresso em latão.
Entrada de cada prato (ao assentar o snap): nome sobe por linha com máscara (yPercent 100→0, 1,1 s, expo.out, stagger 0,08); fatos e preço em opacidade 0→1 com 0,3 s de atraso.
Vídeo: só o prato visível toca; os vizinhos ficam pausados no pôster (economia de bateria e dados).
Reduced motion: sem reveal, sem zoom.

### Tela 3 — Ficha do prato (camadas)
Objetivo: aprofundar sem tirar o prato de vista.
Abertura: painel sobe de baixo até 88% da tela (power2.inOut, 0,7 s); o vídeo continua visível e escurecido no topo.
Blocos, nesta ordem, separados por fio de 1px e legenda numerada:
1. `01 — O PRATO`: descrição (2–3 frases) + galeria horizontal de 3–4 fotos de detalhe.
2. `02 — ORIGEM E TÉCNICA`: linha do tempo vertical fina (ex.: Raça → Fazenda → Maturação → Brasa), cada item com 1 linha.
3. `03 — PONTO`: régua visual de cozimento (mal passado → bem passado) com o ponto recomendado pelo chef marcado em brasa. Informativo, não é seleção.
4. `04 — HARMONIZAÇÃO`: vinho sugerido (nome, uva, região, taça/garrafa).
5. `05 — NA SUA MESA`: botão para a Tela 4 + medidas (L × P × A) e peso.
6. Rodapé: alergênicos em texto pequeno; `Para pedir, chame o garçom.`

### Tela 4 — Na sua mesa
Objetivo: dar noção de porção.
Abre o modelo 3D com cotas de medida (já existente) e o botão de AR em tamanho real. Texto de apoio: `Representação aproximada, em escala real.`

## 6. Conteúdo demo (LUME)

| # | Momento | Prato | Fatos | Preço | Mídia |
|---|---|---|---|---|---|
| I | Entradas | Steak tartare na faca | 120 g · gema curada · alcaparras | R$ 68 | foto |
| II | Entradas | Provoleta na brasa | mel de engenho · tomilho | R$ 54 | foto |
| III | Cortes | Ancho Angus | 400 g · maturado 30 dias | R$ 189 | **vídeo** |
| IV | Cortes | Tomahawk | 1,2 kg · serve 2–3 | R$ 520 | **vídeo** (assinatura) |
| V | Cortes | Picanha wagyu | 300 g · marmoreio 6+ | R$ 260 | foto |
| VI | Acompanhamentos | Batatas na gordura de pato | flor de sal · alecrim | R$ 42 | foto |
| VII | Sobremesas | Pudim de doce de leite queimado | — | R$ 38 | foto |
| VIII | Vinhos | Malbec Gran Reserva | Mendoza · taça ou garrafa | R$ 72 / R$ 390 | foto |

Textos completos (descrição, origem, harmonização) ficam em `menu.ts`; todos marcados como demonstrativos.

## 7. Regras de movimento

- Momentos "wow": (1) abertura com a marca revelada sobre o vídeo; (2) entrada do nome de cada prato no reel. Nada mais compete com eles.
- O resto: opacidade e deslocamentos curtos (≤ 16 px).
- `expo.out` para entradas, `power2.inOut` para painéis, `none` só em scrub.
- Durações 0,8–1,4 s em entradas; hover/toque ≤ 0,2 s.
- `prefers-reduced-motion`: tudo estático, vídeos substituídos por pôster.

## 8. Assets

| Asset | Status | Como |
|---|---|---|
| Fotos dos 8 pratos (1 principal + 2–3 detalhes nos cortes) | gerar | GPT Image 2.5 (≈ 0,25 crédito cada) |
| Vídeo Tomahawk e Ancho (vertical, 5 s, loop) | gerar | Kling 3.0 a partir da foto (≈ 6,25 créditos cada) |
| 3D de referência de porção (cortes) | gerar | modelo procedural em escala (prato + corte), sem custo |
| Grão de textura | gerar | SVG de ruído inline |
| Logo LUME | gerar | tipográfico (Instrument Serif) |

Orçamento: ~15 créditos (2 vídeos + ~16 fotos) — cabe no saldo atual (15,5).

## 9. Checklist anti-"cara de IA" (revisar a cada tela)

Sem gradiente roxo/azul, sem glassmorphism, sem grade de cards iguais, sem ícone em tudo, sem fade-up idêntico em todos os elementos, sem palavras proibidas ("experiência única", "eleve", "de ponta"…), sem número real inventado fora do conteúdo demo marcado.
