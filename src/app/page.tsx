import { Menu3D } from "@/components/menu-3d";

// O QR code de cada mesa aponta para "/?mesa=N"; "?prato=<id>" abre direto num prato.
export default async function Home({ searchParams }: PageProps<"/">) {
  const { mesa, prato } = await searchParams;
  const table = typeof mesa === "string" ? mesa.slice(0, 4) : undefined;
  return <Menu3D table={table} initialId={typeof prato === "string" ? prato : undefined} />;
}
