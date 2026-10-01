// Conteúdo DEMONSTRATIVO da steakhouse fictícia LUME.
// Textos, preços e origens devem ser trocados pelos dados reais de cada restaurante.

export type MomentId = "entradas" | "cortes" | "acompanhamentos" | "sobremesas" | "vinhos";

export type Moment = { id: MomentId; name: string };

export type Dish = {
  id: string;
  moment: MomentId;
  name: string;
  /** Linha curta de fatos sob o nome. */
  facts: string[];
  price: string;
  description: string;
  media: {
    poster: string;
    video?: string;
    /** Fotos de detalhe (a galeria sempre começa pelo pôster). */
    gallery?: string[];
  };
  /** Linha do tempo de origem e técnica. */
  origin?: { label: string; value: string }[];
  /** Ponto recomendado pelo chef, de 0 (mal passado) a 4 (bem passado). */
  doneness?: number;
  pairing?: { dishId: string; note: string };
  /** Referência de porção em 3D/AR (escala real, forma aproximada). */
  table?: {
    model: string;
    dimensions: { width: number; depth: number; height: number };
    weight: string;
  };
  allergens: string[];
};

export const restaurant = {
  name: "LUME",
  subtitle: "Casa de Carnes",
  chefNote:
    "Hoje a brasa está com lenha de laranjeira. O ancho saiu da câmara de maturação esta manhã.",
  chef: "Chef [PREENCHER]",
};

export const moments: Moment[] = [
  { id: "entradas", name: "Entradas" },
  { id: "cortes", name: "Cortes" },
  { id: "acompanhamentos", name: "Acompanhamentos" },
  { id: "sobremesas", name: "Sobremesas" },
  { id: "vinhos", name: "Vinhos" },
];

export const DONENESS = ["Mal passado", "Ao ponto para mal", "Ao ponto", "Ao ponto para bem", "Bem passado"];

export const dishes: Dish[] = [
  {
    id: "steak-tartare",
    moment: "entradas",
    name: "Steak tartare",
    facts: ["120 g", "cortado na faca"],
    price: "R$ 68",
    description:
      "Filé cortado na faca no momento do pedido, gema curada em sal e açúcar, alcaparras, chalota e torradas finas de fermentação natural.",
    media: { poster: "/media/steak-tartare/poster.webp" },
    origin: [
      { label: "Corte", value: "Miolo do filé" },
      { label: "Gema", value: "Curada por 3 dias" },
    ],
    allergens: ["Ovo", "Glúten"],
  },
  {
    id: "provoleta",
    moment: "entradas",
    name: "Provoleta na brasa",
    facts: ["mel de engenho", "tomilho"],
    price: "R$ 54",
    description:
      "Provolone curado selado na frigideira de ferro sobre a brasa, até formar crosta. Finalizado com mel de engenho e tomilho fresco.",
    media: { poster: "/media/provoleta/poster.webp" },
    allergens: ["Lactose"],
  },
  {
    id: "tomahawk",
    moment: "cortes",
    name: "Tomahawk",
    facts: ["1,2 kg", "serve 2 a 3", "maturado 45 dias"],
    price: "R$ 520",
    description:
      "O corte que dá nome à casa. Bisteca de costela com o osso inteiro, maturada a seco e levada à brasa de lenha. Chega à mesa fatiada, sobre a tábua, com alho assado e sal grosso.",
    media: {
      poster: "/media/tomahawk/poster.webp",
      video: "/media/tomahawk/video.mp4",
      gallery: ["/media/tomahawk/1.webp", "/media/tomahawk/2.webp"],
    },
    origin: [
      { label: "Raça", value: "Angus, criado a pasto" },
      { label: "Origem", value: "Fazenda [PREENCHER], MS" },
      { label: "Maturação", value: "45 dias a seco, 2 °C" },
      { label: "Brasa", value: "Lenha de laranjeira, 18 min" },
    ],
    doneness: 1,
    pairing: { dishId: "malbec", note: "Taninos firmes para a gordura do osso." },
    table: {
      model: "/models/tomahawk.glb",
      dimensions: { width: 48, depth: 28, height: 6 },
      weight: "1,2 kg",
    },
    allergens: [],
  },
  {
    id: "ancho-angus",
    moment: "cortes",
    name: "Ancho Angus",
    facts: ["400 g", "serve 1", "maturado 30 dias"],
    price: "R$ 189",
    description:
      "O miolo da costela, com a gordura entremeada que derrete na brasa. Selado em fogo alto e descansado antes de servir, com flor de sal e alecrim.",
    media: {
      poster: "/media/ancho-angus/poster.webp",
      video: "/media/ancho-angus/video.mp4",
      gallery: ["/media/ancho-angus/1.webp", "/media/ancho-angus/2.webp"],
    },
    origin: [
      { label: "Raça", value: "Angus" },
      { label: "Origem", value: "Fazenda [PREENCHER], RS" },
      { label: "Maturação", value: "30 dias a seco" },
      { label: "Brasa", value: "Grelha de ferro, 9 min" },
    ],
    doneness: 1,
    pairing: { dishId: "malbec", note: "Fruta madura para a crosta tostada." },
    table: {
      model: "/models/ancho-angus.glb",
      dimensions: { width: 32, depth: 22, height: 6 },
      weight: "400 g",
    },
    allergens: [],
  },
  {
    id: "picanha-wagyu",
    moment: "cortes",
    name: "Picanha wagyu",
    facts: ["300 g", "marmoreio 6+"],
    price: "R$ 260",
    description:
      "Picanha de wagyu com a capa de gordura preservada, fatiada grossa e servida com chimichurri da casa.",
    media: { poster: "/media/picanha-wagyu/poster.webp" },
    origin: [
      { label: "Raça", value: "Wagyu meio-sangue" },
      { label: "Marmoreio", value: "Grau 6+" },
      { label: "Brasa", value: "Espeto, fogo de chão" },
    ],
    doneness: 1,
    pairing: { dishId: "malbec", note: "Acidez para limpar a gordura do marmoreio." },
    table: {
      model: "/models/picanha-wagyu.glb",
      dimensions: { width: 29, depth: 29, height: 7 },
      weight: "300 g",
    },
    allergens: [],
  },
  {
    id: "batatas-pato",
    moment: "acompanhamentos",
    name: "Batatas na gordura de pato",
    facts: ["flor de sal", "alecrim"],
    price: "R$ 42",
    description: "Batatas cozidas, esmagadas e assadas na gordura de pato até a casca estalar.",
    media: { poster: "/media/batatas-pato/poster.webp" },
    allergens: [],
  },
  {
    id: "pudim",
    moment: "sobremesas",
    name: "Pudim de doce de leite queimado",
    facts: ["caramelo amargo"],
    price: "R$ 38",
    description: "Pudim de doce de leite cozido por oito horas, com caramelo levado ao ponto amargo.",
    media: { poster: "/media/pudim/poster.webp" },
    allergens: ["Lactose", "Ovo"],
  },
  {
    id: "malbec",
    moment: "vinhos",
    name: "Malbec Gran Reserva",
    facts: ["Mendoza", "taça ou garrafa"],
    price: "R$ 72 · R$ 390",
    description:
      "Vale de Uco, vinhedos de altitude. Dezoito meses em barrica de carvalho francês. Fruta escura, especiaria e taninos firmes.",
    media: { poster: "/media/malbec/poster.webp" },
    origin: [
      { label: "Uva", value: "Malbec" },
      { label: "Região", value: "Vale de Uco, Mendoza" },
      { label: "Barrica", value: "18 meses, carvalho francês" },
    ],
    allergens: ["Sulfitos"],
  },
];

export const roman = (n: number) =>
  ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"][n - 1] ?? String(n);
