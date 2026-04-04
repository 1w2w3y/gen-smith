import { describe, it, expect } from "vitest";
import { render as _render, screen } from "@testing-library/react";
import { renderWithProviders as render } from "../test-utils";
import userEvent from "@testing-library/user-event";
import { ImageOutput } from "@/components/image/ImageOutput";

describe("ImageOutput", () => {
  it("shows placeholder when no images", () => {
    render(<ImageOutput images={null} isLoading={false} />);

    expect(
      screen.getByText("Generated images will appear here")
    ).toBeInTheDocument();
  });

  it("shows loading spinner when generating", () => {
    render(<ImageOutput images={null} isLoading={true} />);

    expect(screen.getByText("Generating image...")).toBeInTheDocument();
  });

  it("renders single image in single view (no grid)", () => {
    const images = [
      { b64_json: "dGVzdA==", index: 0, format: "png" },
    ];

    render(<ImageOutput images={images} isLoading={false} />);

    const img = screen.getByAltText("Generated image");
    expect(img).toBeInTheDocument();
    expect(img.getAttribute("src")).toContain("data:image/png;base64,");
  });

  it("shows grid view for multiple images", () => {
    const images = [
      { b64_json: "dGVzdDE=", index: 0, format: "png" },
      { b64_json: "dGVzdDI=", index: 1, format: "png" },
    ];

    render(<ImageOutput images={images} isLoading={false} />);

    const imgs = screen.getAllByAltText(/Generated image/);
    expect(imgs).toHaveLength(2);
  });

  it("shows carousel thumbnails for multiple images", () => {
    const images = [
      { b64_json: "dGVzdDE=", index: 0, format: "png" },
      { b64_json: "dGVzdDI=", index: 1, format: "png" },
    ];

    render(<ImageOutput images={images} isLoading={false} />);

    const thumbnails = screen.getAllByAltText(/Thumbnail/);
    expect(thumbnails).toHaveLength(2);
  });

  it("switches to single view when thumbnail is clicked", async () => {
    const user = userEvent.setup();
    const images = [
      { b64_json: "dGVzdDE=", index: 0, format: "png" },
      { b64_json: "dGVzdDI=", index: 1, format: "png" },
    ];

    render(<ImageOutput images={images} isLoading={false} />);

    // Initially in grid view - 2 grid images
    expect(screen.getAllByAltText(/Generated image/).length).toBe(2);

    // Click first thumbnail to enter single view
    const thumbnails = screen.getAllByAltText(/Thumbnail/);
    await user.click(thumbnails[0].closest("button")!);

    // Now in single view - only 1 main image
    const mainImg = screen.getByAltText("Generated image");
    expect(mainImg).toBeInTheDocument();

    // Download button should appear in single view
    expect(screen.getByText("Download")).toBeInTheDocument();
  });

  it("does not show download button in grid view", () => {
    const images = [
      { b64_json: "dGVzdDE=", index: 0, format: "png" },
      { b64_json: "dGVzdDI=", index: 1, format: "png" },
    ];

    render(<ImageOutput images={images} isLoading={false} />);

    expect(screen.queryByText("Download")).not.toBeInTheDocument();
  });

  it("shows download button for single image", () => {
    const images = [
      { b64_json: "dGVzdA==", index: 0, format: "png" },
    ];

    render(<ImageOutput images={images} isLoading={false} />);

    expect(screen.getByText("Download")).toBeInTheDocument();
  });

  it("uses correct MIME type for JPEG images", () => {
    const images = [
      { b64_json: "dGVzdA==", index: 0, format: "jpeg" },
    ];

    render(<ImageOutput images={images} isLoading={false} />);

    const img = screen.getByAltText("Generated image");
    expect(img.getAttribute("src")).toContain("data:image/jpeg;base64,");
  });

  it("uses correct MIME type for WebP images", () => {
    const images = [
      { b64_json: "dGVzdA==", index: 0, format: "webp" },
    ];

    render(<ImageOutput images={images} isLoading={false} />);

    const img = screen.getByAltText("Generated image");
    expect(img.getAttribute("src")).toContain("data:image/webp;base64,");
  });
});
