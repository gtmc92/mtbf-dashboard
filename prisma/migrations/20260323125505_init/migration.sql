-- CreateTable
CREATE TABLE "Factory" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Factory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Process" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "factoryId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Process_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MonthlyRecord" (
    "id" SERIAL NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "processId" INTEGER NOT NULL,
    "operatingTime" DOUBLE PRECISION,
    "stopCount" INTEGER,
    "stopTime" DOUBLE PRECISION,
    "mtbf" DOUBLE PRECISION,
    "mttr" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MonthlyRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Factory_name_key" ON "Factory"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Process_factoryId_name_key" ON "Process"("factoryId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "MonthlyRecord_processId_year_month_key" ON "MonthlyRecord"("processId", "year", "month");

-- AddForeignKey
ALTER TABLE "Process" ADD CONSTRAINT "Process_factoryId_fkey" FOREIGN KEY ("factoryId") REFERENCES "Factory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MonthlyRecord" ADD CONSTRAINT "MonthlyRecord_processId_fkey" FOREIGN KEY ("processId") REFERENCES "Process"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
