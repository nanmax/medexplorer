import { describe, it, expect, beforeAll } from "vitest";
import { createApp } from "../../src/presentation/http/app";
import { createTestContainer } from "../../src/presentation/container";
import { InMemoryFolderRepo, InMemoryFileRepo } from "../fakes/in-memory-repos";

const env = {
  NODE_ENV: "test" as const,
  DATABASE_URL: "postgres://noop",
  API_PORT: 3001,
  API_HOST: "127.0.0.1",
  CORS_ORIGIN: "*",
  CACHE_TTL_SECONDS: 1,
  CACHE_MAX_ENTRIES: 100,
};

describe("folders routes (integration with in-memory repos)", () => {
  const folderRepo = new InMemoryFolderRepo();
  const fileRepo = new InMemoryFileRepo();
  folderRepo.fileCountFor = (id) => fileRepo.countByFolder(id);
  const container = createTestContainer({ folderRepo, fileRepo });
  const app = createApp(container, env);

  let rootId: string;
  let childId: string;

  beforeAll(() => {
    rootId = folderRepo.seed({ name: "MRI Scans", parentId: null });
    childId = folderRepo.seed({ name: "Patient_Doe", parentId: rootId });
    folderRepo.seed({ name: "Patient_Smith", parentId: rootId });
    fileRepo.seed(childId, "Patient_Doe_MRI_Report.pdf", 2_400_000, "application/pdf", "pdf");
  });

  async function call(path: string, init: RequestInit = {}) {
    return app.handle(new Request(`http://localhost${path}`, init));
  }

  it("GET /api/v1/folders/roots returns roots", async () => {
    const res = await call("/api/v1/folders/roots");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data).toHaveLength(1);
    expect(body.data[0].name).toBe("MRI Scans");
    expect(body.data[0].hasChildren).toBe(true);
  });

  it("GET /api/v1/folders/:id/children returns direct sub-folders", async () => {
    const res = await call(`/api/v1/folders/${rootId}/children`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.map((f: { name: string }) => f.name).sort()).toEqual([
      "Patient_Doe",
      "Patient_Smith",
    ]);
  });

  it("GET /api/v1/folders/:id returns folder + breadcrumb", async () => {
    const res = await call(`/api/v1/folders/${childId}`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.folder.name).toBe("Patient_Doe");
    expect(body.breadcrumb.map((c: { name: string }) => c.name)).toEqual([
      "MRI Scans",
      "Patient_Doe",
    ]);
  });

  it("GET /api/v1/folders/:id/files returns files in folder", async () => {
    const res = await call(`/api/v1/folders/${childId}/files`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data).toHaveLength(1);
    expect(body.data[0].name).toBe("Patient_Doe_MRI_Report.pdf");
    expect(body.data[0].extension).toBe("pdf");
  });

  it("POST /api/v1/folders creates and returns 201", async () => {
    const res = await call("/api/v1/folders", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: "Q3 Clinical Trials", parentId: null }),
    });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.name).toBe("Q3 Clinical Trials");
  });

  it("POST /api/v1/folders returns 409 on duplicate name", async () => {
    const res = await call("/api/v1/folders", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: "MRI Scans", parentId: null }),
    });
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.error.code).toBe("CONFLICT");
  });

  it("GET non-existent folder returns 404", async () => {
    const res = await call(`/api/v1/folders/00000000-0000-0000-0000-000000000000`);
    expect(res.status).toBe(404);
  });

  it("GET /api/v1/search finds folder by name", async () => {
    const res = await call("/api/v1/search?q=mri&type=folder");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.length).toBeGreaterThan(0);
    expect(body.data[0].kind).toBe("folder");
  });

  it("GET /healthz returns ok", async () => {
    const res = await call("/healthz");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("ok");
  });
});
