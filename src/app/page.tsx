"use client";

import Link from "next/link";
import { useLanguage } from "@/components/layout/LanguageProvider";

export default function HomePage() {
  const { t } = useLanguage();

  return (
    <main className="mx-auto flex min-h-[calc(100vh-3.5rem)] max-w-7xl flex-col items-center justify-center px-4">
      <h1 className="mb-4 text-4xl font-bold">{t("home.title")}</h1>
      <p className="mb-8 text-lg text-muted-foreground">
        {t("home.subtitle")}
      </p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link
          href="/image/gpt"
          className="rounded-lg border bg-card p-6 text-card-foreground shadow-sm transition-colors hover:bg-accent"
        >
          <h2 className="mb-2 text-xl font-semibold">{t("home.gptImage.title")}</h2>
          <p className="text-sm text-muted-foreground">
            {t("home.gptImage.desc")}
          </p>
        </Link>
        <Link
          href="/image/flux"
          className="rounded-lg border bg-card p-6 text-card-foreground shadow-sm transition-colors hover:bg-accent"
        >
          <h2 className="mb-2 text-xl font-semibold">{t("home.fluxImage.title")}</h2>
          <p className="text-sm text-muted-foreground">
            {t("home.fluxImage.desc")}
          </p>
        </Link>
        <Link
          href="/audio/tts"
          className="rounded-lg border bg-card p-6 text-card-foreground shadow-sm transition-colors hover:bg-accent"
        >
          <h2 className="mb-2 text-xl font-semibold">{t("home.tts.title")}</h2>
          <p className="text-sm text-muted-foreground">
            {t("home.tts.desc")}
          </p>
        </Link>
      </div>
    </main>
  );
}
