import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
  title: "Nexcore Premier League — Live Cricket Scoring",
  description:
    "Official Nexcore Premier League match center with real-time ball-by-ball scoring, live scorecards, points table, and umpire console.",
  keywords: ["Nexcore Premier League", "NPL", "cricket", "live score", "cricket scoring", "scorecard"],
  icons: {
    icon: [{ url: "/apl-icon-s9.png", type: "image/png", sizes: "192x192" }],
    shortcut: "/apl-icon-s9.png",
    apple: "/apl-icon-s9.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#7A1426",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased bg-background text-foreground" suppressHydrationWarning>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
