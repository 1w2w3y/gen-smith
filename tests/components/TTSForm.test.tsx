import { describe, it, expect, vi } from "vitest";
import { render as _render, screen } from "@testing-library/react";
import { renderWithProviders as render } from "../test-utils";
import userEvent from "@testing-library/user-event";
import { TTSForm } from "@/components/audio/TTSForm";
import { TTS_VOICES, type TTSFormat, type TTSVoice } from "@/types/tts";

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

  it("renders every documented voice option", () => {
    render(
      <TTSForm models={mockModels} onSubmit={vi.fn()} isLoading={false} />
    );

    // Pin the expected labels literally so the test fails if a voice is
    // silently dropped from the shared list (a loop over TTS_VOICES alone
    // would pass either way).
    const expectedLabels = [
      "Alloy",
      "Ash",
      "Ballad",
      "Cedar",
      "Coral",
      "Echo",
      "Fable",
      "Marin",
      "Nova",
      "Onyx",
      "Sage",
      "Shimmer",
      "Verse",
    ];
    expect(TTS_VOICES).toHaveLength(expectedLabels.length);
    for (const label of expectedLabels) {
      expect(screen.getByText(label), `voice label ${label}`).toBeInTheDocument();
    }
  });

  it("uses a recognized restored voice and format from defaultValues", () => {
    render(
      <TTSForm
        models={mockModels}
        onSubmit={vi.fn()}
        isLoading={false}
        defaultValues={{ voice: "nova", responseFormat: "opus" }}
      />
    );

    expect(screen.getByRole("radio", { name: "Nova" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "opus" })).toBeChecked();
  });

  it("coerces unrecognized restored voice and format back to the defaults", () => {
    render(
      <TTSForm
        models={mockModels}
        onSubmit={vi.fn()}
        isLoading={false}
        defaultValues={{
          voice: "legacy-voice" as never,
          responseFormat: "pcm" as never,
        }}
      />
    );

    expect(screen.getByRole("radio", { name: "Alloy" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "mp3" })).toBeChecked();
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
