-- CreateTable
CREATE TABLE "import_staging" (
    "id" TEXT NOT NULL,
    "batch_id" TEXT NOT NULL,
    "raw_store" TEXT NOT NULL,
    "raw_last4" TEXT NOT NULL,
    "raw_amount" TEXT NOT NULL,
    "raw_notes" TEXT,
    "raw_added_by" TEXT,
    "raw_date_added" TEXT,
    "row_number" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "validation_errors" JSONB,
    "resolved_store_id" TEXT,
    "resolved_last4" TEXT,
    "resolved_amount" DECIMAL(10,2),
    "resolved_date_added" TIMESTAMP(3),
    "promoted_card_id" TEXT,
    "promoted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "import_staging_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "import_staging_batch_id_idx" ON "import_staging"("batch_id");
CREATE INDEX "import_staging_status_idx" ON "import_staging"("status");
CREATE INDEX "import_staging_batch_id_status_idx" ON "import_staging"("batch_id", "status");

-- AddForeignKey
ALTER TABLE "import_staging" ADD CONSTRAINT "import_staging_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "import_batches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;