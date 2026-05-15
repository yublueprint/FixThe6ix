-- CreateTable
CREATE TABLE "import_batches" (
    "id" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "row_count" INTEGER,
    "success_count" INTEGER,
    "error_count" INTEGER,
    "error_summary" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "import_batches_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "import_batches_status_check" CHECK ("status" IN ('pending', 'processing', 'completed', 'failed'))
);

-- CreateIndex
CREATE INDEX "import_batches_status_idx" ON "import_batches"("status");

-- CreateIndex
CREATE INDEX "import_batches_created_at_idx" ON "import_batches"("created_at");
