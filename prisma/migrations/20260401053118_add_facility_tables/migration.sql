-- CreateTable
CREATE TABLE "Record" (
    "id" SERIAL NOT NULL,
    "year" INTEGER NOT NULL,
    "factory" TEXT NOT NULL,
    "process" TEXT NOT NULL,
    "month" INTEGER NOT NULL,
    "runTime" DOUBLE PRECISION NOT NULL,
    "downCount" INTEGER NOT NULL,
    "downTime" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Record_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IncidentRecord" (
    "id" SERIAL NOT NULL,
    "no" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "day" INTEGER NOT NULL,
    "startTime" TEXT,
    "endTime" TEXT,
    "durationMin" DOUBLE PRECISION,
    "equipment" TEXT NOT NULL,
    "subEquipment" TEXT,
    "repairItem" TEXT,
    "incidentType" TEXT,
    "description" TEXT,
    "offRepairCount" INTEGER,
    "offRepairTime" DOUBLE PRECISION,
    "pmRepairCount" INTEGER,
    "pmRepairTime" DOUBLE PRECISION,
    "runRepairCount" INTEGER,
    "runRepairTime" DOUBLE PRECISION,
    "stopRepairCount" INTEGER,
    "stopRepairTime" DOUBLE PRECISION,
    "cause" TEXT,
    "technician" TEXT,
    "technicianCount" INTEGER,
    "repairTime" DOUBLE PRECISION,
    "quarter" TEXT,
    "yearMonth" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IncidentRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RepairTypeRecord" (
    "id" SERIAL NOT NULL,
    "no" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "day" INTEGER NOT NULL,
    "equipment" TEXT NOT NULL,
    "subEquipment" TEXT,
    "repairItem" TEXT,
    "incidentType" TEXT,
    "description" TEXT,
    "cause" TEXT,
    "technician" TEXT,
    "technicianCount" INTEGER,
    "repairTime" DOUBLE PRECISION,
    "repairType" TEXT,
    "count" INTEGER,
    "durationMin" DOUBLE PRECISION,
    "managementType" TEXT,
    "quarter" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RepairTypeRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Record_year_factory_process_month_key" ON "Record"("year", "factory", "process", "month");
