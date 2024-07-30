-- CreateTable
CREATE TABLE "nodes" (
    "id" VARCHAR(30) NOT NULL,
    "workspace_id" VARCHAR(30) NOT NULL,
    "parent_id" VARCHAR(30),
    "type" VARCHAR(30) NOT NULL,
    "attrs" JSONB,
    "content" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL,
    "created_by" VARCHAR(30) NOT NULL,
    "updated_at" TIMESTAMPTZ(6),
    "updated_by" VARCHAR(30),
    "version_id" VARCHAR(30) NOT NULL,

    CONSTRAINT "nodes_pkey" PRIMARY KEY ("id")
);
