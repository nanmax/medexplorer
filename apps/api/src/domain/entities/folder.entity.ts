export interface FolderProps {
  id: string;
  parentId: string | null;
  name: string;
  path: string;
  depth: number;
  itemCount: number;
  hasChildren: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class Folder {
  constructor(private readonly props: FolderProps) {}

  get id(): string { return this.props.id; }
  get parentId(): string | null { return this.props.parentId; }
  get name(): string { return this.props.name; }
  get path(): string { return this.props.path; }
  get depth(): number { return this.props.depth; }
  get itemCount(): number { return this.props.itemCount; }
  get hasChildren(): boolean { return this.props.hasChildren; }
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date { return this.props.updatedAt; }

  get isRoot(): boolean { return this.props.parentId === null; }

  toJSON() {
    return {
      id: this.props.id,
      parentId: this.props.parentId,
      name: this.props.name,
      path: this.props.path,
      depth: this.props.depth,
      itemCount: this.props.itemCount,
      hasChildren: this.props.hasChildren,
      createdAt: this.props.createdAt.toISOString(),
      updatedAt: this.props.updatedAt.toISOString(),
    };
  }
}
