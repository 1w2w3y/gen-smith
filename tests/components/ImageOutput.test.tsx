import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
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

  it("renders images when provided", () => {
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
});
