import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { GenerationForm } from "@/components/image/GenerationForm";
const mockModels = [
  { id: "gpt-image-1", displayName: "GPT Image 1" },
  { id: "gpt-image-1-mini", displayName: "GPT Image 1 Mini" },
];

describe("GenerationForm", () => {
  it("renders form with all parameter sections", () => {
    render(
      <GenerationForm
        models={mockModels}
        onSubmit={vi.fn()}
        isLoading={false}
      />
    );

    expect(screen.getByText("Image Generation")).toBeInTheDocument();
    expect(screen.getByText("Model")).toBeInTheDocument();
    expect(screen.getByText("Prompt")).toBeInTheDocument();
    expect(screen.getByText(/Number of images/)).toBeInTheDocument();
    expect(screen.getByText("Size")).toBeInTheDocument();
    expect(screen.getByText("Quality")).toBeInTheDocument();
    expect(screen.getByText("Background")).toBeInTheDocument();
    expect(screen.getByText("Output Format")).toBeInTheDocument();
    expect(screen.getByText("Moderation")).toBeInTheDocument();
  });

  it("disables the generate button when prompt is empty", () => {
    render(
      <GenerationForm
        models={mockModels}
        onSubmit={vi.fn()}
        isLoading={false}
      />
    );

    const button = screen.getByRole("button", { name: /generate/i });
    expect(button).toBeDisabled();
  });

  it("shows loading state when generating", () => {
    render(
      <GenerationForm
        models={mockModels}
        onSubmit={vi.fn()}
        isLoading={true}
      />
    );

    expect(screen.getByText("Generating...")).toBeInTheDocument();
  });

  it("enables submit button when prompt is filled", async () => {
    const user = userEvent.setup();

    render(
      <GenerationForm
        models={mockModels}
        onSubmit={vi.fn()}
        isLoading={false}
      />
    );

    const textarea = screen.getByPlaceholderText(
      /describe the image/i
    );
    await user.type(textarea, "A red fox");

    const button = screen.getByRole("button", { name: /generate/i });
    expect(button).not.toBeDisabled();
  });

  it("calls onSubmit with form data when submitted", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(
      <GenerationForm
        models={mockModels}
        onSubmit={onSubmit}
        isLoading={false}
      />
    );

    const textarea = screen.getByPlaceholderText(
      /describe the image/i
    );
    await user.type(textarea, "A red fox in autumn");

    const button = screen.getByRole("button", { name: /generate/i });
    await user.click(button);

    expect(onSubmit).toHaveBeenCalledTimes(1);
    const callData = onSubmit.mock.calls[0][0];
    expect(callData.prompt).toBe("A red fox in autumn");
    expect(callData.modelId).toBe("gpt-image-1");
    expect(callData.n).toBe(1);
    expect(callData.size).toBe("1024x1024");
    expect(callData.quality).toBe("medium");
    expect(callData.outputFormat).toBe("png");
    expect(callData.background).toBe("auto");
    expect(callData.moderation).toBe("auto");
  });
});
