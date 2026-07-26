import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "localhost:3000";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const baseUrl = new URL(`${protocol}://${host}`);
  const description = "A calm, private place to track infant symptoms, ask questions, and prepare for a doctor visit.";

  return {
    metadataBase: baseUrl,
    title: "Infant Symptom Support",
    description,
    icons: {
      icon: "/favicon.svg",
      shortcut: "/favicon.svg",
    },
    openGraph: {
      title: "Infant Symptom Support",
      description,
      images: [{ url: new URL("/og.png", baseUrl).toString(), width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: "Infant Symptom Support",
      description,
      images: [new URL("/og.png", baseUrl).toString()],
    },
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
