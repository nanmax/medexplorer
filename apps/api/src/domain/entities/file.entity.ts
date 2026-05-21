export interface FileProps {
  id: string;
  folderId: string;
  name: string;
  mimeType: string | null;
  sizeBytes: number;
  extension: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export class FileItem {
  constructor(private readonly props: FileProps) {}

  get id(): string { return this.props.id; }
  get folderId(): string { return this.props.folderId; }
  get name(): string { return this.props.name; }
  get mimeType(): string | null { return this.props.mimeType; }
  get sizeBytes(): number { return this.props.sizeBytes; }
  get extension(): string | null { return this.props.extension; }
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date { return this.props.updatedAt; }

  toJSON() {
    return {
      id: this.props.id,
      folderId: this.props.folderId,
      name: this.props.name,
      mimeType: this.props.mimeType,
      sizeBytes: this.props.sizeBytes,
      extension: this.props.extension,
      createdAt: this.props.createdAt.toISOString(),
      updatedAt: this.props.updatedAt.toISOString(),
    };
  }
}
