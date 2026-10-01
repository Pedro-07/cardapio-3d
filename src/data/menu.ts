export type Category = {
  id: string;
  name: string;
};

export type Product = {
  id: string;
  categoryId: string;
  name: string;
  tagline: string;
  description: string;
  price: number;
  /** Arquivo GLB em escala real (metros). */
  model: string;
  /** Medidas reais do prato servido, em centímetros. */
  dimensions: { width: number; depth: number; height: number };
  weightGrams: number;
  serves: number;
  prepMinutes: number;
  ingredients: string[];
  /** Selos de qualidade/origem mostrados em destaque. */
  quality: string[];
  allergens: string[];
  nutrition: { kcal: number; protein: number; carbs: number; fat: number };
  /** Giro 360° com quadros reais (vista principal); o GLB fica para medidas e AR. */
  turntable?: { dir: string; frames: number };
  /** Ângulo inicial da câmera no visualizador 3D. */
  cameraOrbit?: string;
};

export const restaurant = {
  name: "Brasa & Forno",
  subtitle: "Cozinha artesanal",
};

export const categories: Category[] = [
  { id: "lanches", name: "Lanches" },
  { id: "pizzas", name: "Pizzas" },
  { id: "porcoes", name: "Porções" },
  { id: "bebidas", name: "Bebidas" },
  { id: "sobremesas", name: "Sobremesas" },
];

export const products: Product[] = [
  {
    id: "smash-burger",
    categoryId: "lanches",
    name: "Smash Salada",
    tagline: "O clássico da casa",
    description:
      "Blend bovino prensado na chapa até formar crosta, queijo derretido, bacon crocante, maionese da casa e alface crespa no pão brioche tostado.",
    price: 34.9,
    model: "/models/smash-salada.glb",
    turntable: { dir: "/turntables/smash-salada", frames: 120 },
    // Estimado pela proporção da foto; confirme com uma régua.
    dimensions: { width: 12, depth: 11.7, height: 8.8 },
    weightGrams: 290,
    serves: 1,
    prepMinutes: 12,
    ingredients: ["Pão brioche", "Blend bovino 150 g", "Queijo prato", "Bacon", "Maionese da casa", "Alface crespa"],
    quality: ["Giro 360° do lanche real", "Carne moída na hora", "Pão brioche"],
    allergens: ["Glúten", "Lactose", "Ovo"],
    nutrition: { kcal: 720, protein: 38, carbs: 46, fat: 41 },
  },
  {
    id: "duplo-bacon",
    categoryId: "lanches",
    name: "Duplo Bacon",
    tagline: "Para a fome de verdade",
    description:
      "Dois smashes de 120 g, duas fatias de cheddar, bacon defumado crocante, alface e tomate no brioche tostado na manteiga.",
    price: 44.9,
    model: "/models/duplo-bacon.glb",
    dimensions: { width: 12, depth: 12, height: 13 },
    weightGrams: 410,
    serves: 1,
    prepMinutes: 15,
    ingredients: ["Pão brioche com gergelim", "2× blend bovino 120 g", "2× cheddar", "Bacon defumado", "Alface", "Tomate"],
    quality: ["Bacon defumado artesanalmente", "Carne Angus", "Brioche feito na casa"],
    allergens: ["Glúten", "Lactose", "Ovo", "Gergelim"],
    nutrition: { kcal: 1080, protein: 62, carbs: 48, fat: 70 },
  },
  {
    id: "pizza-margherita",
    categoryId: "pizzas",
    name: "Margherita",
    tagline: "Napolitana, forno a lenha",
    description:
      "Massa de longa fermentação (48 h), molho de tomate italiano, muçarela de búfala e manjericão fresco. Assada a 450 °C em 90 segundos.",
    price: 79,
    model: "/models/pizza-margherita.glb",
    dimensions: { width: 35, depth: 35, height: 3.5 },
    weightGrams: 780,
    serves: 3,
    prepMinutes: 18,
    ingredients: ["Massa de fermentação natural", "Tomate pelado italiano", "Muçarela de búfala", "Manjericão", "Azeite extravirgem"],
    quality: ["Fermentação de 48 h", "Farinha italiana tipo 00", "Forno a lenha"],
    allergens: ["Glúten", "Lactose"],
    nutrition: { kcal: 1850, protein: 82, carbs: 230, fat: 62 },
    cameraOrbit: "20deg 55deg auto",
  },
  {
    id: "batata-frita",
    categoryId: "porcoes",
    name: "Batata Rústica",
    tagline: "Crocante por fora, macia por dentro",
    description: "Batatas cortadas na casa, fritas em duas temperaturas e finalizadas com flor de sal e alecrim.",
    price: 24,
    model: "/models/batata-frita.glb",
    dimensions: { width: 11, depth: 11, height: 16 },
    weightGrams: 250,
    serves: 2,
    prepMinutes: 10,
    ingredients: ["Batata asterix", "Flor de sal", "Alecrim", "Óleo de girassol"],
    quality: ["Cortada na casa", "Dupla fritura", "Sem glúten"],
    allergens: [],
    nutrition: { kcal: 610, protein: 7, carbs: 72, fat: 32 },
  },
  {
    id: "limonada-suica",
    categoryId: "bebidas",
    name: "Limonada Suíça",
    tagline: "500 ml, gelada",
    description: "Limão tahiti batido com casca, leite condensado e muito gelo. Servida no copo de vidro de 500 ml (16 cm; 18 cm com o canudo).",
    price: 16,
    model: "/models/limonada-suica.glb",
    dimensions: { width: 8.4, depth: 8.4, height: 18 },
    weightGrams: 500,
    serves: 1,
    prepMinutes: 4,
    ingredients: ["Limão tahiti", "Leite condensado", "Gelo filtrado", "Açúcar (opcional)"],
    quality: ["Limão orgânico", "Gelo de água filtrada"],
    allergens: ["Lactose"],
    nutrition: { kcal: 280, protein: 4, carbs: 58, fat: 5 },
  },
  {
    id: "petit-gateau",
    categoryId: "sobremesas",
    name: "Petit Gâteau",
    tagline: "Chocolate 70% com sorvete",
    description:
      "Bolinho de chocolate belga 70% com centro cremoso, servido quente com sorvete de baunilha de fava e morango fresco.",
    price: 29,
    model: "/models/petit-gateau.glb",
    dimensions: { width: 25, depth: 25, height: 6 },
    weightGrams: 210,
    serves: 1,
    prepMinutes: 14,
    ingredients: ["Chocolate belga 70%", "Manteiga", "Ovos", "Farinha", "Sorvete de baunilha", "Morango", "Hortelã"],
    quality: ["Chocolate belga", "Baunilha em fava", "Assado na hora"],
    allergens: ["Glúten", "Lactose", "Ovo"],
    nutrition: { kcal: 540, protein: 8, carbs: 52, fat: 34 },
    cameraOrbit: "30deg 60deg auto",
  },
];

export const formatPrice = (value: number) =>
  value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
