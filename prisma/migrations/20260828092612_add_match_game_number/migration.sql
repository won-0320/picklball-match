-- AlterTable: add the column nullable first so existing rows can be backfilled
ALTER TABLE "Match" ADD COLUMN "gameNumber" INTEGER;

-- Backfill: number existing matches 1..N within each group tier, in a stable
-- order (createdAt then id) so the values are deterministic.
WITH numbered AS (
    SELECT
        "id",
        ROW_NUMBER() OVER (
            PARTITION BY "groupTier"
            ORDER BY "createdAt", "id"
        ) AS rn
    FROM "Match"
)
UPDATE "Match" m
SET "gameNumber" = n.rn
FROM numbered n
WHERE m."id" = n."id";

-- Now that every row has a value, enforce NOT NULL.
ALTER TABLE "Match" ALTER COLUMN "gameNumber" SET NOT NULL;
