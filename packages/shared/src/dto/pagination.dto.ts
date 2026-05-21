import { z } from "zod";

export const cursorQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
});

export type CursorQuery = z.infer<typeof cursorQuerySchema>;

export const paginatedResponseSchema = <T extends z.ZodTypeAny>(item: T) =>
  z.object({
    data: z.array(item),
    nextCursor: z.string().nullable(),
    hasMore: z.boolean(),
  });

export interface Paginated<T> {
  data: T[];
  nextCursor: string | null;
  hasMore: boolean;
}
