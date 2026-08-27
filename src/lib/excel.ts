import * as XLSX from "xlsx";
import {
  validateRosterRow,
  GROUP_TIER_LABEL,
  type NormalizedRosterRow,
  type RawRosterRow,
} from "@/lib/validation";

export interface ParseRosterResult {
  success: boolean;
  rows: NormalizedRosterRow[];
  errors: string[];
}

/**
 * Parses a roster Excel file into raw rows and hands off to
 * validateRosterRows for the actual validation.
 */
export function parseRosterFile(buffer: Buffer): ParseRosterResult {
  let workbook: XLSX.WorkBook;
  try {
    workbook = XLSX.read(buffer, { type: "buffer" });
  } catch {
    return { success: false, rows: [], errors: ["엑셀 파일을 읽을 수 없습니다. 파일 형식을 확인해주세요."] };
  }

  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    return { success: false, rows: [], errors: ["엑셀 파일에 시트가 없습니다."] };
  }

  const sheet = workbook.Sheets[sheetName];
  const rawRows = XLSX.utils.sheet_to_json<RawRosterRow>(sheet, { defval: "" });

  if (rawRows.length === 0) {
    return { success: false, rows: [], errors: ["엑셀 파일에 데이터 행이 없습니다."] };
  }

  // header is row 1, so data rows start at row 2
  return validateRosterRows(rawRows, 2);
}

/**
 * Fully validates a collection of raw roster rows (from an Excel file or
 * from the manual-entry form) before any DB write. Every row is checked;
 * all errors are collected so the admin can fix everything in one pass
 * instead of a fix-one-error-at-a-time loop.
 */
export function validateRosterRows(
  rawRows: RawRosterRow[],
  startRow: number = 1
): ParseRosterResult {
  const errors: string[] = [];

  const validRows: NormalizedRosterRow[] = [];
  rawRows.forEach((raw, index) => {
    const rowNumber = index + startRow;
    const result = validateRosterRow(raw, rowNumber);
    if (result.errors.length > 0) {
      errors.push(...result.errors);
    } else if (result.row) {
      validRows.push(result.row);
    }
  });

  // Duplicate (team, groupTier, pairNumber) check across the whole file
  const seen = new Map<string, number>();
  validRows.forEach((row) => {
    const key = `${row.team}-${row.groupTier}-${row.pairNumber}`;
    seen.set(key, (seen.get(key) ?? 0) + 1);
  });
  for (const [key, count] of seen) {
    if (count > 1) {
      const [team, groupTier, pairNumber] = key.split("-") as [string, "UPPER" | "LOWER", string];
      const groupLabel = GROUP_TIER_LABEL[groupTier];
      errors.push(
        `팀 ${team} ${groupLabel} 그룹에 조번호 ${pairNumber}가 ${count}번 중복되었습니다.`
      );
    }
  }

  if (errors.length > 0) {
    return { success: false, rows: [], errors };
  }

  // Warn (non-fatal is not an option here since we want a single pass;
  // treat a group tier with pairs only on one team's side as a hard error,
  // since it would silently produce zero matches for that tier)
  for (const groupTier of ["UPPER", "LOWER"] as const) {
    const aCount = validRows.filter((r) => r.team === "A" && r.groupTier === groupTier).length;
    const bCount = validRows.filter((r) => r.team === "B" && r.groupTier === groupTier).length;
    const groupLabel = GROUP_TIER_LABEL[groupTier];
    if (aCount === 0 && bCount === 0) continue; // tier simply unused, fine
    if (aCount === 0 || bCount === 0) {
      errors.push(
        `${groupLabel} 그룹은 한쪽 팀에만 조가 있어 대진을 생성할 수 없습니다 (A팀 ${aCount}조, B팀 ${bCount}조).`
      );
    }
  }

  if (errors.length > 0) {
    return { success: false, rows: [], errors };
  }

  return { success: true, rows: validRows, errors: [] };
}
