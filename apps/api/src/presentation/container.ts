import type { Env } from "../config/env";
import { createDb } from "../infrastructure/persistence/drizzle/client";
import { MemoryCache } from "../infrastructure/cache/memory-cache";
import { DrizzleFolderRepository } from "../infrastructure/persistence/drizzle/repositories/folder.repository";
import { DrizzleFileRepository } from "../infrastructure/persistence/drizzle/repositories/file.repository";
import { FolderService } from "../application/services/folder.service";
import { FileService } from "../application/services/file.service";
import { SearchService } from "../application/services/search.service";
import type { FolderRepositoryPort } from "../domain/ports/folder.repository.port";
import type { FileRepositoryPort } from "../domain/ports/file.repository.port";
import type { CachePort } from "../domain/ports/cache.port";

export interface Container {
  cache: CachePort;
  folderRepo: FolderRepositoryPort;
  fileRepo: FileRepositoryPort;
  folderService: FolderService;
  fileService: FileService;
  searchService: SearchService;
}

export function createContainer(env: Env): Container {
  const { db } = createDb(env.DATABASE_URL);
  const cache = new MemoryCache(env.CACHE_MAX_ENTRIES, env.CACHE_TTL_SECONDS);
  const folderRepo = new DrizzleFolderRepository(db);
  const fileRepo = new DrizzleFileRepository(db);
  const folderService = new FolderService(folderRepo, cache);
  const fileService = new FileService(fileRepo, folderRepo, cache);
  const searchService = new SearchService(folderRepo, fileRepo);
  return { cache, folderRepo, fileRepo, folderService, fileService, searchService };
}

/**
 * Test container helper: lets tests inject mock repositories while keeping
 * the same wiring as production. Memenuhi prinsip DIP.
 */
export function createTestContainer(overrides: Partial<Container>): Container {
  const cache = overrides.cache ?? new MemoryCache(100, 1);
  if (!overrides.folderRepo || !overrides.fileRepo) {
    throw new Error("Test container requires folderRepo and fileRepo overrides");
  }
  const folderRepo = overrides.folderRepo;
  const fileRepo = overrides.fileRepo;
  const folderService = overrides.folderService ?? new FolderService(folderRepo, cache);
  const fileService = overrides.fileService ?? new FileService(fileRepo, folderRepo, cache);
  const searchService = overrides.searchService ?? new SearchService(folderRepo, fileRepo);
  return { cache, folderRepo, fileRepo, folderService, fileService, searchService };
}
