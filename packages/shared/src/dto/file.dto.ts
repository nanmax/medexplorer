import { z } from "zod";
import { folderIdSchema } from "./folder.dto";

export const fileIdSchema = z.string().uuid();

export const fileSchema = z.object({
  id: fileIdSchema,
  folderId: folderIdSchema,
  name: z.string().min(1).max(255),
  mimeType: z.string().nullable(),
  sizeBytes: z.number().int().nonnegative(),
  extension: z.string().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type FileDto = z.infer<typeof fileSchema>;
