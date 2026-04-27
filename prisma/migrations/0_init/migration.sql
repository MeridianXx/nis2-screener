-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "CompanyCache" (
    "orgnr" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "city" TEXT,
    "sniCode" TEXT NOT NULL,
    "sniLabel" TEXT,
    "employees" INTEGER,
    "turnover" DOUBLE PRECISION,
    "balance" DOUBLE PRECISION,
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompanyCache_pkey" PRIMARY KEY ("orgnr")
);

-- CreateTable
CREATE TABLE "AssessmentLog" (
    "id" TEXT NOT NULL,
    "orgnr" TEXT,
    "verdict" TEXT NOT NULL,
    "sector" TEXT,
    "sizeClass" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AssessmentLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExplanationCache" (
    "cacheKey" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExplanationCache_pkey" PRIMARY KEY ("cacheKey")
);

