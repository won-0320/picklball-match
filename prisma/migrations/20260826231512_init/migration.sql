-- CreateEnum
CREATE TYPE "GroupTier" AS ENUM ('UPPER', 'LOWER');

-- CreateEnum
CREATE TYPE "TeamCode" AS ENUM ('A', 'B');

-- CreateEnum
CREATE TYPE "MatchStatus" AS ENUM ('PENDING', 'COMPLETED');

-- CreateTable
CREATE TABLE "Team" (
    "id" TEXT NOT NULL,
    "code" "TeamCode" NOT NULL,

    CONSTRAINT "Team_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pair" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "groupTier" "GroupTier" NOT NULL,
    "pairNumber" INTEGER NOT NULL,
    "player1Name" TEXT NOT NULL,
    "player2Name" TEXT NOT NULL,

    CONSTRAINT "Pair_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Match" (
    "id" TEXT NOT NULL,
    "groupTier" "GroupTier" NOT NULL,
    "teamAPairId" TEXT NOT NULL,
    "teamBPairId" TEXT NOT NULL,
    "teamAScore" INTEGER,
    "teamBScore" INTEGER,
    "status" "MatchStatus" NOT NULL DEFAULT 'PENDING',
    "winner" "TeamCode",
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Match_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Team_code_key" ON "Team"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Pair_teamId_groupTier_pairNumber_key" ON "Pair"("teamId", "groupTier", "pairNumber");

-- AddForeignKey
ALTER TABLE "Pair" ADD CONSTRAINT "Pair_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_teamAPairId_fkey" FOREIGN KEY ("teamAPairId") REFERENCES "Pair"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_teamBPairId_fkey" FOREIGN KEY ("teamBPairId") REFERENCES "Pair"("id") ON DELETE CASCADE ON UPDATE CASCADE;
