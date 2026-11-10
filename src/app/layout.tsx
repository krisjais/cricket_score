import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
  title: "CricketLive — Ball-by-ball cricket scoring",
  description:
    "Live cricket scoring with real-time scoreboards. Admins control matches ball-by-ball; the audience watches live.",
  keywords: ["cricket", "live score", "cricket scoring", "scorecard", "ball-by-ball"],
  icons: {
    icon: "/logo.svg",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#052e16",
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
