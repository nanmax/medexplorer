-- Required extensions (also created by docker init.sql; safe to re-run).
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "ltree";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- folders
CREATE TABLE IF NOT EXISTS "folders" (
  "id"          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "parent_id"   uuid REFERENCES "folders"("id") ON DELETE CASCADE,
  "name"        varchar(255) NOT NULL,
  "path"        ltree NOT NULL,
  "depth"       smallint NOT NULL DEFAULT 0,
  "item_count"  integer NOT NULL DEFAULT 0,
  "created_at"  timestamptz NOT NULL DEFAULT now(),
  "updated_at"  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "idx_folders_parent_id"
  ON "folders" ("parent_id");

CREATE UNIQUE INDEX IF NOT EXISTS "uq_folders_parent_name"
  ON "folders" ("parent_id", "name");

-- ltree GIST: ancestor/descendant queries, prefix search
CREATE INDEX IF NOT EXISTS "idx_folders_path_gist"
  ON "folders" USING GIST ("path");

-- Fuzzy search on folder name
CREATE INDEX IF NOT EXISTS "idx_folders_name_trgm"
  ON "folders" USING GIN ("name" gin_trgm_ops);

-- files
CREATE TABLE IF NOT EXISTS "files" (
  "id"          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "folder_id"   uuid NOT NULL REFERENCES "folders"("id") ON DELETE CASCADE,
  "name"        varchar(255) NOT NULL,
  "mime_type"   varchar(127),
  "size_bytes"  bigint NOT NULL DEFAULT 0,
  "extension"   varchar(16),
  "created_at"  timestamptz NOT NULL DEFAULT now(),
  "updated_at"  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "idx_files_folder_id"
  ON "files" ("folder_id");

CREATE INDEX IF NOT EXISTS "idx_files_name_trgm"
  ON "files" USING GIN ("name" gin_trgm_ops);

-- Tracking migrations
CREATE TABLE IF NOT EXISTS "__migrations" (
  "name"      text PRIMARY KEY,
  "applied_at" timestamptz NOT NULL DEFAULT now()
);
