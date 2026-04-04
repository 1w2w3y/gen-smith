import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FluxGenerationForm } from "@/components/image/FluxGenerationForm";

const mockModels = [
  { id: "FLUX.2-pro", displayName: "FLUX.2 Pro" },
  { id: "FLUX.2-flex", displayName: "FLUX.2 Flex" },
];

describe("FluxGenerationForm", () => {
  it("renders form with all parameter sections", () => {
    render(
      <FluxGenerationForm
        models={mockModels}
        onSubmit={vi.fn()}
        isLoading={false}
      />
    );

    expect(screen.getByText("FLUX Image Generation")).toBeInTheDocument();
    expect(screen.getByText("Model")).toBeInTheDocument();
    expect(screen.getByText("Prompt")).toBeInTheDocument();
    expect(screen.getByText(/Number of images/)).toBeInTheDocument();
    expect(screen.getByText("Dimensions")).toBeInTheDocument();
  });

  it("disables the generate button when prompt is empty", () => {
    render(
      <FluxGenerationForm
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
      <FluxGenerationForm
        models={mockModels}
        onSubmit={vi.fn()}
        isLoading={true}
      />
    );

    expect(screen.getByText("Generating...")).toBeInTheDocument();
  });

  it("calls onSubmit with correct default data", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(
      <FluxGenerationForm
        models={mockModels}
        onSubmit={onSubmit}
        isLoading={false}
      />
    );

    const textarea = screen.getByPlaceholderText(/describe the image/i);
    await user.type(textarea, "A red fox");

    const button = screen.getByRole("button", { name: /generate/i });
    await user.click(button);

    expect(onSubmit).toHaveBeenCalledTimes(1);
    const data = onSubmit.mock.calls[0][0];
    expect(data.prompt).toBe("A red fox");
    expect(data.modelId).toBe("FLUX.2-pro");
    expect(data.n).toBe(1);
    expect(data.width).toBe(1024);
    expect(data.height).toBe(1024);
  });

  it("renders dimension preset options", () => {
    render(
      <FluxGenerationForm
        models={mockModels}
        onSubmit={vi.fn()}
        isLoading={false}
      />
    );

    expect(screen.getByText("1024x1024 (Square)")).toBeInTheDocument();
    expect(screen.getByText("1536x1024 (Landscape)")).toBeInTheDocument();
    expect(screen.getByText("1024x1536 (Portrait)")).toBeInTheDocument();
    expect(screen.getByText("768x768 (Small)")).toBeInTheDocument();
  });

  it("submits with landscape dimensions when selected", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(
      <FluxGenerationForm
        models={mockModels}
        onSubmit={onSubmit}
        isLoading={false}
      />
    );

    const textarea = screen.getByPlaceholderText(/describe the image/i);
    await user.type(textarea, "test");

    await user.click(screen.getByText("1536x1024 (Landscape)"));

    await user.click(screen.getByRole("button", { name: /generate/i }));
    const data = onSubmit.mock.calls[0][0];
    expect(data.width).toBe(1536);
    expect(data.height).toBe(1024);
  });
});
