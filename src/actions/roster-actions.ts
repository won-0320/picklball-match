"use server";

import { isAdminAuthenticated } from "@/lib/auth";
import { parseRosterFile, validateRosterRows } from "@/lib/excel";
import {
  saveRosterRows,
  generateSchedule,
  clearRoster,
  updatePairPlayers,
  deletePair,
  type SaveRosterResult,
} from "@/lib/roster";
import type { RawRosterRow } from "@/lib/validation";

export interface UploadRosterState {
  errors?: string[];
  success?: SaveRosterResult;
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

  const success = await saveRosterRows(parsed.rows);
  return { success };
}

export interface SubmitManualRosterResult {
  success: boolean;
  errors?: string[];
  data?: SaveRosterResult;
}

export async function submitManualRoster(
  rawRows: RawRosterRow[]
): Promise<SubmitManualRosterResult> {
  if (!(await isAdminAuthenticated())) {
    return { success: false, errors: ["관리자 인증이 필요합니다."] };
  }

  if (rawRows.length === 0) {
    return { success: false, errors: ["최소 한 개 이상의 조를 입력해주세요."] };
  }

  const parsed = validateRosterRows(rawRows);
  if (!parsed.success) {
    return { success: false, errors: parsed.errors };
  }

  const data = await saveRosterRows(parsed.rows);
  return { success: true, data };
}

export interface GenerateMatchesResult {
  success: boolean;
  message?: string;
  matchCount?: number;
}

export async function generateMatches(): Promise<GenerateMatchesResult> {
  if (!(await isAdminAuthenticated())) {
    return { success: false, message: "관리자 인증이 필요합니다." };
  }

  const { matchCount } = await generateSchedule();
  return { success: true, matchCount };
}

export interface MutatePairResult {
  success: boolean;
  message?: string;
}

export async function updatePairAction(
  id: string,
  player1Name: string,
  player2Name: string
): Promise<MutatePairResult> {
  if (!(await isAdminAuthenticated())) {
    return { success: false, message: "관리자 인증이 필요합니다." };
  }

  const p1 = player1Name.trim();
  const p2 = player2Name.trim();
  if (!p1 || !p2) {
    return { success: false, message: "선수1과 선수2 이름을 모두 입력해주세요." };
  }

  await updatePairPlayers(id, p1, p2);
  return { success: true };
}

export async function deletePairAction(id: string): Promise<MutatePairResult> {
  if (!(await isAdminAuthenticated())) {
    return { success: false, message: "관리자 인증이 필요합니다." };
  }

  await deletePair(id);
  return { success: true };
}

export interface ClearRosterResult {
  success: boolean;
  message?: string;
}

export async function clearRosterAction(): Promise<ClearRosterResult> {
  if (!(await isAdminAuthenticated())) {
    return { success: false, message: "관리자 인증이 필요합니다." };
  }

  await clearRoster();
  return { success: true };
}
