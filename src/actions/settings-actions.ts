"use server";

import { z } from "zod";
import { isAdminAuthenticated } from "@/lib/auth";
import { setPointsPerWin } from "@/lib/settings";

const PointsPerWinSchema = z.coerce.number().int().min(1).max(1000);

export interface UpdatePointsPerWinResult {
  success: boolean;
  message?: string;
}

export async function updatePointsPerWin(pointsPerWin: number): Promise<UpdatePointsPerWinResult> {
  if (!(await isAdminAuthenticated())) {
    return { success: false, message: "관리자 인증이 필요합니다." };
  }

  const parsed = PointsPerWinSchema.safeParse(pointsPerWin);
  if (!parsed.success) {
    return { success: false, message: "승점은 1 이상 1000 이하의 정수여야 합니다." };
  }

  await setPointsPerWin(parsed.data);
  return { success: true };
}
