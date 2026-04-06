"use client";

import Link from "next/link";
import { useLanguage } from "@/components/layout/LanguageProvider";
import { ImageIcon, Brush, Wand2, AudioLines } from "lucide-react";
import { useConfig, isModelFamilyAvailable } from "@/hooks/useConfig";
import type { SanitizedAppConfig } from "@/types/config";
import type { TranslationKey } from "@/i18n";

const allCards: { href: string; titleKey: TranslationKey; descKey: TranslationKey; familyKey: keyof SanitizedAppConfig["models"]; Icon: React.ComponentType<{ className?: string }> }[] = [
  { href: "/image/gpt", titleKey: "home.gptImage.title", descKey: "home.gptImage.desc", familyKey: "gpt-image", Icon: ImageIcon },
  { href: "/image/mai", titleKey: "home.maiImage.title", descKey: "home.maiImage.desc", familyKey: "mai-image", Icon: Brush },
  { href: "/image/flux", titleKey: "home.fluxImage.title", descKey: "home.fluxImage.desc", familyKey: "flux-image", Icon: Wand2 },
  { href: "/audio/tts", titleKey: "home.tts.title", descKey: "home.tts.desc", familyKey: "tts", Icon: AudioLines },
];

export default function HomePage() {
  const { t } = useLanguage();
  const { config, isLoading } = useConfig();

  const visibleCards = config
    ? allCards.filter((card) => isModelFamilyAvailable(config, card.familyKey))
    : [];

  return (
    <main className="mx-auto flex min-h-[calc(100vh-3.5rem)] max-w-7xl flex-col items-center justify-center px-4">
      <h1 className="mb-3 text-4xl font-bold tracking-tight">{t("home.title")}</h1>
      <p className="mb-10 text-lg text-muted-foreground">
        {t("home.subtitle")}
      </p>
      {isLoading ? (
        <p className="text-muted-foreground">{t("common.loading")}</p>
      ) : visibleCards.length > 0 ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {visibleCards.map((card) => (
            <Link
              key={card.href}
              href={card.href}
              className="group rounded-xl border bg-card p-6 text-card-foreground shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="mb-3 inline-flex rounded-lg bg-accent p-2.5">
                <card.Icon className="h-5 w-5 text-primary" />
              </div>
              <h2 className="mb-2 text-xl font-semibold tracking-tight">{t(card.titleKey)}</h2>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {t(card.descKey)}
              </p>
            </Link>
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground">{t("home.noModels")}</p>
      )}
    </main>
  );
}
