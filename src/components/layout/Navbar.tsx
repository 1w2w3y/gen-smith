"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/components/layout/LanguageProvider";
import { useConfig, isModelFamilyAvailable } from "@/hooks/useConfig";
import type { SanitizedAppConfig } from "@/types/config";

const NAV_FAMILY_MAP: Record<string, keyof SanitizedAppConfig["models"]> = {
  "/image/gpt": "gpt-image",
  "/image/flux": "flux-image",
  "/audio/tts": "tts",
};

export function Navbar() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const { locale, setLocale, t } = useLanguage();
  const { config } = useConfig();

  const allNavLinks = [
    { href: "/image/gpt", label: t("nav.gptImage") },
    { href: "/image/flux", label: t("nav.fluxImage") },
    { href: "/audio/tts", label: t("nav.tts") },
  ];

  const navLinks = config
    ? allNavLinks.filter((link) => {
        const familyKey = NAV_FAMILY_MAP[link.href];
        return familyKey ? isModelFamilyAvailable(config, familyKey) : true;
      })
    : [];

  return (
    <nav className="border-b border-border/60 bg-background/80 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-7xl items-center px-4">
        <Link href="/" className="mr-8 text-lg font-bold tracking-tight text-foreground">
          gen-smith
        </Link>
        <div className="flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors duration-150",
                pathname === link.href
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
              )}
            >
              {link.label}
            </Link>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocale(locale === "en" ? "zh" : "en")}
            className="text-xs font-medium"
          >
            {t("nav.toggleLang")}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">{t("nav.toggleTheme")}</span>
          </Button>
        </div>
      </div>
    </nav>
  );
}
