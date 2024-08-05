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
