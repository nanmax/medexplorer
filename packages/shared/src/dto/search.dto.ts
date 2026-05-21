import { z } from "zod";
import { folderSchema } from "./folder.dto";
import { fileSchema } from "./file.dto";

export const searchTypeSchema = z.enum(["all", "folder", "file"]);
export type SearchType = z.infer<typeof searchTypeSchema>;

export const searchQuerySchema = z.object({
  q: z.string().min(1).max(200),
  type: searchTypeSchema.default("all"),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(25),
});
export type SearchQuery = z.infer<typeof searchQuerySchema>;

export const searchHitSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("folder"), item: folderSchema }),
  z.object({ kind: z.literal("file"), item: fileSchema }),
]);
export type SearchHit = z.infer<typeof searchHitSchema>;
