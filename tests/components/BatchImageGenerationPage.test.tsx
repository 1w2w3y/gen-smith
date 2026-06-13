import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders as render } from "../test-utils";
import { BatchImageGenerationPage } from "@/components/image/BatchImageGenerationPage";
import { useConfig } from "@/hooks/useConfig";
import type { SanitizedAppConfig } from "@/types/config";

vi.mock("@/hooks/useConfig", () => ({
  useConfig: vi.fn(),
}));

const mockUseConfig = vi.mocked(useConfig);

const imageConfig: SanitizedAppConfig = {
  models: {
    "gpt-image": {
      enabled: true,
      displayName: "GPT Image",
      models: [{ id: "gpt-image-1", displayName: "GPT Image 1" }],
    },
    "mai-image": {
      enabled: true,
      displayName: "MAI Image",
      models: [{ id: "mai-image-2", displayName: "MAI Image 2" }],
    },
    "flux-image": {
      enabled: true,
      displayName: "FLUX Image",
      models: [{ id: "flux-2-pro", displayName: "FLUX.2 Pro" }],
    },
  },
};

function mockConfig(config: SanitizedAppConfig | null = imageConfig) {
  mockUseConfig.mockReturnValue({
    config,
    error: null,
    isLoading: false,
  });
}

function mockImageResponse() {
  return {
    ok: true,
    json: async () => ({
      images: [{ b64_json: "ZmFrZS1pbWFnZQ==", index: 0 }],
    }),
  } as Response;
}

describe("BatchImageGenerationPage", () => {
  beforeEach(() => {
    mockConfig();
    global.fetch = vi.fn(async () => mockImageResponse());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders all configured image models selected by default", () => {
    render(<BatchImageGenerationPage />);

    expect(screen.getByText("Image Batch")).toBeInTheDocument();
    expect(screen.getAllByText("GPT Image 1")).not.toHaveLength(0);
    expect(screen.getAllByText("MAI Image 2")).not.toHaveLength(0);
    expect(screen.getAllByText("FLUX.2 Pro")).not.toHaveLength(0);

    const checkboxes = screen.getAllByRole("checkbox");
    expect(checkboxes).toHaveLength(3);
    checkboxes.forEach((checkbox) => expect(checkbox).toBeChecked());
    expect(
      screen.getByRole("button", { name: /generate selected/i })
    ).toBeDisabled();
  });

  it("submits only the selected models with family-specific defaults", async () => {
    const user = userEvent.setup();
    render(<BatchImageGenerationPage />);

    await user.click(screen.getByRole("button", { name: /clear all/i }));
    await user.click(
      screen.getByRole("checkbox", { name: /FLUX\.2 Pro FLUX Image/i })
    );
    await user.type(
      screen.getByPlaceholderText(/describe the image/i),
      "A bright studio portrait"
    );
    await user.click(screen.getByRole("button", { name: /generate selected/i }));

    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/image/flux/generate",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          modelId: "flux-2-pro",
          prompt: "A bright studio portrait",
          n: 1,
          width: 1024,
          height: 1024,
        }),
      })
    );
  });

  it("keeps successful model results when another selected model fails", async () => {
    const user = userEvent.setup();
    mockConfig({
      models: {
        "gpt-image": imageConfig.models["gpt-image"],
        "flux-image": imageConfig.models["flux-image"],
      },
    });
    global.fetch = vi.fn(async (input) => {
      if (String(input).includes("/api/image/flux/generate")) {
        return {
          ok: false,
          status: 500,
          json: async () => ({
            error: { message: "FLUX failed" },
          }),
        } as Response;
      }
      return mockImageResponse();
    });

    render(<BatchImageGenerationPage />);

    await user.type(
      screen.getByPlaceholderText(/describe the image/i),
      "A mountain lake"
    );
    await user.click(screen.getByRole("button", { name: /generate selected/i }));

    expect(await screen.findByText("FLUX failed")).toBeInTheDocument();
    expect(screen.getByText("Done")).toBeInTheDocument();
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it("shows an empty-state alert when no image models are configured", () => {
    mockConfig({
      models: { tts: { enabled: true, displayName: "TTS", models: [] } },
    });

    render(<BatchImageGenerationPage />);

    expect(screen.getByText("No image models configured")).toBeInTheDocument();
  });
});
