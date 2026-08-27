import { prisma } from "@/lib/prisma";
import { buildMatchesToCreate, type PairForSchedule } from "@/lib/schedule";
import type { NormalizedRosterRow } from "@/lib/validation";
import type { TeamCode } from "@/generated/prisma/enums";

export interface ApplyRosterResult {
  teamACount: number;
  teamBCount: number;
  matchCount: number;
}

/**
 * Wipes the current tournament's pairs/matches and replaces them with the
 * given roster rows, then auto-generates the full bipartite round-robin
 * schedule per group tier. Runs as a single transaction so a failure at any
 * step leaves the previous dataset untouched.
 */
export async function applyRosterRows(rows: NormalizedRosterRow[]): Promise<ApplyRosterResult> {
  return prisma.$transaction(async (tx) => {
    await tx.match.deleteMany({});
    await tx.pair.deleteMany({});

    const teamA = await tx.team.upsert({
      where: { code: "A" },
      create: { code: "A" },
      update: {},
    });
    const teamB = await tx.team.upsert({
      where: { code: "B" },
      create: { code: "B" },
      update: {},
    });

    const teamIdByCode: Record<TeamCode, string> = {
      A: teamA.id,
      B: teamB.id,
    };
    const teamCodeById: Record<string, TeamCode> = {
      [teamA.id]: "A",
      [teamB.id]: "B",
    };

    await tx.pair.createMany({
      data: rows.map((row) => ({
        teamId: teamIdByCode[row.team],
        groupTier: row.groupTier,
        pairNumber: row.pairNumber,
        player1Name: row.player1Name,
        player2Name: row.player2Name,
      })),
    });

    const createdPairs = await tx.pair.findMany({
      select: { id: true, teamId: true, groupTier: true },
    });

    const pairsForSchedule: PairForSchedule[] = createdPairs.map((pair) => ({
      id: pair.id,
      team: teamCodeById[pair.teamId],
      groupTier: pair.groupTier,
    }));

    const matchesToCreate = buildMatchesToCreate(pairsForSchedule);

    await tx.match.createMany({ data: matchesToCreate });

    const teamACount = rows.filter((row) => row.team === "A").length;
    const teamBCount = rows.filter((row) => row.team === "B").length;

    return {
      teamACount,
      teamBCount,
      matchCount: matchesToCreate.length,
    };
  });
}
