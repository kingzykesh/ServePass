import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MealPass — QR Meal Ticket Management",
  description: "Generate, print, distribute, and verify QR meal tickets.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}