import { prisma } from "@/lib/prisma";
import { buildMatchesToCreate, type PairForSchedule } from "@/lib/schedule";
import type { NormalizedRosterRow } from "@/lib/validation";
import type { TeamCode, GroupTier } from "@/generated/prisma/enums";

export interface SaveRosterResult {
  teamACount: number;
  teamBCount: number;
}

/**
 * Adds/updates the given roster rows without deleting anything that isn't
 * mentioned in this submission. Each row is upserted by its
 * (team, groupTier, pairNumber) key: a matching existing pair has its
 * player names updated in place (so any matches already generated for it
 * stay valid); a new key creates a new pair. This lets an admin save a
 * roster incrementally, in separate submissions (one team at a time, or a
 * few pairs at a time) without earlier saves disappearing. To fully start
 * over, use clearRoster() explicitly instead. Runs as a single transaction
 * so a failure at any step leaves the previous dataset intact.
 */
export async function saveRosterRows(rows: NormalizedRosterRow[]): Promise<SaveRosterResult> {
  return prisma.$transaction(async (tx) => {
    const teamA = await tx.team.upsert({ where: { code: "A" }, create: { code: "A" }, update: {} });
    const teamB = await tx.team.upsert({ where: { code: "B" }, create: { code: "B" }, update: {} });

    const teamIdByCode: Record<TeamCode, string> = { A: teamA.id, B: teamB.id };

    for (const row of rows) {
      const teamId = teamIdByCode[row.team];
      await tx.pair.upsert({
        where: {
          teamId_groupTier_pairNumber: {
            teamId,
            groupTier: row.groupTier,
            pairNumber: row.pairNumber,
          },
        },
        create: {
          teamId,
          groupTier: row.groupTier,
          pairNumber: row.pairNumber,
          player1Name: row.player1Name,
          player2Name: row.player2Name,
        },
        update: {
          player1Name: row.player1Name,
          player2Name: row.player2Name,
        },
      });
    }

    const [teamACount, teamBCount] = await Promise.all([
      tx.pair.count({ where: { teamId: teamA.id } }),
      tx.pair.count({ where: { teamId: teamB.id } }),
    ]);

    return { teamACount, teamBCount };
  });
}

/**
 * Explicitly wipes every saved pair (and, via FK cascade, every generated
 * match) so the admin can start the roster over from scratch. This is the
 * only thing that deletes roster data — saving never does.
 */
export async function clearRoster(): Promise<void> {
  await prisma.pair.deleteMany({});
}

export interface RosterSummary {
  teamAUpper: number;
  teamALower: number;
  teamBUpper: number;
  teamBLower: number;
  matchCount: number;
}

export async function getRosterSummary(): Promise<RosterSummary> {
  const [pairs, matchCount] = await Promise.all([
    prisma.pair.findMany({ select: { groupTier: true, team: { select: { code: true } } } }),
    prisma.match.count(),
  ]);

  const count = (team: TeamCode, groupTier: GroupTier) =>
    pairs.filter((p) => p.team.code === team && p.groupTier === groupTier).length;

  return {
    teamAUpper: count("A", "UPPER"),
    teamALower: count("A", "LOWER"),
    teamBUpper: count("B", "UPPER"),
    teamBLower: count("B", "LOWER"),
    matchCount,
  };
}

/**
 * (Re)generates the full bipartite round-robin schedule from the pairs
 * currently saved, per group tier. Clears any previously generated matches
 * first, so this is safe to re-run (e.g. after fixing the roster) without
 * leaving stale/duplicate matches behind.
 */
export async function generateSchedule(): Promise<{ matchCount: number }> {
  return prisma.$transaction(async (tx) => {
    await tx.match.deleteMany({});

    const pairs = await tx.pair.findMany({
      select: { id: true, groupTier: true, team: { select: { code: true } } },
    });

    const pairsForSchedule: PairForSchedule[] = pairs.map((pair) => ({
      id: pair.id,
      team: pair.team.code,
      groupTier: pair.groupTier,
    }));

    const matchesToCreate = buildMatchesToCreate(pairsForSchedule);
    await tx.match.createMany({ data: matchesToCreate });

    return { matchCount: matchesToCreate.length };
  });
}
