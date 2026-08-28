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

/**
 * Full bipartite round robin per group tier: every Team A pair in a tier
 * plays every Team B pair in the same tier exactly once. Team A/B pair
 * counts within a tier may differ. Each match gets a sequential gameNumber
 * (1..N) within its group tier, assigned here so it stays fixed for the
 * life of the schedule regardless of the order matches are read back in.
 */
export function buildMatchesToCreate(pairs: PairForSchedule[]): MatchToCreate[] {
  const tiers: GroupTier[] = ["UPPER", "LOWER"];
  const matches: MatchToCreate[] = [];

  for (const groupTier of tiers) {
    const teamAPairs = pairs.filter((p) => p.team === "A" && p.groupTier === groupTier);
    const teamBPairs = pairs.filter((p) => p.team === "B" && p.groupTier === groupTier);

    let gameNumber = 0;
    for (const a of teamAPairs) {
      for (const b of teamBPairs) {
        gameNumber += 1;
        matches.push({ groupTier, gameNumber, teamAPairId: a.id, teamBPairId: b.id });
      }
    }
  }

  return matches;
}
