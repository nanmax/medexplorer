import { Elysia, t } from "elysia";
import type { Container } from "../../container";
import {
  createFolderSchema,
  updateFolderSchema,
  cursorQuerySchema,
} from "@medexplorer/shared";

export function foldersRoutes(c: Container) {
  return new Elysia({ prefix: "/folders" })
    .get(
      "/roots",
      async ({ query }) => {
        const opts = cursorQuerySchema.parse(query);
        return c.folderService.listRoots(opts);
      },
      {
        query: t.Object({
          cursor: t.Optional(t.String()),
          limit: t.Optional(t.String()),
        }),
        detail: { summary: "List root folders (parent_id IS NULL), cursor-paginated" },
      },
    )
    .get(
      "/:id",
      async ({ params }) => {
        const folder = await c.folderService.getById(params.id);
        const breadcrumb = await c.folderService.breadcrumb(params.id);
        return { folder, breadcrumb };
      },
      {
        params: t.Object({ id: t.String({ format: "uuid" }) }),
        detail: { summary: "Get folder details + breadcrumb" },
      },
    )
    .get(
      "/:id/children",
      async ({ params, query }) => {
        const opts = cursorQuerySchema.parse(query);
        return c.folderService.listChildren(params.id, opts);
      },
      {
        params: t.Object({ id: t.String({ format: "uuid" }) }),
        query: t.Object({
          cursor: t.Optional(t.String()),
          limit: t.Optional(t.String()),
        }),
        detail: { summary: "List direct sub-folders" },
      },
    )
    .get(
      "/:id/subtree",
      async ({ params, query }) => {
        const depth = Math.max(1, Math.min(5, Number(query.depth ?? 2)));
        return c.folderService.getSubtree(params.id, depth);
      },
      {
        params: t.Object({ id: t.String({ format: "uuid" }) }),
        query: t.Object({ depth: t.Optional(t.String()) }),
        detail: { summary: "Get folder subtree up to N levels (capped at 5)" },
      },
    )
    .get(
      "/:id/files",
      async ({ params, query }) => {
        const opts = cursorQuerySchema.parse(query);
        return c.fileService.listByFolder(params.id, opts);
      },
      {
        params: t.Object({ id: t.String({ format: "uuid" }) }),
        query: t.Object({
          cursor: t.Optional(t.String()),
          limit: t.Optional(t.String()),
        }),
        detail: { summary: "List files in folder, cursor-paginated" },
      },
    )
    .post(
      "/:id/files",
      async ({ params, body, set }) => {
        const raw = (body as Record<string, unknown>).files;
        const list: File[] = Array.isArray(raw)
          ? (raw as File[])
          : raw instanceof File
            ? [raw]
            : [];
        if (list.length === 0) {
          set.status = 400;
          return { error: { code: "VALIDATION_ERROR", message: "No files provided. Use multipart field 'files'." } };
        }
        const uploaded = [];
        for (const f of list) {
          const dot = f.name.lastIndexOf(".");
          const extension = dot > 0 ? f.name.slice(dot + 1).toLowerCase() : null;
          uploaded.push(
            await c.fileService.createInFolder(params.id, {
              name: f.name,
              sizeBytes: f.size,
              mimeType: f.type || null,
              extension,
            }),
          );
        }
        set.status = 201;
        return { uploaded };
      },
      {
        params: t.Object({ id: t.String({ format: "uuid" }) }),
        type: "multipart/form-data",
        detail: { summary: "Upload one or more files to a folder (multipart, field name 'files'). Stores metadata only." },
      },
    )
    .post(
      "/",
      async ({ body, set }) => {
        const input = createFolderSchema.parse(body);
        set.status = 201;
        return c.folderService.create(input);
      },
      {
        body: t.Object({
          name: t.String({ minLength: 1, maxLength: 255 }),
          parentId: t.Optional(t.Union([t.String({ format: "uuid" }), t.Null()])),
        }),
        detail: { summary: "Create folder" },
      },
    )
    .patch(
      "/:id",
      async ({ params, body }) => {
        const input = updateFolderSchema.parse(body);
        return c.folderService.rename(params.id, input);
      },
      {
        params: t.Object({ id: t.String({ format: "uuid" }) }),
        body: t.Object({ name: t.String({ minLength: 1, maxLength: 255 }) }),
        detail: { summary: "Rename folder" },
      },
    )
    .delete(
      "/:id",
      async ({ params, set }) => {
        await c.folderService.remove(params.id);
        set.status = 204;
        return null;
      },
      {
        params: t.Object({ id: t.String({ format: "uuid" }) }),
        detail: { summary: "Delete folder (cascade)" },
      },
    );
}
