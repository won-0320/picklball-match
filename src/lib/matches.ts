import { prisma } from "@/lib/prisma";
import { computeStandings } from "@/lib/standings";
import type { GroupTier, MatchStatus } from "@/generated/prisma/enums";

export interface MatchPairDTO {
  pairNumber: number;
  player1Name: string;
  player2Name: string;
}

export interface MatchDTO {
  id: string;
  groupTier: GroupTier;
  status: MatchStatus;
  teamAScore: number | null;
  teamBScore: number | null;
  teamAPair: MatchPairDTO;
  teamBPair: MatchPairDTO;
}

export interface MatchListData {
  standings: { teamAWins: number; teamBWins: number };
  upper: MatchDTO[];
  lower: MatchDTO[];
}

export async function getMatchListData(): Promise<MatchListData> {
  const [standings, matches] = await Promise.all([
    computeStandings(),
    prisma.match.findMany({
      include: { teamAPair: true, teamBPair: true },
      orderBy: [{ createdAt: "asc" }],
    }),
  ]);

  const toDTO = (match: (typeof matches)[number]): MatchDTO => ({
    id: match.id,
    groupTier: match.groupTier,
    status: match.status,
    teamAScore: match.teamAScore,
    teamBScore: match.teamBScore,
    teamAPair: {
      pairNumber: match.teamAPair.pairNumber,
      player1Name: match.teamAPair.player1Name,
      player2Name: match.teamAPair.player2Name,
    },
    teamBPair: {
      pairNumber: match.teamBPair.pairNumber,
      player1Name: match.teamBPair.player1Name,
      player2Name: match.teamBPair.player2Name,
    },
  });

  return {
    standings,
    upper: matches.filter((m) => m.groupTier === "UPPER").map(toDTO),
    lower: matches.filter((m) => m.groupTier === "LOWER").map(toDTO),
  };
}
