export class DomainError extends Error {
  constructor(
    public readonly code: "NOT_FOUND" | "CONFLICT" | "VALIDATION_ERROR",
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "DomainError";
  }
}

export class FolderNotFoundError extends DomainError {
  constructor(id: string) {
    super("NOT_FOUND", `Folder ${id} not found`);
  }
}

export class FileNotFoundError extends DomainError {
  constructor(id: string) {
    super("NOT_FOUND", `File ${id} not found`);
  }
}

export class DuplicateFolderError extends DomainError {
  constructor(parentId: string | null, name: string) {
    super(
      "CONFLICT",
      `Folder "${name}" already exists in parent ${parentId ?? "<root>"}`,
    );
  }
}
