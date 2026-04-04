import { type ReactNode } from "react";
import { render, type RenderOptions } from "@testing-library/react";
import { LanguageProvider } from "@/components/layout/LanguageProvider";

function AllProviders({ children }: { children: ReactNode }) {
  return <LanguageProvider>{children}</LanguageProvider>;
}

export function renderWithProviders(
  ui: React.ReactElement,
  options?: Omit<RenderOptions, "wrapper">
) {
  return render(ui, { wrapper: AllProviders, ...options });
}
