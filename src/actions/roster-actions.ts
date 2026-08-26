"use server";

import { prisma } from "@/lib/prisma";
import { isAdminAuthenticated } from "@/lib/auth";
import { parseRosterFile } from "@/lib/excel";
import { buildMatchesToCreate, type PairForSchedule } from "@/lib/schedule";
import type { TeamCode } from "@/generated/prisma/enums";

export interface UploadRosterState {
  errors?: string[];
  success?: {
    teamACount: number;
    teamBCount: number;
    matchCount: number;
  };
}

export async function uploadRoster(
  _prevState: UploadRosterState,
  formData: FormData
): Promise<UploadRosterState> {
  if (!(await isAdminAuthenticated())) {
    return { errors: ["관리자 인증이 필요합니다."] };
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { errors: ["엑셀 파일을 선택해주세요."] };
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const parsed = parseRosterFile(buffer);

  if (!parsed.success) {
    return { errors: parsed.errors };
  }

  const rows = parsed.rows;

  const result = await prisma.$transaction(async (tx) => {
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

  return { success: result };
}
