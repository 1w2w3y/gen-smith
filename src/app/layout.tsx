import "./globals.css";
import { ThemeProvider } from "@/components/layout/ThemeProvider";
import { LanguageProvider } from "@/components/layout/LanguageProvider";
import { TelemetryProvider } from "@/components/layout/TelemetryProvider";
import { Navbar } from "@/components/layout/Navbar";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "gen-smith",
  description:
    "Playground for generative AI models on Azure AI Foundry",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
        >
          <LanguageProvider>
            <TelemetryProvider>
              <Navbar />
              {children}
            </TelemetryProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
