import { z } from "zod";

export const folderIdSchema = z.string().uuid();

export const folderSchema = z.object({
  id: folderIdSchema,
  parentId: folderIdSchema.nullable(),
  name: z.string().min(1).max(255),
  path: z.string(),
  depth: z.number().int().nonnegative(),
  itemCount: z.number().int().nonnegative(),
  hasChildren: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type FolderDto = z.infer<typeof folderSchema>;

export const folderTreeNodeSchema: z.ZodType<FolderTreeNode> = z.lazy(() =>
  folderSchema.extend({
    children: z.array(folderTreeNodeSchema).optional(),
  }),
);

export interface FolderTreeNode extends FolderDto {
  children?: FolderTreeNode[];
}

export const createFolderSchema = z.object({
  name: z.string().min(1).max(255).trim(),
  parentId: folderIdSchema.nullable().optional(),
});
export type CreateFolderInput = z.infer<typeof createFolderSchema>;

export const updateFolderSchema = z.object({
  name: z.string().min(1).max(255).trim(),
});
export type UpdateFolderInput = z.infer<typeof updateFolderSchema>;

export const folderBreadcrumbSchema = z.object({
  id: folderIdSchema,
  name: z.string(),
});
export type FolderBreadcrumb = z.infer<typeof folderBreadcrumbSchema>;
