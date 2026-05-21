/**
 * Materialized path value object backed by PostgreSQL `ltree`.
 * Segments are normalized to lowercase alphanumerics + underscore.
 */
export class FolderPath {
  private static readonly SEGMENT_RE = /^[a-z0-9_]+$/;

  constructor(private readonly value: string) {
    if (!value) throw new Error("FolderPath cannot be empty");
    for (const segment of value.split(".")) {
      if (!FolderPath.SEGMENT_RE.test(segment)) {
        throw new Error(`Invalid ltree segment: "${segment}"`);
      }
    }
  }

  static fromName(name: string, parent?: FolderPath): FolderPath {
    const slug = FolderPath.slugify(name);
    return new FolderPath(parent ? `${parent.toString()}.${slug}` : slug);
  }

  /** Convert a human folder name to a safe ltree segment. */
  static slugify(name: string): string {
    const base = name
      .normalize("NFKD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "");
    // ltree disallows empty segments and segments starting with a digit-only? Actually digits allowed.
    return base.length > 0 ? base : "_";
  }

  get depth(): number {
    return this.value.split(".").length - 1;
  }

  child(name: string): FolderPath {
    return FolderPath.fromName(name, this);
  }

  toString(): string {
    return this.value;
  }
}
