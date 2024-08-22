-- CreateTable
CREATE TABLE "accounts" (
    "id" VARCHAR(30) NOT NULL,
    "name" VARCHAR(256) NOT NULL,
    "email" VARCHAR(256) NOT NULL,
    "avatar" VARCHAR(256),
    "password" VARCHAR(256),
    "attrs" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL,
    "updated_at" TIMESTAMPTZ(6),
    "status" INTEGER NOT NULL,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workspaces" (
    "id" VARCHAR(30) NOT NULL,
    "name" VARCHAR(256) NOT NULL,
    "description" VARCHAR(256),
    "avatar" VARCHAR(256),
    "attrs" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL,
    "created_by" VARCHAR(30) NOT NULL,
    "updated_at" TIMESTAMPTZ(6),
    "updated_by" VARCHAR(30),
    "status" INTEGER NOT NULL,
    "version_id" VARCHAR(30) NOT NULL,

    CONSTRAINT "workspaces_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workspace_accounts" (
    "workspace_id" VARCHAR(30) NOT NULL,
    "account_id" VARCHAR(30) NOT NULL,
    "user_id" VARCHAR(30) NOT NULL,
    "role" INTEGER NOT NULL,
    "attrs" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL,
    "created_by" VARCHAR(30) NOT NULL,
    "updated_at" TIMESTAMPTZ(6),
    "updated_by" VARCHAR(30),
    "status" INTEGER NOT NULL,
    "version_id" VARCHAR(30) NOT NULL,

    CONSTRAINT "workspace_accounts_pkey" PRIMARY KEY ("workspace_id","account_id")
);

-- CreateTable
CREATE TABLE "nodes" (
    "id" VARCHAR(30) NOT NULL,
    "workspace_id" VARCHAR(30) NOT NULL,
    "parent_id" VARCHAR(30),
    "type" VARCHAR(30) NOT NULL,
    "index" VARCHAR(30),
    "attrs" JSONB,
    "content" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL,
    "created_by" VARCHAR(30) NOT NULL,
    "updated_at" TIMESTAMPTZ(6),
    "updated_by" VARCHAR(30),
    "version_id" VARCHAR(30) NOT NULL,
    "server_created_at" TIMESTAMPTZ(6) NOT NULL,
    "server_updated_at" TIMESTAMPTZ(6),
    "server_version_id" VARCHAR(30) NOT NULL,

    CONSTRAINT "nodes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "account_devices" (
    "id" VARCHAR(30) NOT NULL,
    "account_id" VARCHAR(30) NOT NULL,
    "type" INTEGER NOT NULL,
    "version" VARCHAR(30) NOT NULL,
    "platform" VARCHAR(30),
    "cpu" VARCHAR(30),
    "hostname" VARCHAR(30),
    "created_at" TIMESTAMPTZ(6) NOT NULL,
    "last_online_at" TIMESTAMPTZ(6),
    "last_active_at" TIMESTAMPTZ(6),

    CONSTRAINT "account_devices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "updates" (
    "id" VARCHAR(30) NOT NULL,
    "workspace_id" VARCHAR(30) NOT NULL,
    "type" VARCHAR(30) NOT NULL,
    "content" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL,
    "devices" TEXT[],

    CONSTRAINT "updates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "IX_accounts_email" ON "accounts"("email");

-- AddForeignKey
ALTER TABLE "nodes" ADD CONSTRAINT "nodes_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
