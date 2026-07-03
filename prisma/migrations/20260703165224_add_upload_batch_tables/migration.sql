-- AlterTable
ALTER TABLE "RepairTypeRecord" ADD COLUMN     "uploadBatchId" INTEGER;

-- CreateTable
CREATE TABLE "UploadBatch" (
    "id" SERIAL NOT NULL,
    "fileName" TEXT NOT NULL,
    "applyMode" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "periodStartYear" INTEGER,
    "periodStartMonth" INTEGER,
    "periodEndYear" INTEGER,
    "periodEndMonth" INTEGER,
    "rowCount" INTEGER NOT NULL,
    "errorCount" INTEGER NOT NULL,
    "warningCount" INTEGER NOT NULL,
    "backupData" JSONB,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "appliedAt" TIMESTAMP(3),
    "revertedAt" TIMESTAMP(3),

    CONSTRAINT "UploadBatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UploadStagingRow" (
    "id" SERIAL NOT NULL,
    "batchId" INTEGER NOT NULL,
    "rowIndex" INTEGER NOT NULL,
    "data" JSONB NOT NULL,
    "errors" JSONB NOT NULL,
    "warnings" JSONB NOT NULL,

    CONSTRAINT "UploadStagingRow_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "RepairTypeRecord" ADD CONSTRAINT "RepairTypeRecord_uploadBatchId_fkey" FOREIGN KEY ("uploadBatchId") REFERENCES "UploadBatch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UploadStagingRow" ADD CONSTRAINT "UploadStagingRow_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "UploadBatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

