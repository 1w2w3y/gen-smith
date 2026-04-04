import Link from "next/link";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-[calc(100vh-3.5rem)] max-w-7xl flex-col items-center justify-center px-4">
      <h1 className="mb-4 text-4xl font-bold">gen-smith</h1>
      <p className="mb-8 text-lg text-muted-foreground">
        Playground for generative AI models on Azure AI Foundry
      </p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link
          href="/image/gpt"
          className="rounded-lg border bg-card p-6 text-card-foreground shadow-sm transition-colors hover:bg-accent"
        >
          <h2 className="mb-2 text-xl font-semibold">GPT Image</h2>
          <p className="text-sm text-muted-foreground">
            Generate images with GPT Image models
          </p>
        </Link>
        <Link
          href="/image/flux"
          className="rounded-lg border bg-card p-6 text-card-foreground shadow-sm transition-colors hover:bg-accent"
        >
          <h2 className="mb-2 text-xl font-semibold">FLUX Image</h2>
          <p className="text-sm text-muted-foreground">
            Generate images with FLUX models
          </p>
        </Link>
        <Link
          href="/audio/tts"
          className="rounded-lg border bg-card p-6 text-card-foreground shadow-sm transition-colors hover:bg-accent"
        >
          <h2 className="mb-2 text-xl font-semibold">Text to Speech</h2>
          <p className="text-sm text-muted-foreground">
            Convert text to natural-sounding speech
          </p>
        </Link>
      </div>
    </main>
  );
}
