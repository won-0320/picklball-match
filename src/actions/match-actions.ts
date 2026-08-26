"use server";

import { prisma } from "@/lib/prisma";
import { isAdminAuthenticated } from "@/lib/auth";
import {
  AdminMatchUpdateSchema,
  ScoreSubmissionSchema,
} from "@/lib/validation";
import type { TeamCode } from "@/generated/prisma/enums";

export interface SubmitScoreResult {
  success: boolean;
  message?: string;
  recordedTeamAScore?: number;
  recordedTeamBScore?: number;
}

export async function submitScore(
  matchId: string,
  teamAScore: number,
  teamBScore: number
): Promise<SubmitScoreResult> {
  const parsed = ScoreSubmissionSchema.safeParse({ matchId, teamAScore, teamBScore });
  if (!parsed.success) {
    return {
      success: false,
      message: parsed.error.issues[0]?.message ?? "입력값이 올바르지 않습니다.",
    };
  }

  const winner: TeamCode = parsed.data.teamAScore > parsed.data.teamBScore ? "A" : "B";

  const updateResult = await prisma.match.updateMany({
    where: { id: parsed.data.matchId, status: "PENDING" },
    data: {
      teamAScore: parsed.data.teamAScore,
      teamBScore: parsed.data.teamBScore,
      status: "COMPLETED",
      winner,
      completedAt: new Date(),
    },
  });

  if (updateResult.count === 1) {
    return { success: true };
  }

  const existing = await prisma.match.findUnique({ where: { id: parsed.data.matchId } });
  if (!existing) {
    return { success: false, message: "존재하지 않는 매치입니다." };
  }

  return {
    success: false,
    message: "이미 다른 사람이 이 경기 결과를 입력했습니다.",
    recordedTeamAScore: existing.teamAScore ?? undefined,
    recordedTeamBScore: existing.teamBScore ?? undefined,
  };
}

export interface AdminUpdateMatchResult {
  success: boolean;
  message?: string;
}

export async function adminUpdateMatch(
  matchId: string,
  teamAScore: number | null,
  teamBScore: number | null
): Promise<AdminUpdateMatchResult> {
  if (!(await isAdminAuthenticated())) {
    return { success: false, message: "관리자 인증이 필요합니다." };
  }

  const parsed = AdminMatchUpdateSchema.safeParse({ matchId, teamAScore, teamBScore });
  if (!parsed.success) {
    return {
      success: false,
      message: parsed.error.issues[0]?.message ?? "입력값이 올바르지 않습니다.",
    };
  }

  if (parsed.data.teamAScore === null || parsed.data.teamBScore === null) {
    await prisma.match.update({
      where: { id: parsed.data.matchId },
      data: {
        teamAScore: null,
        teamBScore: null,
        status: "PENDING",
        winner: null,
        completedAt: null,
      },
    });
    return { success: true };
  }

  const winner: TeamCode = parsed.data.teamAScore > parsed.data.teamBScore ? "A" : "B";

  await prisma.match.update({
    where: { id: parsed.data.matchId },
    data: {
      teamAScore: parsed.data.teamAScore,
      teamBScore: parsed.data.teamBScore,
      status: "COMPLETED",
      winner,
      completedAt: new Date(),
    },
  });

  return { success: true };
}
