import { z } from "zod";

const TEAM_LABEL_TO_CODE: Record<string, "A" | "B"> = {
  A: "A",
  B: "B",
  팀A: "A",
  팀B: "B",
  "A팀": "A",
  "B팀": "B",
};

export const GROUP_TIER_LABEL: Record<"UPPER" | "LOWER", string> = {
  UPPER: "3.5 이상",
  LOWER: "3.0 이하",
};

const GROUP_LABEL_TO_TIER: Record<string, "UPPER" | "LOWER"> = {
  "3.5 이상": "UPPER",
  "3.5이상": "UPPER",
  "3.0 이하": "LOWER",
  "3.0이하": "LOWER",
};

export const RAW_ROSTER_HEADERS = ["팀", "그룹", "조번호", "선수1", "선수2"] as const;

export interface RawRosterRow {
  팀?: unknown;
  그룹?: unknown;
  조번호?: unknown;
  선수1?: unknown;
  선수2?: unknown;
}

export interface NormalizedRosterRow {
  team: "A" | "B";
  groupTier: "UPPER" | "LOWER";
  pairNumber: number;
  player1Name: string;
  player2Name: string;
}

function normalizeText(value: unknown): string {
  return String(value ?? "").trim();
}

export interface RosterRowValidationResult {
  row?: NormalizedRosterRow;
  errors: string[];
}

/**
 * Validates a single raw Excel row (1-indexed row number is passed in purely
 * for error message context, not used in logic).
 */
export function validateRosterRow(
  raw: RawRosterRow,
  rowNumber: number
): RosterRowValidationResult {
  const errors: string[] = [];

  const teamLabel = normalizeText(raw["팀"]);
  const groupLabel = normalizeText(raw["그룹"]);
  const pairNumberRaw = normalizeText(raw["조번호"]);
  const player1Name = normalizeText(raw["선수1"]);
  const player2Name = normalizeText(raw["선수2"]);

  const team = TEAM_LABEL_TO_CODE[teamLabel];
  if (!team) {
    errors.push(`${rowNumber}행: 팀 값은 'A' 또는 'B'여야 합니다 (입력값: '${teamLabel}')`);
  }

  const groupTier = GROUP_LABEL_TO_TIER[groupLabel];
  if (!groupTier) {
    errors.push(
      `${rowNumber}행: 그룹 값은 '${GROUP_TIER_LABEL.UPPER}' 또는 '${GROUP_TIER_LABEL.LOWER}'여야 합니다 (입력값: '${groupLabel}')`
    );
  }

  const pairNumberParsed = z.coerce
    .number()
    .int()
    .positive()
    .safeParse(pairNumberRaw);
  if (!pairNumberParsed.success) {
    errors.push(`${rowNumber}행: 조번호는 양의 정수여야 합니다 (입력값: '${pairNumberRaw}')`);
  }

  if (!player1Name) {
    errors.push(`${rowNumber}행: 선수1 이름이 비어 있습니다`);
  }
  if (!player2Name) {
    errors.push(`${rowNumber}행: 선수2 이름이 비어 있습니다`);
  }

  if (errors.length > 0) {
    return { errors };
  }

  return {
    errors: [],
    row: {
      team: team!,
      groupTier: groupTier!,
      pairNumber: pairNumberParsed.data!,
      player1Name,
      player2Name,
    },
  };
}

export const ScoreSubmissionSchema = z
  .object({
    matchId: z.string().min(1),
    teamAScore: z.coerce.number().int().nonnegative(),
    teamBScore: z.coerce.number().int().nonnegative(),
  })
  .refine((data) => data.teamAScore !== data.teamBScore, {
    error: "두 팀의 점수는 같을 수 없습니다.",
    path: ["teamBScore"],
  });

export type ScoreSubmissionInput = z.infer<typeof ScoreSubmissionSchema>;

export const AdminMatchUpdateSchema = z
  .object({
    matchId: z.string().min(1),
    teamAScore: z.coerce.number().int().nonnegative().nullable(),
    teamBScore: z.coerce.number().int().nonnegative().nullable(),
  })
  .refine(
    (data) =>
      (data.teamAScore === null && data.teamBScore === null) ||
      (data.teamAScore !== null &&
        data.teamBScore !== null &&
        data.teamAScore !== data.teamBScore),
    {
      error: "두 팀의 점수는 같을 수 없습니다.",
      path: ["teamBScore"],
    }
  );

export type AdminMatchUpdateInput = z.infer<typeof AdminMatchUpdateSchema>;
