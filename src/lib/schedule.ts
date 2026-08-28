import type { GroupTier, TeamCode } from "@/generated/prisma/enums";

export interface PairForSchedule {
  id: string;
  team: TeamCode;
  groupTier: GroupTier;
}

export interface MatchToCreate {
  groupTier: GroupTier;
  gameNumber: number;
  teamAPairId: string;
  teamBPairId: string;
}

interface Bout {
  teamAPairId: string;
  teamBPairId: string;
}

/**
 * Orders the bouts of one group tier so that no pair plays two games back
 * to back. Games are run one at a time in schedule order, so the naive
 * nested-loop order (a1 vs b1, a1 vs b2, ...) forces the same pair onto the
 * court many times in a row. This is a greedy reorder: at each step pick a
 * remaining bout that shares no pair with the previous game, preferring the
 * bout whose pairs still have the most games left so nobody gets stranded
 * at the end. With every pair playing >= 2 games (true for any tier with at
 * least two Team A and two Team B pairs) this yields a fully gap-free order;
 * degenerate tiers just fall back to the best achievable.
 */
function orderWithoutConsecutivePairs(bouts: Bout[]): Bout[] {
  const remaining = new Map<string, number>();
  for (const bout of bouts) {
    remaining.set(bout.teamAPairId, (remaining.get(bout.teamAPairId) ?? 0) + 1);
    remaining.set(bout.teamBPairId, (remaining.get(bout.teamBPairId) ?? 0) + 1);
  }

  const pool = [...bouts];
  const ordered: Bout[] = [];
  let prevA: string | null = null;
  let prevB: string | null = null;

  while (pool.length > 0) {
    const conflictFree = pool.filter(
      (b) =>
        b.teamAPairId !== prevA &&
        b.teamBPairId !== prevB &&
        b.teamAPairId !== prevB &&
        b.teamBPairId !== prevA,
    );
    const candidates = conflictFree.length > 0 ? conflictFree : pool;

    const score = (b: Bout) => {
      const ra = remaining.get(b.teamAPairId) ?? 0;
      const rb = remaining.get(b.teamBPairId) ?? 0;
      return Math.max(ra, rb) * 100 + (ra + rb);
    };

    let bestIndexInPool = pool.indexOf(candidates[0]);
    let bestScore = score(candidates[0]);
    for (const b of candidates) {
      const s = score(b);
      if (s > bestScore) {
        bestScore = s;
        bestIndexInPool = pool.indexOf(b);
      }
    }

    const [chosen] = pool.splice(bestIndexInPool, 1);
    ordered.push(chosen);
    remaining.set(chosen.teamAPairId, (remaining.get(chosen.teamAPairId) ?? 1) - 1);
    remaining.set(chosen.teamBPairId, (remaining.get(chosen.teamBPairId) ?? 1) - 1);
    prevA = chosen.teamAPairId;
    prevB = chosen.teamBPairId;
  }

  return ordered;
}

/**
 * Full bipartite round robin per group tier: every Team A pair in a tier
 * plays every Team B pair in the same tier exactly once. Team A/B pair
 * counts within a tier may differ. Matches are then reordered so the same
 * pair never plays two games in a row (see orderWithoutConsecutivePairs),
 * and each match gets a sequential gameNumber (1..N) within its group tier,
 * assigned here so it stays fixed for the life of the schedule regardless
 * of the order matches are read back in.
 */
export function buildMatchesToCreate(pairs: PairForSchedule[]): MatchToCreate[] {
  const tiers: GroupTier[] = ["UPPER", "LOWER"];
  const matches: MatchToCreate[] = [];

  for (const groupTier of tiers) {
    const teamAPairs = pairs.filter((p) => p.team === "A" && p.groupTier === groupTier);
    const teamBPairs = pairs.filter((p) => p.team === "B" && p.groupTier === groupTier);

    const bouts: Bout[] = [];
    for (const a of teamAPairs) {
      for (const b of teamBPairs) {
        bouts.push({ teamAPairId: a.id, teamBPairId: b.id });
      }
    }

    const ordered = orderWithoutConsecutivePairs(bouts);
    ordered.forEach((bout, index) => {
      matches.push({
        groupTier,
        gameNumber: index + 1,
        teamAPairId: bout.teamAPairId,
        teamBPairId: bout.teamBPairId,
      });
    });
  }

  return matches;
}
