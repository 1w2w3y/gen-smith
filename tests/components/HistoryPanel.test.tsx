import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders as render } from "../test-utils";
import { HistoryPanel } from "@/components/history/HistoryPanel";
import type { MaiImageHistoryEntry } from "@/types/history";

describe("HistoryPanel", () => {
  it("renders MAI image history entries as image entries", async () => {
    const user = userEvent.setup();
    const onViewImages = vi.fn();
    const entry: MaiImageHistoryEntry = {
      id: "mai-history-1",
      playground: "mai-image",
      createdAt: Date.now(),
      params: {
        modelId: "MAI-Image-2",
        prompt: "A MAI prompt",
        n: 1,
        width: 1024,
        height: 1024,
      },
      thumbnails: ["dGh1bWI="],
      imageCount: 1,
    };

    render(
      <HistoryPanel
        entries={[entry]}
        isLoading={false}
        onRestore={vi.fn()}
        onDelete={vi.fn()}
        onClearAll={vi.fn()}
        onViewImages={onViewImages}
      />
    );

    expect(screen.getByText("A MAI prompt")).toBeInTheDocument();
    expect(screen.queryByText(/undefined/i)).not.toBeInTheDocument();

    await user.click(screen.getByTitle("View images"));
    expect(onViewImages).toHaveBeenCalledWith("mai-history-1");
  });
});
