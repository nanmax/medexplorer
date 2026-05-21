import { describe, it, expect } from "vitest";
import { formatBytes, formatRelative } from "./format";

describe("formatBytes", () => {
  it.each([
    [0, "0 B"],
    [512, "512 B"],
    [1024, "1.0 KB"],
    [1024 * 1024 * 2.5, "2.5 MB"],
    [1024 * 1024 * 1024 * 3, "3.0 GB"],
  ])("formats %i as %s", (input, expected) => {
    expect(formatBytes(input)).toBe(expected);
  });
});

describe("formatRelative", () => {
  const now = new Date("2026-05-21T12:00:00Z");
  it("formats just-now", () => {
    expect(formatRelative("2026-05-21T11:59:30Z", now)).toBe("Just now");
  });
  it("formats minutes ago", () => {
    expect(formatRelative("2026-05-21T11:45:00Z", now)).toBe("15 mins ago");
  });
  it("formats yesterday", () => {
    const out = formatRelative("2026-05-20T08:30:00Z", now);
    expect(out.startsWith("Yesterday")).toBe(true);
  });
});
