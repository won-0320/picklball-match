import { prisma } from "@/lib/prisma";

export interface Standings {
  teamAWins: number;
  teamBWins: number;
}

export async function computeStandings(): Promise<Standings> {
  const results = await prisma.match.groupBy({
    by: ["winner"],
    where: { status: "COMPLETED" },
    _count: { _all: true },
  });

  let teamAWins = 0;
  let teamBWins = 0;
  for (const result of results) {
    if (result.winner === "A") teamAWins = result._count._all;
    if (result.winner === "B") teamBWins = result._count._all;
  }

  return { teamAWins, teamBWins };
}
