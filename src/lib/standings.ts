import { prisma } from "@/lib/prisma";
import { getPointsPerWin } from "@/lib/settings";

export interface Standings {
  teamAWinCount: number;
  teamBWinCount: number;
  teamAPoints: number;
  teamBPoints: number;
  pointsPerWin: number;
}

export async function computeStandings(): Promise<Standings> {
  const [results, pointsPerWin] = await Promise.all([
    prisma.match.groupBy({
      by: ["winner"],
      where: { status: "COMPLETED" },
      _count: { _all: true },
    }),
    getPointsPerWin(),
  ]);

  let teamAWinCount = 0;
  let teamBWinCount = 0;
  for (const result of results) {
    if (result.winner === "A") teamAWinCount = result._count._all;
    if (result.winner === "B") teamBWinCount = result._count._all;
  }

  return {
    teamAWinCount,
    teamBWinCount,
    teamAPoints: teamAWinCount * pointsPerWin,
    teamBPoints: teamBWinCount * pointsPerWin,
    pointsPerWin,
  };
}
