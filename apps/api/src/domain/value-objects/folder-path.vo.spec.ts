import { describe, it, expect } from "vitest";
import { FolderPath } from "./folder-path.vo";

describe("FolderPath", () => {
  it("rejects empty", () => {
    expect(() => new FolderPath("")).toThrow();
  });

  it("rejects invalid characters", () => {
    expect(() => new FolderPath("root.UPPER")).toThrow();
    expect(() => new FolderPath("root.with-dash")).toThrow();
  });

  it("slugifies and chains", () => {
    const root = FolderPath.fromName("MRI Scans");
    expect(root.toString()).toBe("mri_scans");
    const child = root.child("Patient Doe");
    expect(child.toString()).toBe("mri_scans.patient_doe");
    expect(child.depth).toBe(1);
  });

  it("handles non-ascii by stripping diacritics", () => {
    expect(FolderPath.slugify("café résumé")).toBe("cafe_resume");
  });
});
