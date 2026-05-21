-- Extensions required by Infokes / MedExplorer
CREATE EXTENSION IF NOT EXISTS "pgcrypto";   -- gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "ltree";       -- materialized path tree
CREATE EXTENSION IF NOT EXISTS "pg_trgm";     -- GIN trigram for fuzzy search
