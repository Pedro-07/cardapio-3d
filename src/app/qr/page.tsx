import type { Metadata } from "next";
import { QrSheet } from "./qr-sheet";

export const metadata: Metadata = { title: "QR codes das mesas" };

export default function QrPage() {
  return <QrSheet />;
}
