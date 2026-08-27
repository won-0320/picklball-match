import { prisma } from "@/lib/prisma";
import { buildMatchesToCreate, type PairForSchedule } from "@/lib/schedule";
import type { NormalizedRosterRow } from "@/lib/validation";
import type { TeamCode, GroupTier } from "@/generated/prisma/enums";

export interface SaveRosterResult {
  teamACount: number;
  teamBCount: number;
}

/**
 * Replaces the roster for whichever team(s) are present in the given rows,
 * leaving the other team's previously saved pairs untouched — so A and B
 * can be saved independently, at different times, without one submission
 * wiping the other. Deleting a team's pairs cascades to delete any matches
 * that referenced them (every match spans both teams, so any roster change
 * invalidates the existing schedule; re-run "대진 생성" afterwards).
 * Does NOT generate the match schedule itself — that's a separate explicit
 * step (see generateSchedule). Runs as a single transaction so a failure at
 * any step leaves the previous dataset intact.
 */
export async function saveRosterRows(rows: NormalizedRosterRow[]): Promise<SaveRosterResult> {
  const teamsInSubmission = Array.from(new Set(rows.map((row) => row.team)));

  return prisma.$transaction(async (tx) => {
    await tx.team.upsert({ where: { code: "A" }, create: { code: "A" }, update: {} });
    await tx.team.upsert({ where: { code: "B" }, create: { code: "B" }, update: {} });

    await tx.pair.deleteMany({ where: { team: { code: { in: teamsInSubmission } } } });

    const teams = await tx.team.findMany({ where: { code: { in: teamsInSubmission } } });
    const teamIdByCode = Object.fromEntries(teams.map((team) => [team.code, team.id])) as Record<
      TeamCode,
      string
    >;

    await tx.pair.createMany({
      data: rows.map((row) => ({
        teamId: teamIdByCode[row.team],
        groupTier: row.groupTier,
        pairNumber: row.pairNumber,
        player1Name: row.player1Name,
        player2Name: row.player2Name,
      })),
    });

    const [teamACount, teamBCount] = await Promise.all([
      tx.pair.count({ where: { team: { code: "A" } } }),
      tx.pair.count({ where: { team: { code: "B" } } }),
    ]);

    return { teamACount, teamBCount };
  });
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
