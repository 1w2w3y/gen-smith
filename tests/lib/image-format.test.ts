import { describe, expect, it } from "vitest";
import { detectBase64ImageFormat } from "@/lib/image-format";

describe("detectBase64ImageFormat", () => {
  it("detects jpeg images", () => {
    expect(detectBase64ImageFormat("/9j/4AAQSkZJRgABAQAAAQABAAD")).toBe(
      "jpeg"
    );
  });

  it("detects webp images", () => {
    expect(detectBase64ImageFormat("UklGRiIAAABXRUJQVlA4")).toBe("webp");
  });

  it("defaults to png", () => {
    expect(detectBase64ImageFormat("iVBORw0KGgoAAAANSUhEUg")).toBe("png");
  });
});
