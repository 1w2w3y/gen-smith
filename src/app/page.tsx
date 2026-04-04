"use client";

import Link from "next/link";
import { useLanguage } from "@/components/layout/LanguageProvider";
import { ImageIcon, Wand2, AudioLines } from "lucide-react";

const cardIcons = [ImageIcon, Wand2, AudioLines];

export default function HomePage() {
  const { t } = useLanguage();

  const cards = [
    { href: "/image/gpt", titleKey: "home.gptImage.title", descKey: "home.gptImage.desc" },
    { href: "/image/flux", titleKey: "home.fluxImage.title", descKey: "home.fluxImage.desc" },
    { href: "/audio/tts", titleKey: "home.tts.title", descKey: "home.tts.desc" },
  ];

  return (
    <main className="mx-auto flex min-h-[calc(100vh-3.5rem)] max-w-7xl flex-col items-center justify-center px-4">
      <h1 className="mb-3 text-4xl font-bold tracking-tight">{t("home.title")}</h1>
      <p className="mb-10 text-lg text-muted-foreground">
        {t("home.subtitle")}
      </p>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card, i) => {
          const Icon = cardIcons[i];
          return (
            <Link
              key={card.href}
              href={card.href}
              className="group rounded-xl border bg-card p-6 text-card-foreground shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="mb-3 inline-flex rounded-lg bg-accent p-2.5">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <h2 className="mb-2 text-xl font-semibold tracking-tight">{t(card.titleKey)}</h2>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {t(card.descKey)}
              </p>
            </Link>
          );
        })}
      </div>
    </main>
  );
}
