import { describe, it, expect, vi } from "vitest";
import { render as _render, screen } from "@testing-library/react";
import { renderWithProviders as render } from "../test-utils";
import userEvent from "@testing-library/user-event";
import { TTSForm } from "@/components/audio/TTSForm";

const mockModels = [
  { id: "gpt-4o-mini-tts", displayName: "GPT-4o Mini TTS" },
];

describe("TTSForm", () => {
  it("renders form with all parameter sections", () => {
    render(
      <TTSForm models={mockModels} onSubmit={vi.fn()} isLoading={false} />
    );

    expect(screen.getByText("Text to Speech")).toBeInTheDocument();
    expect(screen.getByText("Model")).toBeInTheDocument();
    expect(screen.getByText("Text")).toBeInTheDocument();
    expect(screen.getByText("Voice")).toBeInTheDocument();
    expect(screen.getByText(/Speed/)).toBeInTheDocument();
    expect(screen.getByText("Format")).toBeInTheDocument();
    expect(screen.getByText("Instructions (optional)")).toBeInTheDocument();
  });

  it("renders all 6 voice options", () => {
    render(
      <TTSForm models={mockModels} onSubmit={vi.fn()} isLoading={false} />
    );

    expect(screen.getByText("Alloy")).toBeInTheDocument();
    expect(screen.getByText("Echo")).toBeInTheDocument();
    expect(screen.getByText("Fable")).toBeInTheDocument();
    expect(screen.getByText("Onyx")).toBeInTheDocument();
    expect(screen.getByText("Nova")).toBeInTheDocument();
    expect(screen.getByText("Shimmer")).toBeInTheDocument();
  });

  it("disables generate button when input is empty", () => {
    render(
      <TTSForm models={mockModels} onSubmit={vi.fn()} isLoading={false} />
    );

    const button = screen.getByRole("button", { name: /generate speech/i });
    expect(button).toBeDisabled();
  });

  it("shows loading state", () => {
    render(
      <TTSForm models={mockModels} onSubmit={vi.fn()} isLoading={true} />
    );

    expect(screen.getByText("Generating...")).toBeInTheDocument();
  });

  it("calls onSubmit with correct default data", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(
      <TTSForm models={mockModels} onSubmit={onSubmit} isLoading={false} />
    );

    const textarea = screen.getByPlaceholderText(/enter the text/i);
    await user.type(textarea, "Hello world");

    await user.click(
      screen.getByRole("button", { name: /generate speech/i })
    );

    expect(onSubmit).toHaveBeenCalledTimes(1);
    const data = onSubmit.mock.calls[0][0];
    expect(data.input).toBe("Hello world");
    expect(data.modelId).toBe("gpt-4o-mini-tts");
    expect(data.voice).toBe("alloy");
    expect(data.responseFormat).toBe("mp3");
    expect(data.speed).toBeUndefined();
    expect(data.instructions).toBeUndefined();
  });
});
